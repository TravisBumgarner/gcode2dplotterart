declare global {
  interface Navigator {
    serial: {
      requestPort: (opts?: { filters?: { usbVendorId: number }[] }) => Promise<SerialPort>;
      getPorts: () => Promise<SerialPort[]>;
    };
  }
  interface SerialPort {
    open: (opts: { baudRate: number }) => Promise<void>;
    close: () => Promise<void>;
    // null while the port is closed (per the Web Serial spec); the non-null
    // types are only valid once open() has resolved.
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
  }
}

const BAUD = 115200;

export type LogFn = (line: string, kind: 'tx' | 'rx' | 'info' | 'err') => void;
export type ConnectPhase = 'connecting' | 'homing';
export type PhaseFn = (phase: ConnectPhase | null) => void;

export class PlotterConnection {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private buffer = '';
  /** Lines received but not yet consumed by a reader. */
  private lineQueue: string[] = [];
  /** Resolver for a reader currently awaiting the next line, if any. */
  private lineWaiter: ((line: string) => void) | null = null;
  private readLoopPromise: Promise<void> | null = null;
  /** True only while an intentional disconnect() is in progress, so the
   * read loop ending doesn't get misreported as an unexpected device loss. */
  private intentionalClose = false;
  /** When true, the next send() blocks before writing until resume(). The
   * in-flight line still finishes; Marlin then drains its small planner
   * buffer and holds position. Applies to every G-code source (print,
   * interactive) since they all funnel through send(). */
  private paused = false;
  private resumeWaiters: (() => void)[] = [];

  constructor(
    private log: LogFn,
    private onPhase: PhaseFn = () => {},
    /** Fired once when the port drops unexpectedly (device lost, board
     * reset/killed by M112). Not called for an intentional disconnect(). */
    private onLost: () => void = () => {},
    private onPauseChange: (paused: boolean) => void = () => {},
  ) {}

  get isPaused() {
    return this.paused;
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
    const waiters = this.resumeWaiters;
    this.resumeWaiters = [];
    for (const w of waiters) w();
    this.log('resumed', 'info');
    this.onPauseChange(false);
  }

  /** Resolves immediately unless paused, in which case it waits for resume()
   * (or a disconnect, which forcibly clears the pause). */
  private gate(): Promise<void> {
    if (!this.paused) return Promise.resolve();
    return new Promise<void>((r) => this.resumeWaiters.push(r));
  }

  get connected() {
    return this.port !== null;
  }

