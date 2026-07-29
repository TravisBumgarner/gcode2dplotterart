import { describe, expect, it } from 'vitest';
import { type Job, JobRunner, JobStore, jobUploadSchema } from './jobs.js';
import { PlotterConnection } from './plotter.js';
import type { JobStatus } from './protocol.js';
import { FAST_TIMING, FakeMarlin } from './test/fakeMarlin.js';

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  name: 'page 1',
  plotterName: 'Ender-3 V3 SE',
  createdAt: Date.now(),
  prologue: ['G21', 'G90'],
  layers: [
    { name: 'Ink', color: '#000000', lines: ['G0 X1 Y1', 'G1 X2 Y2'] },
    { name: 'Red', color: '#ff0000', lines: ['G0 X3 Y3', 'G1 X4 Y4'] },
  ],
  epilogue: ['M84'],
  ...overrides,
});

const setup = async (board = new FakeMarlin()) => {
  const conn = new PlotterConnection({ transport: board.transport, timing: FAST_TIMING });
  await conn.connect('/dev/fake');
  board.writes.length = 0;
  const states: JobStatus[] = [];
  const runner = new JobRunner(conn, (s) => {
    if (s) states.push(structuredClone(s));
  });
  return { board, conn, runner, states };
};

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (pred: () => boolean, ms = 1000) => {
  const deadline = Date.now() + ms;
  while (!pred()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for condition');
    await tick(2);
  }
};

describe('job upload validation', () => {
  it('rejects a line carrying a newline', () => {
    // One array entry must be one command, or the progress count is a lie and
    // a "single line" can smuggle in a whole program.
    const result = jobUploadSchema.safeParse({
      name: 'x',
      plotterName: 'p',
      layers: [{ name: 'a', color: '#000', lines: ['G0 X1\nM112'] }],
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one layer', () => {
    expect(jobUploadSchema.safeParse({ name: 'x', plotterName: 'p', layers: [] }).success).toBe(
      false,
    );
  });

  it('accepts a normal job and defaults the prologue/epilogue', () => {
    const result = jobUploadSchema.safeParse({
      name: 'x',
      plotterName: 'p',
      layers: [{ name: 'a', color: '#000', lines: ['G0 X1'] }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.prologue).toEqual([]);
  });
});

describe('JobStore', () => {
  it('evicts the oldest job past the cap', () => {
    const store = new JobStore(2);
    const base = { name: 'j', plotterName: 'p', prologue: [], epilogue: [] };
    const a = store.add({ ...base, layers: [{ name: 'a', color: '#000', lines: ['G0 X1'] }] });
    store.add({ ...base, layers: [{ name: 'b', color: '#000', lines: ['G0 X2'] }] });
    store.add({ ...base, layers: [{ name: 'c', color: '#000', lines: ['G0 X3'] }] });

    expect(store.get(a.id)).toBeUndefined();
    expect(store.list()).toHaveLength(2);
  });
});

describe('running a job', () => {
  it('sends prologue, layers and epilogue in order', async () => {
    const { board, runner } = await setup();
    runner.start(makeJob());
    await waitFor(() => runner.view?.state === 'awaiting_pen_swap');
    runner.continue();
    await runner.settled();

    expect(board.written).toEqual([
      'G21',
      'G90',
      'G0 X1 Y1',
      'G1 X2 Y2',
      'G0 X3 Y3',
      'G1 X4 Y4',
      'M84',
    ]);
    expect(runner.view?.state).toBe('done');
    expect(runner.view?.progress?.sentLines).toBe(7);
  });

  it('parks between layers and names the pen to load', async () => {
    // This is the flow that used to be a Promise held in a React component:
    // closing the tab orphaned the print mid-page. It is server state now.
    const { board, runner } = await setup();
    runner.start(makeJob());
    await waitFor(() => runner.view?.state === 'awaiting_pen_swap');

    expect(runner.view?.nextLayer).toEqual({ name: 'Red', color: '#ff0000', lineCount: 2 });
    // Nothing from the second layer has gone out.
    expect(board.written).toEqual(['G21', 'G90', 'G0 X1 Y1', 'G1 X2 Y2']);

    await tick(30);
    expect(board.written).toHaveLength(4);

    runner.continue();
    await runner.settled();
    expect(runner.view?.state).toBe('done');
  });

  it('refuses to continue when it is not waiting for a swap', async () => {
    const { runner } = await setup();
    expect(() => runner.continue()).toThrow(/not waiting/i);
  });

  it('refuses a second job while one is active', async () => {
    const { runner } = await setup();
    runner.start(makeJob());
    await waitFor(() => runner.view?.state === 'awaiting_pen_swap');
    expect(() => runner.start(makeJob())).toThrow(/already running/i);
    runner.cancel();
    await runner.settled();
  });

  it('refuses to start with no connection', () => {
    const conn = new PlotterConnection({ transport: new FakeMarlin().transport });
    const runner = new JobRunner(conn);
    expect(() => runner.start(makeJob())).toThrow(/Not connected/);
  });
});

describe('pause and cancel', () => {
  it('reports paused and stops feeding lines', async () => {
    const board = new FakeMarlin({ replyDelayMs: 3 });
    const { conn, runner } = await setup(board);
    const job = makeJob({
      layers: [
        {
          name: 'Ink',
          color: '#000',
          lines: Array.from({ length: 40 }, (_, i) => `G1 X${i}`),
        },
      ],
      epilogue: [],
    });

    runner.start(job);
    await tick(15);
    conn.pause();
    const atPause = board.written.length;

    expect(runner.view?.state).toBe('paused');
    await tick(40);
    // The line already in flight finishes; nothing after it goes out.
    expect(board.written.length).toBeLessThanOrEqual(atPause + 1);

    conn.resume();
    await runner.settled();
    expect(runner.view?.state).toBe('done');
    expect(board.written).toHaveLength(42);
  });

  it('stops on cancel without marking the job failed', async () => {
    const board = new FakeMarlin({ replyDelayMs: 3 });
    const { runner } = await setup(board);
    runner.start(
      makeJob({
        layers: [
          { name: 'Ink', color: '#000', lines: Array.from({ length: 60 }, (_, i) => `G1 X${i}`) },
        ],
      }),
    );
    await tick(15);
    runner.cancel();
    await runner.settled();

    expect(runner.view?.state).toBe('cancelled');
    expect(runner.view?.error).toBeNull();
    expect(board.written.length).toBeLessThan(30);
  });

  it('cancels out of a pen swap', async () => {
    const { runner } = await setup();
    runner.start(makeJob());
    await waitFor(() => runner.view?.state === 'awaiting_pen_swap');
    runner.cancel();
    await runner.settled();
    expect(runner.view?.state).toBe('cancelled');
  });
});

describe('failure paths', () => {
  it('fails the job when the plotter is unplugged mid-print', async () => {
    const board = new FakeMarlin({ replyDelayMs: 3 });
    const { conn, runner } = await setup(board);
    // Nothing else is watching in this test, so wire the abort by hand; the Hub
    // does this via `onLost`.
    runner.start(
      makeJob({
        layers: [
          { name: 'Ink', color: '#000', lines: Array.from({ length: 60 }, (_, i) => `G1 X${i}`) },
        ],
      }),
    );
    await tick(15);
    board.unplug();
    await tick(5);
    runner.abort('connection lost');
    await runner.settled();

    expect(runner.view?.state).toBe('failed');
    expect(conn.connected).toBe(false);
    expect(board.written.length).toBeLessThan(30);
  });
});
