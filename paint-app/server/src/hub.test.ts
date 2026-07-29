import { describe, expect, it } from 'vitest';
import { Hub } from './hub.js';
import type { ServerMessage } from './protocol.js';
import { FAST_TIMING, FakeMarlin } from './test/fakeMarlin.js';

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (pred: () => boolean, ms = 1000) => {
  const deadline = Date.now() + ms;
  while (!pred()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for condition');
    await tick(2);
  }
};

const setup = (board = new FakeMarlin()) => {
  const hub = new Hub({ connection: { transport: board.transport, timing: FAST_TIMING } });
  const join = () => {
    const messages: ServerMessage[] = [];
    const client = hub.addClient((m) => messages.push(m));
    return { id: client.id, messages };
  };
  return { hub, board, join };
};

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

describe('session ownership', () => {
  it('gives control to the first client and read-only to the rest', async () => {
    const { hub, join } = setup();
    const a = join();
    const b = join();

    expect(hub.controller).toBe(a.id);
    const denied = await hub.handle(b.id, { type: 'connect', portPath: '/dev/fake' });
    expect(denied.ok).toBe(false);
    expect(denied.error).toMatch(/Read-only/);

    const allowed = await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    expect(allowed.ok).toBe(true);
    hub.dispose();
  });

  it('refuses a claim while someone holds control, but allows a takeover', async () => {
    const { hub, join } = setup();
    const a = join();
    const b = join();

    expect((await hub.handle(b.id, { type: 'control.claim' })).ok).toBe(false);
    expect((await hub.handle(b.id, { type: 'control.takeover' })).ok).toBe(true);
    expect(hub.controller).toBe(b.id);
    // The displaced client is told immediately rather than discovering it on
    // its next failed command.
    const last = a.messages.filter((m) => m.type === 'session').at(-1);
    expect(last).toMatchObject({ session: { controllerId: b.id } });
    hub.dispose();
  });

  it('hands control on when the controlling client goes away', async () => {
    // A closed tab must not be able to strand the machine.
    const { hub, join } = setup();
    const a = join();
    const b = join();

    hub.removeClient(a.id);
    expect(hub.controller).toBe(b.id);
    hub.dispose();
  });

  it('leaves control vacant when the last client leaves', () => {
    const { hub, join } = setup();
    const a = join();
    hub.removeClient(a.id);
    expect(hub.controller).toBeNull();
    hub.dispose();
  });
});

describe('emergency stop', () => {
  it('is available to a read-only client', async () => {
    // A safety control you have to ask permission to use is not one.
    const board = new FakeMarlin();
    const { hub, join } = setup(board);
    const a = join();
    const b = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    board.writes.length = 0;

    const result = await hub.handle(b.id, { type: 'estop' });
    expect(result.ok).toBe(true);
    expect(board.written).toContain('M112');
    hub.dispose();
  });

  it('jumps a running job and fails it', async () => {
    const board = new FakeMarlin({ replyDelayMs: 5 });
    const { hub, join } = setup(board);
    const a = join();
    const b = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });

    const upload = hub.jobs.add({
      ...sampleJob,
      layers: [
        { name: 'Ink', color: '#000', lines: Array.from({ length: 200 }, (_, i) => `G1 X${i}`) },
      ],
      epilogue: [],
    });
    board.writes.length = 0;
    await hub.handle(a.id, { type: 'job.start', jobId: upload.id });
    await tick(15);

    await hub.handle(b.id, { type: 'estop' });
    await hub.runner.settled();

    expect(board.written).toContain('M112');
    expect(board.writtenAfter('M112')).toEqual([]);
    expect(board.written.indexOf('M112')).toBeLessThan(20);
    expect(hub.runner.view?.state).toBe('failed');
    expect(hub.connection.connected).toBe(false);
    hub.dispose();
  });
});

