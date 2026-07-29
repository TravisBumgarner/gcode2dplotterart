import type { ConnectPhase, LogKind } from './protocol.js';
import { nodeTransport, type SerialTransport, type TransportFactory } from './transport.js';

export const BAUD = 115200;

/**
 * Every delay in the connect dance, in one place so tests can shrink them.
 * The defaults are the values the Web Serial implementation arrived at against
 * a real Ender-3 V3 SE; none of them are arbitrary.
 */
export type Timing = {
  /** Marlin resets when the port opens. Nothing it says before this is useful. */
  bootWaitMs: number;
  /** How long the OS needs to actually let go of a port we just closed. */
  reopenDelayMs: number;
  /** Backoff before the single retry of a failed open. */
  openRetryDelayMs: number;
  /** Silence, not total elapsed time, that ends a `readUntilOk`. */
  defaultIdleTimeoutMs: number;
  /** The `M115` liveness probe fails fast; a live board answers instantly. */
  probeTimeoutMs: number;
};

export const DEFAULT_TIMING: Timing = {
  bootWaitMs: 2000,
  reopenDelayMs: 300,
  openRetryDelayMs: 800,
  defaultIdleTimeoutMs: 20_000,
  probeTimeoutMs: 6_000,
};

export type LogFn = (line: string, kind: LogKind) => void;
export type PhaseFn = (phase: ConnectPhase | null) => void;

export type PlotterConnectionOptions = {
  log?: LogFn;
  onPhase?: PhaseFn;
  /**
   * Fired once when the port drops without a `disconnect()` — unplugged cable,
   * board reset, firmware killed. Never fired for an intentional close.
   */
  onLost?: () => void;
  onPauseChange?: (paused: boolean) => void;
  transport?: TransportFactory;
  timing?: Partial<Timing>;
};

