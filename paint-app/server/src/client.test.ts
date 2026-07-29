import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// The renderer's API client, exercised against the same scripted Marlin the
// server is tested with. It lives in `paint-app/src` because it runs in the
// browser; the test lives here because this is where the harness is, and a
// client tested only against a mock of its own server proves nothing.
import { PlotterClient } from '../../src/plotterClient.js';
import { loadConfig } from './config.js';
import { Hub } from './hub.js';
import { attachWebSocket, buildApp } from './server.js';
import { FAST_TIMING, FakeMarlin } from './test/fakeMarlin.js';

const PORT_PATH = '/dev/serial/by-id/usb-1a86_USB_Serial-if00-port0';

const samplePage = {
  name: 'page 1',
  plotterName: 'Ender-3 V3 SE',
  prologue: ['; plotter: Ender-3 V3 SE', 'G21 ; mm', 'G90 ; absolute'],
  layers: [
    { name: 'Ink', color: '#000000', lines: ['G0 X1 Y1', 'G1 X2 Y2'] },
    { name: 'Red', color: '#ff0000', lines: ['G0 X3 Y3', 'G1 X4 Y4'] },
  ],
  epilogue: ['M84 ; disable steppers'],
};

const waitFor = async (pred: () => boolean, ms = 3000) => {
  const deadline = Date.now() + ms;
  while (!pred()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for condition');
    await new Promise((r) => setTimeout(r, 2));
  }
};