  async connect() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial not supported. Use Chrome or Edge.');
    }
    if (this.port) {
      throw new Error('Already connected. Disconnect before connecting again.');
    }
    const port = await navigator.serial.requestPort();
    this.onPhase('connecting');
    // The browser keeps a port open across our own teardown bugs, other tabs,
    // or a prior connect() that threw after open() — re-opening such a port
    // fails with "The port is already open." A non-null readable/writable is
    // the spec's signal that it's still open, so close it for a clean start.
    if (port.readable || port.writable) {
      this.log('port already open — closing before reopening', 'info');
      await port.close().catch(() => {});
      // The OS doesn't release the device synchronously with close(); opening
      // again immediately fails with the generic "Failed to open serial port."
      // Give the previous handle time to drop before reopening.
      await new Promise((r) => setTimeout(r, 300));
    }
    try {
      await port.open({ baudRate: BAUD });
    } catch (e) {
      // A transient "Failed to open serial port" usually means the OS hasn't
      // freed the device yet (just unplugged/replugged, prior session, another
      // tab). One delayed retry clears the common case; a second failure is
      // surfaced with actionable guidance.
      this.log(`open failed (${(e as Error).message}) — retrying once`, 'info');
      await new Promise((r) => setTimeout(r, 800));
      try {
        await port.open({ baudRate: BAUD });
      } catch {
        throw new Error(
          'Could not open the serial port. Close any other tab or program using the plotter (including Arduino IDE / serial monitors), then unplug and replug the USB cable and try again.',
        );
      }
    }
    if (!port.writable || !port.readable) {
      await port.close().catch(() => {});
      throw new Error('Serial port opened without readable/writable streams.');
    }
    this.port = port;
    this.writer = port.writable.getWriter();
    this.readLoopPromise = this.readLoop();
    this.log(`opened @ ${BAUD}`, 'info');
    // Marlin resets on open; wait for boot.
    this.log('boot wait 2000ms…', 'info');
    await new Promise((r) => setTimeout(r, 2000));
    this.log('boot wait done; sending M115', 'info');
    // M115 is the liveness probe: a healthy Marlin always replies with a
    // FIRMWARE_NAME banner. A board that's been M112'd / killed answers
    // nothing, so a short timeout here lets us fail fast instead of
    // marching on (M115 timeout → G28 timeout) and falsely reporting a
    // live connection to a dead board.
    const info = await this.send('M115', 6_000);
    const alive = info.some((l) => /FIRMWARE_NAME|marlin/i.test(l));
    if (!alive) {
      this.log('no firmware response — board not responding', 'err');
      await this.disconnect().catch(() => {});
      throw new Error(
        'Plotter is not responding. If it was emergency-stopped, power-cycle the printer (off, wait, on), then reconnect.',
      );
    }
    this.log('M115 done; sending G28 (home)', 'info');
    this.onPhase('homing');
    await this.send('G28');
    this.log('G28 done; connected', 'info');
    this.onPhase(null);
  }

  async disconnect() {
    this.intentionalClose = true;
    // Release anything blocked on a pause so the print/interactive loops
    // can unwind instead of hanging on a closed port.
    this.paused = false;
    const waiters = this.resumeWaiters;
    this.resumeWaiters = [];
    for (const w of waiters) w();
    this.onPauseChange(false);
    try {
      this.reader?.cancel();
      this.writer?.releaseLock();
      await this.readLoopPromise;
      await this.port?.close();
    } finally {
      this.port = null;
      this.writer = null;
      this.reader = null;
      this.readLoopPromise = null;
      this.intentionalClose = false;
      this.log('closed', 'info');
    }
  }

  private async readLoop() {
    if (!this.port?.readable) return;
    const decoder = new TextDecoder();
    this.reader = this.port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        this.buffer += decoder.decode(value, { stream: true });
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
    } catch (e) {
      this.log(`read error: ${(e as Error).message}`, 'err');
    } finally {
      try {
        this.reader?.releaseLock();
      } catch {}
      // Loop ended without an intentional disconnect() → the device was
      // lost (unplugged, reset, or killed by M112). Drop state and notify
      // so the UI stops showing a live connection.
      if (!this.intentionalClose && this.port) {
        this.port = null;
        this.writer = null;
        this.reader = null;
        this.readLoopPromise = null;
        this.log('connection lost', 'err');
        this.onLost();
      }
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
    return new Promise<string | null>((resolve) => {
      let done = false;
      const t = setTimeout(() => {
        if (!done) {
          done = true;
          this.lineWaiter = null;
          resolve(null);
        }
      }, timeoutMs);
      this.lineWaiter = (line) => {
        if (!done) {
          done = true;
          clearTimeout(t);
          resolve(line);
        }
      };
    });
  }

  /**
   * Collect reply lines until `ok`. Uses an *inactivity* timeout, not a hard
   * deadline: slow commands like `G28` can take far longer than any fixed
   * budget, and Marlin emits `echo:busy: processing` every ~2s precisely so
   * the host knows it is still alive. We treat those as keepalives that keep
   * us waiting; we only give up after `idleTimeoutMs` of true silence.
   */
  private async readUntilOk(idleTimeoutMs = 20_000): Promise<string[]> {
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
  async send(gcode: string, idleTimeoutMs?: number): Promise<string[]> {
    // Strip comments; Marlin sends no `ok` for a comment-only line, so
    // sending one would stall readUntilOk for the full idle timeout.
    const line = gcode.replace(/;.*$/, '').trim();
    if (!line) return [];
    // Block here while paused so the *next* line isn't sent; the previous
    // line already got its `ok`, so the machine just holds position.
    await this.gate();
    if (!this.writer) return [];
    // Drop any lines left over from a previous command (e.g. trailing
    // async chatter after its `ok`) so they aren't mistaken for this reply.
    this.lineQueue.length = 0;
    this.log(line, 'tx');
    await this.writer.write(new TextEncoder().encode(`${line}\n`));
    return this.readUntilOk(idleTimeoutMs);
  }

  async sendMany(lines: string[]) {
    for (const l of lines) {
      await this.send(l);
    }
  }

  /**
   * Emergency stop. Writes M112 straight to the port, bypassing the
   * command/`ok` queue so it lands even mid-stream (Marlin's
   * EMERGENCY_PARSER acts on it immediately, full planner buffer or not).
   * The board enters a killed state afterwards and must be reconnected.
   */
  async emergencyStop() {
    if (!this.writer) return;
    this.log('M112 (emergency stop)', 'err');
    await this.writer.write(new TextEncoder().encode('M112\n'));
  }

  /** Query M114 and parse the X/Y/Z position from the reply. Null if no reply. */
  async getPosition(): Promise<{ x: number; y: number; z: number } | null> {
    const lines = await this.send('M114');
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
