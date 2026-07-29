import type { Server } from 'node:http';
import path from 'node:path';
import express, { type Express } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import type { Config } from './config.js';
import type { Hub } from './hub.js';
import { jobUploadSchema, summarize } from './jobs.js';
import { listPorts } from './ports.js';
import type { ClientMessage } from './protocol.js';

/** Dead sockets hold control hostage, so they get reaped rather than trusted. */
const HEARTBEAT_MS = 30_000;

export type PortLister = () => Promise<Awaited<ReturnType<typeof listPorts>>>;

export type BuildOptions = {
  hub: Hub;
  config: Config;
  version: string;
  /** Injectable so the API can be exercised without a real /dev. */
  ports?: PortLister;
};

/**
 * REST for the things a request/response shape suits — enumerating ports,
 * uploading a job, reading state. The live session is on the WebSocket, because
 * polling for a `tx`/`rx` log at Marlin's line rate is absurd and because a jog
 * or an emergency stop should not wait on a new TCP connection.
 */
export function buildApp({ hub, config, version, ports = listPorts }: BuildOptions): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    next();
  });
  app.options(/.*/, (_req, res) => res.sendStatus(204));

  // A page of art is megabytes of G-code, uploaded in one shot. That is the
  // entire point of the design: the alternative is a network round trip per
  // line, thousands of times over.
  app.use(express.json({ limit: config.MAX_UPLOAD }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, version, uptime: process.uptime() });
  });

  app.get('/api/ports', async (_req, res) => {
    try {
      res.json({ ports: await ports() });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get('/api/state', (_req, res) => {
    res.json(hub.snapshot());
  });

  app.get('/api/jobs', (_req, res) => {
    res.json({ jobs: hub.jobs.list() });
  });

  app.post('/api/jobs', (req, res) => {
    const parsed = jobUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid job', issues: parsed.error.issues });
      return;
    }
    const job = hub.jobs.add(parsed.data);
    res.status(201).json({ job: summarize(job) });
  });

  app.get('/api/jobs/:id', (req, res) => {
    const job = hub.jobs.get(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'No such job' });
      return;
    }
    // The G-code is only sent back when asked for; it is the bulk of the job
    // and no view needs it.
    res.json(req.query.lines === '1' ? { job } : { job: summarize(job) });
  });

  app.delete('/api/jobs/:id', (req, res) => {
    if (hub.runner.view?.job.id === req.params.id && hub.runner.isActive) {
      res.status(409).json({ error: 'That job is running' });
      return;
    }
    res.status(hub.jobs.delete(req.params.id) ? 204 : 404).end();
  });

  /**
   * Emergency stop over plain HTTP as well as the socket. If the WebSocket is
   * wedged — which is exactly when you most want to stop the machine — a `curl`
   * or a bookmark still works.
   */
  app.post('/api/estop', async (_req, res) => {
    try {
      await hub.emergencyStop();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: (e as Error).message });
    }
  });

  // An unknown endpoint under /api answers as an API, not as Express's default
  // HTML error page — otherwise a client parsing the reply as JSON reports a
  // syntax error instead of a 404.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'No such endpoint' });
  });

  if (config.CLIENT_DIR) serveClient(app, config.CLIENT_DIR);

  return app;
}

/**
 * Serve the built renderer from the same process and the same origin as the
 * API. One container, one port, one thing to start on the Pi — and no CORS or
 * mixed-origin WebSocket question to answer, because the page is served by the
 * server it talks to.
 */
function serveClient(app: Express, dir: string) {
  app.use(
    express.static(dir, {
      // Vite fingerprints everything it emits into `assets/`, so those may be
      // cached forever. `index.html` must not be: it is the file that names the
      // current fingerprints, and a Pi handing out a stale one serves a blank
      // page after every deploy.
      index: false,
      setHeaders: (res, filePath) => {
        const fingerprinted = filePath.includes(`${path.sep}assets${path.sep}`);
        res.setHeader(
          'Cache-Control',
          fingerprinted ? 'public, max-age=31536000, immutable' : 'no-cache',
        );
      },
    }),
  );

  // SPA fallback: client-side routes are not files on disk, so anything that
  // isn't the API and isn't a static asset gets the shell. Scoped away from
  // /api so a typo'd endpoint 404s as JSON-ish rather than silently returning
  // an HTML page that the client then fails to parse.
  app.get(/^(?!\/api(\/|$)).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile('index.html', { root: dir });
  });
}

/** Attach the session WebSocket to an already-listening HTTP server. */
export function attachWebSocket(server: Server, hub: Hub) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    const client = hub.addClient((msg) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg));
    });
    let alive = true;
    socket.on('pong', () => {
      alive = true;
    });

    socket.on('message', async (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ type: 'ack', id: '', ok: false, error: 'Malformed JSON' }));
        return;
      }
      const result = await hub.handle(client.id, msg);
      if (msg.id) {
        socket.send(
          JSON.stringify({
            type: 'ack',
            id: msg.id,
            ok: result.ok,
            error: result.error,
            data: result.data,
          }),
        );
      }
      if (msg.type === 'ping') socket.send(JSON.stringify({ type: 'pong' }));
    });

    socket.on('close', () => hub.removeClient(client.id));

    const heartbeat = setInterval(() => {
      if (!alive) {
        socket.terminate();
        return;
      }
      alive = false;
      socket.ping();
    }, HEARTBEAT_MS);
    socket.on('close', () => clearInterval(heartbeat));
  });

  return wss;
}
