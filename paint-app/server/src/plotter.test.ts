import { describe, expect, it, vi } from 'vitest';
import { PlotterConnection } from './plotter.js';
import type { ConnectPhase, LogKind } from './protocol.js';
import { FAST_TIMING, FakeMarlin } from './test/fakeMarlin.js';

type Harness = {
  board: FakeMarlin;
  conn: PlotterConnection;
  log: { line: string; kind: LogKind }[];
  phases: (ConnectPhase | null)[];
  lost: ReturnType<typeof vi.fn>;
  pauseChanges: boolean[];
};

const harness = (board = new FakeMarlin()): Harness => {
  const log: { line: string; kind: LogKind }[] = [];
  const phases: (ConnectPhase | null)[] = [];
  const lost = vi.fn();
  const pauseChanges: boolean[] = [];
  const conn = new PlotterConnection({
    transport: board.transport,
    timing: FAST_TIMING,
    log: (line, kind) => log.push({ line, kind }),
    onPhase: (p) => phases.push(p),
    onLost: lost,
    onPauseChange: (p) => pauseChanges.push(p),
  });
  return { board, conn, log, phases, lost, pauseChanges };
};

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

describe('connect', () => {
  it('boots, probes with M115, homes, and reports phases', async () => {
    const h = harness();
    await h.conn.connect('/dev/fake');

    expect(h.board.written).toEqual(['M115', 'G28']);
    expect(h.phases).toEqual(['connecting', 'homing', null]);
    expect(h.conn.connected).toBe(true);
    expect(h.log.some((l) => l.line.startsWith('boot wait'))).toBe(true);
  });

  it('fails fast when the board never answers M115', async () => {
    // A board that has been M112'd answers nothing. Without the probe this
    // would march on into G28 and only fail 20s later, having told the user
    // it was connected.
    const h = harness(new FakeMarlin({ dead: true }));
    await expect(h.conn.connect('/dev/fake')).rejects.toThrow(/not responding/i);

    expect(h.board.written).toEqual(['M115']);
    expect(h.conn.connected).toBe(false);
  });

  it('closes and reopens a port that is already open', async () => {
    const h = harness(new FakeMarlin({ startsOpen: true }));
    await h.conn.connect('/dev/fake');

    expect(h.log.some((l) => l.line.includes('already open'))).toBe(true);
    expect(h.conn.connected).toBe(true);
  });

  it('retries a failed open exactly once', async () => {
    const h = harness(new FakeMarlin({ failOpens: 1 }));
    await h.conn.connect('/dev/fake');

    expect(h.board.openAttempts).toBe(2);
    expect(h.log.some((l) => l.line.includes('retrying once'))).toBe(true);
  });

  it('gives actionable guidance when the retry also fails', async () => {
    const h = harness(new FakeMarlin({ failOpens: 5 }));
    await expect(h.conn.connect('/dev/fake')).rejects.toThrow(/Close any other program/);

    expect(h.board.openAttempts).toBe(2);
    expect(h.conn.connected).toBe(false);
  });

  it('refuses a second connect while one is live', async () => {
    const h = harness();
    await h.conn.connect('/dev/fake');
    await expect(h.conn.connect('/dev/fake')).rejects.toThrow(/Already connected/);
  });
});

describe('send / ok handshake', () => {
  it('returns the non-ok reply lines and stops at ok', async () => {
    const h = harness(new FakeMarlin({ replies: { M105: ['T:20.1 /0.0 B:19.8 /0.0'] } }));
    await h.conn.connect('/dev/fake');

    const reply = await h.conn.send('M105');
    expect(reply).toEqual(['T:20.1 /0.0 B:19.8 /0.0']);
  });

  it('never writes a comment-only line', async () => {
    // Marlin sends no `ok` for a comment, so writing one would stall the
    // reader for a full idle timeout.
    const h = harness();
    await h.conn.connect('/dev/fake');
    h.board.writes.length = 0;

    expect(await h.conn.send('; layer Ink (#000, 0.5mm)')).toEqual([]);
    expect(h.board.written).toEqual([]);
  });

  it('serialises concurrent senders so replies are not crossed', async () => {
    const h = harness(new FakeMarlin({ replyDelayMs: 5 }));
    await h.conn.connect('/dev/fake');
    h.board.writes.length = 0;

    await Promise.all([h.conn.send('G0 X1'), h.conn.send('G0 X2'), h.conn.send('G0 X3')]);
    expect(h.board.written).toEqual(['G0 X1', 'G0 X2', 'G0 X3']);
  });

  it('parses M114 into a position', async () => {
    const h = harness();
    await h.conn.connect('/dev/fake');
    expect(await h.conn.getPosition()).toEqual({ x: 10, y: 20, z: 5 });
  });
});