describe('the React client against a real server and a scripted board', () => {
  let hub: Hub;
  let server: Server;
  let board: FakeMarlin;
  let base: string;
  const clients: PlotterClient[] = [];

  const join = async (name: string) => {
    const client = new PlotterClient({ baseUrl: base, name });
    clients.push(client);
    client.start();
    await waitFor(() => client.clientId !== null);
    return client;
  };

  const start = async (opts?: ConstructorParameters<typeof FakeMarlin>[0]) => {
    board = new FakeMarlin(opts);
    hub = new Hub({ connection: { transport: board.transport, timing: FAST_TIMING } });
    server = createServer(
      buildApp({
        hub,
        config: loadConfig({ PORT: '0' } as NodeJS.ProcessEnv),
        version: 'test',
        ports: async () => [
          {
            path: PORT_PATH,
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
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  };

  beforeEach(() => start());

  afterEach(async () => {
    for (const c of clients) c.stop();
    clients.length = 0;
    hub.dispose();
    await new Promise<void>((r) => server.close(() => r()));
  });

  it('gets its port list from the server, not from the browser', async () => {
    const client = await join('laptop');
    const ports = await client.listPorts();
    expect(ports).toHaveLength(1);
    expect(ports[0].path).toBe(PORT_PATH);
    expect(ports[0].known).toBe(true);
  });

  it('connects, homes, and reports the port the server holds', async () => {
    const client = await join('laptop');
    await client.connect(PORT_PATH);

    expect(board.written).toContain('M115');
    expect(board.written).toContain('G28');
    const { connection } = await client.snapshot();
    expect(connection.connected).toBe(true);
    expect(connection.portPath).toBe(PORT_PATH);
  });

  it('uploads a page whole and watches the server run it', async () => {
    // The G-code crosses the network once. Everything after that is the
    // server telling us where it got to.
    const client = await join('laptop');
    const states: string[] = [];
    const observer = new PlotterClient({
      baseUrl: base,
      name: 'phone',
      onJob: (job) => {
        if (job) states.push(job.state);
      },
    });
    clients.push(observer);
    observer.start();
    await waitFor(() => observer.clientId !== null);

    await client.connect(PORT_PATH);
    board.writes.length = 0;

    const job = await client.uploadJob(samplePage);
    // Eight lines counted, seven on the wire: the comment-only prologue line
    // is stripped by the send loop, not by the upload.
    expect(job.totalLines).toBe(8);
    await client.startJob(job.id);

    // The pen swap is server state; the phone sees it without having started
    // the print, which is the point.
    await waitFor(() => states.includes('awaiting_pen_swap'));
    await client.continueJob();
    await hub.runner.settled();
    await waitFor(() => states.includes('done'));

    expect(board.written).toEqual([
      'G21',
      'G90',
      'G0 X1 Y1',
      'G1 X2 Y2',
      'G0 X3 Y3',
      'G1 X4 Y4',
      'M84',
    ]);
  });

  it('sends an interactive stroke as one batch and drops the comments', async () => {
    const client = await join('laptop');
    await client.connect(PORT_PATH);
    board.writes.length = 0;

    await client.sendMany([
      '; plotter: Ender-3 V3 SE',
      'G21 ; mm',
      'G90',
      'G0 X5 Y5 F6000',
      'G1 X6 Y6 F3000',
    ]);

    expect(board.written).toEqual(['G21', 'G90', 'G0 X5 Y5 F6000', 'G1 X6 Y6 F3000']);
  });

  it('reads a position back through the jog channel', async () => {
    const client = await join('laptop');
    await client.connect(PORT_PATH);
    expect(await client.getPosition()).toEqual({ x: 10, y: 20, z: 5 });
  });

  it('refuses to move the machine from a client that does not hold control', async () => {
    const controller = await join('laptop');
    const observer = await join('phone');
    await controller.connect(PORT_PATH);

    await expect(observer.send('G28')).rejects.toThrow(/Read-only/);
    // …and says who has it, so the UI can name a name.
    const { session } = await observer.snapshot();
    expect(session.clients.find((c) => c.controller)?.name).toBe('laptop');
  });
});

/**
 * The emergency stop is the one path where "it works" is not enough — it has to
 * work while everything else is busy, blocked, or forbidden. Each test below
 * removes one of the things a normal command depends on.
 */
describe('emergency stop bypasses the command path', () => {
  let hub: Hub;
  let server: Server;
  let board: FakeMarlin;
  let base: string;
  const clients: PlotterClient[] = [];

  const boot = async (opts?: ConstructorParameters<typeof FakeMarlin>[0]) => {
    board = new FakeMarlin(opts);
    hub = new Hub({ connection: { transport: board.transport, timing: FAST_TIMING } });
    server = createServer(
      buildApp({ hub, config: loadConfig({ PORT: '0' } as NodeJS.ProcessEnv), version: 'test' }),
    );
    attachWebSocket(server, hub);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  };

  const join = async (name: string) => {
    const client = new PlotterClient({ baseUrl: base, name });
    clients.push(client);
    client.start();
    await waitFor(() => client.clientId !== null);
    return client;
  };

  afterEach(async () => {
    for (const c of clients) c.stop();
    clients.length = 0;
    hub.dispose();
    await new Promise<void>((r) => server.close(() => r()));
  });

  it('fires from a read-only client that is not allowed to move the machine', async () => {
    await boot();
    const controller = await join('laptop');
    const observer = await join('phone');
    await controller.connect(PORT_PATH);
    board.writes.length = 0;

    // The same client, on the ordinary path, cannot send a single G-code line.
    await expect(observer.send('G28')).rejects.toThrow(/Read-only/);
    await observer.emergencyStop();

    expect(board.written).toContain('M112');
    expect(board.killed).toBe(true);
  });

  it('fires with the session socket shut', async () => {
    // If the stop needed the WebSocket, a wedged or closed socket — exactly
    // when you most want to stop the machine — would take it away.
    await boot();
    const client = await join('laptop');
    await client.connect(PORT_PATH);
    board.writes.length = 0;

    client.stop();
    await client.emergencyStop();

    expect(board.written).toContain('M112');
  });

  it('lands promptly with a long move in flight, and kills the job with it', async () => {
    // A `G1` that takes two seconds is an ordinary drawing move at a slow
    // feed rate. If M112 waited its turn behind the write queue, or behind the
    // `ok` of whatever is in flight, this is where that would show up.
    await boot({ busy: { 'G1 X': 2000 } });
    const client = await join('laptop');
    await client.connect(PORT_PATH);

    const job = await client.uploadJob({
      name: 'slow page',
      plotterName: 'Ender-3 V3 SE',
      prologue: [],
      layers: [{ name: 'Ink', color: '#000', lines: ['G1 X1 Y1', 'G1 X2 Y2', 'G1 X3 Y3'] }],
      epilogue: [],
    });
    await client.startJob(job.id);
    await waitFor(() => board.written.includes('G1 X1 Y1'));

    const firedAt = Date.now();
    await client.emergencyStop();
    const landedAt = board.writes.find((w) => w.line === 'M112')?.at;

    expect(landedAt).toBeDefined();
    // Generous next to the 2000ms move it jumped, tight enough that queueing
    // behind it fails.
    expect((landedAt as number) - firedAt).toBeLessThan(300);

    // Nothing more goes to a board that is no longer listening, and the job
    // gives up now rather than after a 500ms idle timeout per remaining line.
    await hub.runner.settled();
    expect(hub.runner.view?.state).toBe('failed');
    expect(board.written.filter((l) => l.startsWith('G1'))).toEqual(['G1 X1 Y1']);
  });
});