describe('jobs over the hub', () => {
  it('runs an uploaded job through its pen swap', async () => {
    const board = new FakeMarlin();
    const { hub, join } = setup(board);
    const a = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    board.writes.length = 0;

    const job = hub.jobs.add(sampleJob);
    expect((await hub.handle(a.id, { type: 'job.start', jobId: job.id })).ok).toBe(true);
    await waitFor(() => hub.runner.view?.state === 'awaiting_pen_swap');

    expect((await hub.handle(a.id, { type: 'job.continue' })).ok).toBe(true);
    await hub.runner.settled();

    expect(hub.runner.view?.state).toBe('done');
    expect(board.written).toEqual([
      'G21',
      'G90',
      'G0 X1 Y1',
      'G1 X2 Y2',
      'G0 X3 Y3',
      'G1 X4 Y4',
      'M84',
    ]);
    hub.dispose();
  });

  it('rejects an unknown job id', async () => {
    const { hub, join } = setup();
    const a = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    const result = await hub.handle(a.id, { type: 'job.start', jobId: 'nope' });
    expect(result.ok).toBe(false);
    hub.dispose();
  });

  it('refuses to disconnect out from under a running job', async () => {
    const board = new FakeMarlin({ replyDelayMs: 5 });
    const { hub, join } = setup(board);
    const a = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    const job = hub.jobs.add({
      ...sampleJob,
      layers: [
        { name: 'Ink', color: '#000', lines: Array.from({ length: 60 }, (_, i) => `G1 X${i}`) },
      ],
    });
    await hub.handle(a.id, { type: 'job.start', jobId: job.id });

    const result = await hub.handle(a.id, { type: 'disconnect' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Cancel the running job/);

    await hub.handle(a.id, { type: 'job.cancel' });
    await hub.runner.settled();
    hub.dispose();
  });
});

describe('jog', () => {
  it('rejects anything outside the movement allowlist', async () => {
    const { hub, join } = setup();
    const a = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });

    const result = await hub.handle(a.id, { type: 'jog', lines: ['M500'] });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Not allowed/);
    hub.dispose();
  });

  it('refuses to interleave with a running job', async () => {
    const board = new FakeMarlin({ replyDelayMs: 5 });
    const { hub, join } = setup(board);
    const a = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    const job = hub.jobs.add({
      ...sampleJob,
      layers: [
        { name: 'Ink', color: '#000', lines: Array.from({ length: 60 }, (_, i) => `G1 X${i}`) },
      ],
    });
    await hub.handle(a.id, { type: 'job.start', jobId: job.id });

    const result = await hub.handle(a.id, { type: 'jog', lines: ['G91', 'G0 X10'] });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/while a job is running/);

    await hub.handle(a.id, { type: 'job.cancel' });
    await hub.runner.settled();
    hub.dispose();
  });

  it('is allowed at a pen swap', async () => {
    const board = new FakeMarlin();
    const { hub, join } = setup(board);
    const a = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    const job = hub.jobs.add(sampleJob);
    await hub.handle(a.id, { type: 'job.start', jobId: job.id });
    await waitFor(() => hub.runner.view?.state === 'awaiting_pen_swap');
    board.writes.length = 0;

    expect((await hub.handle(a.id, { type: 'jog', lines: ['G91', 'G0 Z5'] })).ok).toBe(true);
    expect(board.written).toEqual(['G91', 'G0 Z5']);

    await hub.handle(a.id, { type: 'job.cancel' });
    await hub.runner.settled();
    hub.dispose();
  });
});

describe('log fan-out', () => {
  it('only sends the kinds a client subscribed to', async () => {
    const board = new FakeMarlin();
    const { hub, join } = setup(board);
    const a = join();
    const quiet = join();
    await hub.handle(a.id, { type: 'log.subscribe', kinds: ['tx', 'rx', 'info', 'err'] });
    await hub.handle(quiet.id, { type: 'log.subscribe', kinds: ['err'] });

    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    await tick(80);

    const kindsSeen = (msgs: ServerMessage[]) =>
      new Set(msgs.flatMap((m) => (m.type === 'log' ? m.lines.map((l) => l.kind) : [])));
    expect(kindsSeen(a.messages)).toContain('tx');
    expect(kindsSeen(quiet.messages).has('tx')).toBe(false);
    expect(kindsSeen(quiet.messages).has('info')).toBe(false);
    hub.dispose();
  });

  it('hands a joining client the recent info log', async () => {
    const { hub, join } = setup();
    const a = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });

    const late = join();
    const hello = late.messages.find((m) => m.type === 'hello');
    expect(hello?.type === 'hello' && hello.recentLog.length).toBeGreaterThan(0);
    hub.dispose();
  });
});

describe('device loss', () => {
  it('fails the job and tells every client', async () => {
    const board = new FakeMarlin({ replyDelayMs: 5 });
    const { hub, join } = setup(board);
    const a = join();
    const b = join();
    await hub.handle(a.id, { type: 'connect', portPath: '/dev/fake' });
    const job = hub.jobs.add({
      ...sampleJob,
      layers: [
        { name: 'Ink', color: '#000', lines: Array.from({ length: 60 }, (_, i) => `G1 X${i}`) },
      ],
    });
    await hub.handle(a.id, { type: 'job.start', jobId: job.id });
    await tick(15);

    board.unplug();
    await hub.runner.settled();

    expect(b.messages.some((m) => m.type === 'lost')).toBe(true);
    expect(hub.runner.view?.state).toBe('failed');
    expect(hub.snapshot().connection.connected).toBe(false);
    hub.dispose();
  });
});
