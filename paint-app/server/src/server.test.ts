import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { loadConfig } from './config.js';
import { Hub } from './hub.js';
import type { ClientMessage, JobSummary, PortInfo, ServerMessage } from './protocol.js';
import { attachWebSocket, buildApp } from './server.js';
import { FAST_TIMING, FakeMarlin } from './test/fakeMarlin.js';

const sampleJob = {
  name: 'page 1',
  plotterName: 'Ender-3 V3 SE',
  prologue: ['G21', 'G90'],
  layers: [
    { name: 'Ink', color: '#000000', lines: ['G0 X1 Y1', 'G1 X2 Y2'] },
    { name: 'Red', color: '#ff0000', lines: ['G0 X3 Y3', 'G1 X4 Y4'] },
  ],
  epilogue: ['M84'],
};

/** A client that speaks the protocol the way the React app will. */
class TestClient {
  readonly received: ServerMessage[] = [];
  private nextId = 0;
  private pending = new Map<string, (msg: Extract<ServerMessage, { type: 'ack' }>) => void>();

  private constructor(private readonly socket: WebSocket) {}

  static async connect(url: string) {
    const socket = new WebSocket(url);
    const client = new TestClient(socket);
    socket.on('message', (raw) => {
      const msg = JSON.parse(raw.toString()) as ServerMessage;
      client.received.push(msg);
      if (msg.type === 'ack') client.pending.get(msg.id)?.(msg);
    });
    await new Promise((resolve, reject) => {
      socket.once('open', resolve);
      socket.once('error', reject);
    });
    await client.waitFor((m) => m.type === 'hello');
    return client;
  }

  /** Send and await the matching ack, the way a real caller would. */
  request(msg: ClientMessage) {
    const id = `r${this.nextId++}`;
    return new Promise<Extract<ServerMessage, { type: 'ack' }>>((resolve) => {
      this.pending.set(id, resolve);
      this.socket.send(JSON.stringify({ ...msg, id }));
    });
  }

  async waitFor(pred: (m: ServerMessage) => boolean, ms = 2000) {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      const hit = this.received.find(pred);
      if (hit) return hit;
      await new Promise((r) => setTimeout(r, 5));
    }
    throw new Error('timed out waiting for a message');
  }

  close() {
    this.socket.close();
  }
}

describe('http + websocket', () => {
  let hub: Hub;
  let server: Server;
  let board: FakeMarlin;
  let base: string;
  let wsUrl: string;

  beforeEach(async () => {
    board = new FakeMarlin();
    hub = new Hub({ connection: { transport: board.transport, timing: FAST_TIMING } });
    const config = loadConfig({ PORT: '0' } as NodeJS.ProcessEnv);
    server = createServer(
      buildApp({
        hub,
        config,
        version: 'test',
        ports: async () => [
          {
            path: '/dev/serial/by-id/usb-1a86_USB_Serial-if00-port0',
            device: '/dev/ttyUSB0',
            label: '1a86 USB Serial (/dev/ttyUSB0)',
            vendorId: '1a86',
            known: true,
          },
        ],
      }),
    );
    attachWebSocket(server, hub);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;
  });

  afterEach(async () => {
    hub.dispose();
    await new Promise<void>((r) => server.close(() => r()));
  });

  it('enumerates ports server-side instead of asking the browser', async () => {
    const res = await fetch(`${base}/api/ports`);
    const body = (await res.json()) as { ports: PortInfo[] };
    expect(res.status).toBe(200);
    expect(body.ports[0].path).toMatch(/by-id/);
  });

  it('rejects a malformed job upload', async () => {
    const res = await fetch(`${base}/api/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', plotterName: 'p', layers: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('uploads a whole job once and streams only progress back', async () => {
    // The point of the design: the G-code crosses the network once, and the
    // send loop runs next to the USB cable.
    const upload = await fetch(`${base}/api/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sampleJob),
    });
    expect(upload.status).toBe(201);
    const { job } = (await upload.json()) as { job: JobSummary };
    expect(job.totalLines).toBe(7);
    // The summary carries no G-code, only the shape of it.
    expect(job.layers[0]).toEqual({ name: 'Ink', color: '#000000', lineCount: 2 });

    const client = await TestClient.connect(wsUrl);
    expect((await client.request({ type: 'connect', portPath: '/dev/fake' })).ok).toBe(true);
    board.writes.length = 0;

    expect((await client.request({ type: 'job.start', jobId: job.id })).ok).toBe(true);
    await client.waitFor((m) => m.type === 'job' && m.job?.state === 'awaiting_pen_swap');

    const swap = client.received.filter((m) => m.type === 'job').at(-1);
    expect(swap).toMatchObject({ job: { nextLayer: { name: 'Red', color: '#ff0000' } } });

    expect((await client.request({ type: 'job.continue' })).ok).toBe(true);
    await hub.runner.settled();
    await client.waitFor((m) => m.type === 'job' && m.job?.state === 'done');

    expect(board.written).toEqual([
      'G21',
      'G90',
      'G0 X1 Y1',
      'G1 X2 Y2',
      'G0 X3 Y3',
      'G1 X4 Y4',
      'M84',
    ]);
    client.close();
  });

  it('stops the machine over plain HTTP when the socket is not an option', async () => {
    const client = await TestClient.connect(wsUrl);
    await client.request({ type: 'connect', portPath: '/dev/fake' });
    board.writes.length = 0;

    const res = await fetch(`${base}/api/estop`, { method: 'POST' });
    expect(res.status).toBe(200);
    expect(board.written).toContain('M112');
    client.close();
  });

  it('frees control when the controlling socket drops', async () => {
    const a = await TestClient.connect(wsUrl);
    const b = await TestClient.connect(wsUrl);
    expect((await b.request({ type: 'connect', portPath: '/dev/fake' })).ok).toBe(false);

    a.close();
    await b.waitFor((m) => m.type === 'session' && m.session.clients.length === 1);
    expect((await b.request({ type: 'control.claim' })).ok).toBe(true);
    b.close();
  });

  it('answers an unknown message with an error rather than closing', async () => {
    const client = await TestClient.connect(wsUrl);
    const ack = await client.request({ type: 'nope' } as unknown as ClientMessage);
    expect(ack.ok).toBe(false);
    expect(ack.error).toMatch(/Unknown message type/);
    client.close();
  });
});