export type SendOptions = {
  idleTimeoutMs?: number;
  /**
   * Skip the pause gate. For operator-driven commands (jog, position) that are
   * the whole point of having paused in the first place.
   */
  bypassPause?: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A serial link to a Marlin board, ported from the browser's Web Serial
 * implementation — `paint-app/src/serial.ts`, now deleted; see git history.
 *
 * Differences from the browser original, all forced by being a shared server
 * rather than a single page:
 *
 * - Writes are serialised through a queue. In the browser exactly one loop ever
 *   called `send()`; here a job stream and an operator's jog button can arrive
 *   at once, and interleaving two commands would mismatch their `ok`s.
 * - Anything waiting on a reply is failed immediately on disconnect, device
 *   loss or emergency stop, rather than being left to time out. A job loop that
 *   keeps running for 20s after an e-stop is not an e-stop.
 */
export class PlotterConnection {
  private transport: SerialTransport | null = null;
  private buffer = '';
  /** Lines received but not yet consumed by a reader. */
  private lineQueue: string[] = [];
  /** Resolver for a reader currently awaiting the next line, if any. */
  private lineWaiter: ((line: string | null) => void) | null = null;
  /**
   * True only while an intentional disconnect() is in progress, so the port
   * closing doesn't get misreported as an unexpected device loss.
   */
  private intentionalClose = false;
  /**
   * When true, the next send() blocks before writing until resume(). The
   * in-flight line still finishes; Marlin then drains its small planner buffer
   * and holds position. Applies to every G-code source since they all funnel
   * through send().
   */
  private paused = false;
  private resumeWaiters: (() => void)[] = [];
  /** Non-null once the link is unusable; the reason, for anything still waiting. */
  private aborted: string | null = null;
  /** Serialises writes so two callers never share a reply stream. */
  private writeChain: Promise<unknown> = Promise.resolve();
  private phase: ConnectPhase | null = null;
  private portPath: string | null = null;
  private emergencyStopped = false;

  private readonly log: LogFn;
  private readonly onPhase: PhaseFn;
  private readonly onLost: () => void;
  private readonly onPauseChange: (paused: boolean) => void;
  private readonly makeTransport: TransportFactory;
  private readonly timing: Timing;

  constructor(opts: PlotterConnectionOptions = {}) {
    this.log = opts.log ?? (() => {});
    this.onPhase = opts.onPhase ?? (() => {});
    this.onLost = opts.onLost ?? (() => {});
    this.onPauseChange = opts.onPauseChange ?? (() => {});
    this.makeTransport = opts.transport ?? nodeTransport;
    this.timing = { ...DEFAULT_TIMING, ...opts.timing };
  }

  get connected() {
    return this.transport !== null;
  }

  get isPaused() {
    return this.paused;
  }

  get currentPhase() {
    return this.phase;
  }

  get path() {
    return this.portPath;
  }

  get isEmergencyStopped() {
    return this.emergencyStopped;
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.log('paused', 'info');
    this.onPauseChange(true);
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.releasePauseWaiters();
    this.log('resumed', 'info');
    this.onPauseChange(false);
  }

  private releasePauseWaiters() {
    const waiters = this.resumeWaiters;
    this.resumeWaiters = [];
    for (const w of waiters) w();
  }

  /**
   * Resolves immediately unless paused, in which case it waits for resume()
   * (or a disconnect, which forcibly clears the pause).
   */
  private gate(): Promise<void> {
    if (!this.paused) return Promise.resolve();
    return new Promise<void>((r) => this.resumeWaiters.push(r));
  }

  private setPhase(phase: ConnectPhase | null) {
    this.phase = phase;
    this.onPhase(phase);
  }

  async connect(portPath: string) {
    if (this.transport) {
      throw new Error('Already connected. Disconnect before connecting again.');
    }
    const transport = this.makeTransport(portPath, BAUD);
    this.setPhase('connecting');
    try {
      await this.openWithRetry(transport, portPath);
    } catch (e) {
      this.setPhase(null);
      throw e;
    }

    this.transport = transport;
    this.portPath = portPath;
    this.aborted = null;
    this.emergencyStopped = false;
    this.buffer = '';
    this.lineQueue.length = 0;
    transport.onData((chunk) => this.ingest(chunk));
    transport.onError((err) => this.log(`serial error: ${err.message}`, 'err'));
    transport.onClose(() => this.handleClose());
    this.log(`opened ${portPath} @ ${BAUD}`, 'info');

    try {
      // Marlin resets on open; wait for boot.
      this.log(`boot wait ${this.timing.bootWaitMs}ms…`, 'info');
      await sleep(this.timing.bootWaitMs);
      this.log('boot wait done; sending M115', 'info');
      // M115 is the liveness probe: a healthy Marlin always replies with a
      // FIRMWARE_NAME banner. A board that's been M112'd / killed answers
      // nothing, so a short timeout here lets us fail fast instead of marching
      // on (M115 timeout -> G28 timeout) and falsely reporting a live
      // connection to a dead board.
      const info = await this.send('M115', { idleTimeoutMs: this.timing.probeTimeoutMs });
      const alive = info.some((l) => /FIRMWARE_NAME|marlin/i.test(l));
      if (!alive) {
        this.log('no firmware response — board not responding', 'err');
        await this.disconnect().catch(() => {});
        throw new Error(
          'Plotter is not responding. If it was emergency-stopped, power-cycle the printer (off, wait, on), then reconnect.',
        );
      }
      this.log('M115 done; sending G28 (home)', 'info');
      this.setPhase('homing');
      await this.send('G28');
      this.log('G28 done; connected', 'info');
    } catch (e) {
      this.setPhase(null);
      if (this.transport) await this.disconnect().catch(() => {});
      throw e;
    }
    this.setPhase(null);
  }

  /**
   * Open the port, absorbing the two failures that are routine rather than
   * fatal: a handle we (or a crashed predecessor) never released, and an OS
   * that hasn't finished freeing the device from the last session.
   */
  private async openWithRetry(transport: SerialTransport, portPath: string) {
    if (transport.isOpen) {
      this.log('port already open — closing before reopening', 'info');
      await transport.close().catch(() => {});
      // The OS doesn't release the device synchronously with close(); opening
      // again immediately fails with a generic error. Give the previous handle
      // time to drop before reopening.
      await sleep(this.timing.reopenDelayMs);
    }
    try {
      await transport.open();
      return;
    } catch (e) {
      const message = (e as Error).message;
      if (/already open/i.test(message)) {
        await transport.close().catch(() => {});
        await sleep(this.timing.reopenDelayMs);
      }
      // A transient open failure usually means the OS hasn't freed the device
      // yet (just unplugged/replugged, prior session, another program holding
      // it). One delayed retry clears the common case; a second failure is
      // surfaced with actionable guidance.
      this.log(`open failed (${message}) — retrying once`, 'info');
      await sleep(this.timing.openRetryDelayMs);
      try {
        await transport.open();
        return;
      } catch {
        throw new Error(
          `Could not open ${portPath}. Close any other program using the plotter (a serial monitor, another instance of this server), check that the container has the device passed through, then unplug and replug the USB cable and try again.`,
        );
      }
    }
  }

  async disconnect() {
    if (!this.transport) return;
    const transport = this.transport;
    this.intentionalClose = true;
    // Release anything blocked on a pause or on a reply so the job loop can
    // unwind instead of hanging on a closed port.
    this.paused = false;
    this.releasePauseWaiters();
    this.onPauseChange(false);
    this.abortPending('disconnected');
    try {
      await transport.close().catch(() => {});
    } finally {
      this.transport = null;
      this.portPath = null;
      this.setPhase(null);
      this.intentionalClose = false;
      this.log('closed', 'info');
    }
  }

  /** Called when the transport's handle goes away, for any reason. */
  private handleClose() {
    // The port closing without an intentional disconnect() means the device was
    // lost (unplugged, reset, or killed). Drop state and notify so the UI stops
    // showing a live connection.
    if (this.intentionalClose || !this.transport) return;
    this.transport = null;
    this.portPath = null;
    this.setPhase(null);
    this.abortPending('connection lost');
    this.paused = false;
    this.releasePauseWaiters();
    this.log('connection lost', 'err');
    this.onLost();
  }

  /**
   * Fail everything currently waiting, and everything sent from now on, until
   * the next connect(). Without this an emergency stop leaves the job loop
   * parked on a 20s idle timeout, still holding thousands of queued lines.
   */
  private abortPending(reason: string) {
    this.aborted = reason;
    const waiter = this.lineWaiter;
    this.lineWaiter = null;
    waiter?.(null);
  }

  private ingest(chunk: string) {
    this.buffer += chunk;
    let nl: number;
    // biome-ignore lint/suspicious/noAssignInExpressions: idiomatic line splitting
    while ((nl = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, nl).replace(/\r$/, '');
      this.buffer = this.buffer.slice(nl + 1);
      if (!line) continue;
      this.log(line, 'rx');
      this.pushLine(line);
    }
  }

  /** Deliver a line to a waiting reader, or buffer it until one asks. */
  private pushLine(line: string) {
    if (this.lineWaiter) {
      const w = this.lineWaiter;
      this.lineWaiter = null;
      w(line);
    } else {
      this.lineQueue.push(line);
    }
  }

  private nextLine(timeoutMs: number) {
    const queued = this.lineQueue.shift();
    if (queued !== undefined) return Promise.resolve<string | null>(queued);
    if (this.aborted) return Promise.resolve<string | null>(null);
    return new Promise<string | null>((resolve) => {
      let done = false;
      const t = setTimeout(() => {
        if (done) return;
        done = true;
        this.lineWaiter = null;
        resolve(null);
      }, timeoutMs);
      this.lineWaiter = (line) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(line);
      };
    });
  }

  /**
   * Collect reply lines until `ok`. Uses an *inactivity* timeout, not a hard
   * deadline: slow commands like `G28` can take far longer than any fixed
   * budget, and Marlin emits `echo:busy: processing` every ~2s precisely so the
   * host knows it is still alive. We treat those as keepalives that keep us
   * waiting; we only give up after `idleTimeoutMs` of true silence.
   */
  private async readUntilOk(idleTimeoutMs = this.timing.defaultIdleTimeoutMs): Promise<string[]> {
    const collected: string[] = [];
    while (true) {
      const line = await this.nextLine(idleTimeoutMs);
      if (line === null) return collected;
      const lower = line.toLowerCase();
      if (lower.startsWith('ok')) return collected;
      if (lower.startsWith('echo:busy') || lower.startsWith('busy')) continue;
      collected.push(line);
    }
  }

  /** Send a single G-code line; returns any non-`ok` reply lines it produced. */
  async send(gcode: string, opts: SendOptions = {}): Promise<string[]> {
    // Strip comments; Marlin sends no `ok` for a comment-only line, so sending
    // one would stall readUntilOk for the full idle timeout.
    const line = gcode.replace(/;.*$/, '').trim();
    if (!line) return [];
    // Block here while paused so the *next* line isn't sent; the previous line
    // already got its `ok`, so the machine just holds position. Gating happens
    // outside the write queue so a jog can still be serviced while paused.
    if (!opts.bypassPause) await this.gate();
    return this.enqueue(async () => {
      if (this.aborted) throw new Error(this.aborted);
      if (!this.transport) throw new Error('Not connected.');
      // Drop any lines left over from a previous command (e.g. trailing async
      // chatter after its `ok`) so they aren't mistaken for this reply.
      this.lineQueue.length = 0;
      this.log(line, 'tx');
      await this.transport.write(`${line}\n`);
      return this.readUntilOk(opts.idleTimeoutMs);
    });
  }

  async sendMany(lines: string[], opts: SendOptions = {}) {
    for (const l of lines) await this.send(l, opts);
  }

  /** Run `fn` once every previously queued write has finished. */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.writeChain.then(fn, fn);
    this.writeChain = run.catch(() => {});
    return run;
  }

  /**
   * Emergency stop. Writes M112 straight to the port, bypassing the write queue
   * so it lands even mid-stream (Marlin's EMERGENCY_PARSER acts on it
   * immediately, full planner buffer or not). The board enters a killed state
   * afterwards and must be power-cycled and reconnected.
   *
   * Nothing on this path may await a queue, a lock, or a job — that is the
   * entire property being protected.
   */
  async emergencyStop() {
    const transport = this.transport;
    if (!transport) return;
    this.emergencyStopped = true;
    this.log('M112 (emergency stop)', 'err');
    try {
      await transport.write('M112\n');
    } finally {
      // Unblock the job loop immediately rather than letting it spend an idle
      // timeout waiting for an `ok` from a board that is no longer listening.
      this.abortPending('emergency stop');
      this.paused = false;
      this.releasePauseWaiters();
    }
  }

  /** Query M114 and parse the X/Y/Z position from the reply. Null if no reply. */
  async getPosition(): Promise<{ x: number; y: number; z: number } | null> {
    const lines = await this.send('M114', { bypassPause: true });
    for (const line of lines) {
      const m = line.match(/X:(-?\d+\.?\d*)\s+Y:(-?\d+\.?\d*)\s+Z:(-?\d+\.?\d*)/);
      if (m) {
        return {
          x: Number.parseFloat(m[1]),
          y: Number.parseFloat(m[2]),
          z: Number.parseFloat(m[3]),
        };
      }
    }
    return null;
  }
}