describe('echo:busy keepalive', () => {
  it('keeps waiting through busy pulses far past the idle timeout', async () => {
    // G28 can take arbitrarily long. `echo:busy: processing` every 20ms keeps
    // the 60ms inactivity timer from ever firing across a 300ms home.
    const board = new FakeMarlin({ busy: { G28: 300 }, busyIntervalMs: 20 });
    const log: { line: string; kind: LogKind }[] = [];
    const conn = new PlotterConnection({
      transport: board.transport,
      timing: { ...FAST_TIMING, defaultIdleTimeoutMs: 60 },
      log: (line, kind) => log.push({ line, kind }),
    });

    const started = Date.now();
    await conn.connect('/dev/fake');
    const elapsed = Date.now() - started;

    expect(elapsed).toBeGreaterThanOrEqual(280);
    expect(conn.connected).toBe(true);
    // The keepalives are logged as rx but must not be mistaken for a reply.
    expect(log.filter((l) => l.line.includes('echo:busy')).length).toBeGreaterThan(5);
  });

  it('does not hand keepalives back as reply lines', async () => {
    // `echo:busy` is flow control, not an answer. Leaking it into the reply
    // would put it in front of the M115 banner check and the M114 parse.
    const board = new FakeMarlin({
      busy: { G1: 120 },
      busyIntervalMs: 20,
      replies: { G1: ['X:1.00 Y:2.00 Z:3.00'] },
    });
    const conn = new PlotterConnection({ transport: board.transport, timing: FAST_TIMING });
    await conn.connect('/dev/fake');

    expect(await conn.send('G1 X10')).toEqual(['X:1.00 Y:2.00 Z:3.00']);
  });

  it('gives up after real silence rather than hanging forever', async () => {
    const board = new FakeMarlin({ silent: ['G0'] });
    const conn = new PlotterConnection({
      transport: board.transport,
      timing: { ...FAST_TIMING, defaultIdleTimeoutMs: 40 },
    });
    await conn.connect('/dev/fake');

    const started = Date.now();
    await conn.send('G0 X10');
    expect(Date.now() - started).toBeGreaterThanOrEqual(35);
    expect(conn.connected).toBe(true);
  });
});

describe('pause gating', () => {
  it('blocks before writing the next line and releases on resume', async () => {
    const h = harness(new FakeMarlin({ replyDelayMs: 2 }));
    await h.conn.connect('/dev/fake');
    h.board.writes.length = 0;

    h.conn.pause();
    expect(h.conn.isPaused).toBe(true);
    expect(h.pauseChanges).toEqual([true]);

    let settled = false;
    const pending = h.conn.send('G0 X10').then(() => {
      settled = true;
    });

    await tick(30);
    expect(h.board.written).toEqual([]);
    expect(settled).toBe(false);

    h.conn.resume();
    await pending;
    expect(h.board.written).toEqual(['G0 X10']);
    expect(h.pauseChanges).toEqual([true, false]);
  });

  it('lets an operator jog while paused', async () => {
    // The whole reason to pause is to go and do something to the machine.
    const h = harness();
    await h.conn.connect('/dev/fake');
    h.board.writes.length = 0;
    h.conn.pause();

    await h.conn.send('G0 Z5', { bypassPause: true });
    expect(h.board.written).toEqual(['G0 Z5']);
  });

  it('clears the pause on disconnect so nothing is left blocked', async () => {
    const h = harness();
    await h.conn.connect('/dev/fake');
    h.conn.pause();

    const pending = h.conn.send('G0 X10').catch((e: Error) => e.message);
    await h.conn.disconnect();

    await expect(pending).resolves.toMatch(/disconnected|Not connected/);
    expect(h.conn.isPaused).toBe(false);
  });
});

describe('device loss', () => {
  it('reports an unexpected close as a loss', async () => {
    const h = harness();
    await h.conn.connect('/dev/fake');

    h.board.unplug();
    await tick();

    expect(h.lost).toHaveBeenCalledTimes(1);
    expect(h.conn.connected).toBe(false);
    expect(h.log.some((l) => l.line === 'connection lost' && l.kind === 'err')).toBe(true);
  });

  it('does not report an intentional disconnect as a loss', async () => {
    const h = harness();
    await h.conn.connect('/dev/fake');

    await h.conn.disconnect();
    await tick();

    expect(h.lost).not.toHaveBeenCalled();
    expect(h.conn.connected).toBe(false);
    expect(h.log.some((l) => l.line === 'closed')).toBe(true);
  });

  it('fails an in-flight send instead of leaving it to time out', async () => {
    const h = harness(new FakeMarlin({ silent: ['G0'] }));
    await h.conn.connect('/dev/fake');

    const pending = h.conn.send('G0 X10').catch((e: Error) => e.message);
    await tick(5);
    h.board.unplug();

    await expect(pending).resolves.toBeTypeOf('object');
    expect(h.conn.connected).toBe(false);
  });
});

describe('emergency stop', () => {
  it('lands while a slow command is still in flight', async () => {
    // The property being protected. Every other command waits its turn behind
    // the one in flight, and on a real board that wait is unbounded — a G28 is
    // fifteen seconds. An e-stop that takes the same path arrives after the
    // crash it was meant to prevent, so it takes no path at all: straight to
    // the port, no queue, no lock, no `ok`.
    const h = harness(new FakeMarlin({ busy: { G1: 400 }, busyIntervalMs: 50 }));
    await h.conn.connect('/dev/fake');
    h.board.writes.length = 0;

    const slow = h.conn.send('G1 X100').catch(() => {});
    await tick(20);

    const started = Date.now();
    await h.conn.emergencyStop();
    const elapsed = Date.now() - started;
    await slow;

    expect(elapsed).toBeLessThan(100);
    expect(h.board.written).toEqual(['G1 X100', 'M112']);
  });

  it('lands while the connection is paused', async () => {
    // Sharing the pause gate would mean the stop button does nothing until
    // somebody presses play.
    const h = harness();
    await h.conn.connect('/dev/fake');
    h.board.writes.length = 0;
    h.conn.pause();

    await h.conn.emergencyStop();
    expect(h.board.written).toEqual(['M112']);
  });

  it('stops the stream dead rather than draining it', async () => {
    const h = harness(new FakeMarlin({ replyDelayMs: 5 }));
    await h.conn.connect('/dev/fake');
    h.board.writes.length = 0;

    const queued = Array.from({ length: 50 }, (_, i) => `G1 X${i}`);
    const stream = h.conn.sendMany(queued).catch(() => {});
    await tick(12);
    await h.conn.emergencyStop();
    await stream;

    expect(h.board.written.indexOf('M112')).toBeLessThan(10);
    expect(h.board.writtenAfter('M112')).toEqual([]);
  });

  it('is a no-op when nothing is connected', async () => {
    const h = harness();
    await expect(h.conn.emergencyStop()).resolves.toBeUndefined();
  });

  it('refuses further sends until the next connect', async () => {
    const h = harness();
    await h.conn.connect('/dev/fake');
    await h.conn.emergencyStop();

    await expect(h.conn.send('G0 X1')).rejects.toThrow(/emergency stop/);
    expect(h.conn.isEmergencyStopped).toBe(true);
  });
});
