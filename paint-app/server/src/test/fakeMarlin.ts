import type { SerialTransport, TransportFactory } from '../transport.js';

export type WriteRecord = { line: string; at: number; seq: number };

export type FakeMarlinOptions = {
  /** Fail this many `open()` calls before the first success. */
  failOpens?: number;
  /** Report `isOpen` before anything opened it — a handle nobody released. */
  startsOpen?: boolean;
  /** Answer nothing, ever. A board that has been killed. */
  dead?: boolean;
  /** Extra reply lines emitted before `ok`, keyed by the command prefix. */
  replies?: Record<string, string[]>;
  /**
   * Commands that emit `echo:busy: processing` every `busyIntervalMs` for this
   * long before their `ok`. This is what G28 does on a real board.
   */
  busy?: Record<string, number>;
  busyIntervalMs?: number;
  /** Delay before the `ok` for an ordinary command. */
  replyDelayMs?: number;
  /** Emit no reply at all for these commands. */
  silent?: string[];
};

const DEFAULT_REPLIES: Record<string, string[]> = {
  M115: ['FIRMWARE_NAME:Marlin 2.1.2 (GitHub) SOURCE_CODE_URL:...', 'Cap:EMERGENCY_PARSER:1'],
  M114: ['X:10.00 Y:20.00 Z:5.00 E:0.00 Count X:800 Y:1600 Z:2000'],
};

/**
 * A Marlin board that lives in the test process.
 *
 * It answers `ok`, banners for `M115`, a position for `M114`, and pulses
 * `echo:busy` for slow moves — the four behaviours `PlotterConnection` was
 * written around. Every write is timestamped and sequenced so tests can assert
 * on *ordering*, which is the only way to prove the emergency stop actually
 * jumped the queue.
 */
export class FakeMarlin {
  readonly writes: WriteRecord[] = [];
  isOpen: boolean;
  openAttempts = 0;
  /** Set once M112 arrives; the board stops answering, as a killed one does. */
  killed = false;

  private dataCb: (chunk: string) => void = () => {};
  private closeCb: () => void = () => {};
  private errorCb: (err: Error) => void = () => {};
  private seq = 0;
  private timers = new Set<NodeJS.Timeout>();
  private readonly opts: Required<
    Pick<FakeMarlinOptions, 'busyIntervalMs' | 'replyDelayMs' | 'silent'>
  > &
    FakeMarlinOptions;

  constructor(opts: FakeMarlinOptions = {}) {
    this.opts = { busyIntervalMs: 10, replyDelayMs: 1, silent: [], ...opts };
    this.isOpen = Boolean(opts.startsOpen);
  }

  /** Hand this to `PlotterConnection` in place of the real serial transport. */
  get transport(): TransportFactory {
    return () => this.asTransport();
  }

  asTransport(): SerialTransport {
    // Captured for the `isOpen` getter below, which cannot be an arrow.
    const self = this;
    return {
      get isOpen() {
        return self.isOpen;
      },
      open: async () => {
        this.openAttempts++;
        if (this.opts.failOpens && this.openAttempts <= this.opts.failOpens) {
          throw new Error('Error: Resource temporarily unavailable, cannot open');
        }
        this.isOpen = true;
      },
      close: async () => {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.clearTimers();
        this.closeCb();
      },
      write: async (data: string) => {
        if (!this.isOpen) throw new Error('Port is not open');
        for (const raw of data.split('\n')) {
          const line = raw.trim();
          if (line) this.accept(line);
        }
      },
      onData: (cb) => {
        this.dataCb = cb;
      },
      onClose: (cb) => {
        this.closeCb = cb;
      },
      onError: (cb) => {
        this.errorCb = cb;
      },
    };
  }

  /** Rip the cable out. */
  unplug() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.clearTimers();
    this.errorCb(new Error('device disconnected'));
    this.closeCb();
  }

  emit(line: string) {
    this.dataCb(`${line}\n`);
  }

  /** Every line written, in order. */
  get written() {
    return this.writes.map((w) => w.line);
  }

  /** Lines written after the first occurrence of `line`. */
  writtenAfter(line: string) {
    const i = this.written.indexOf(line);
    return i < 0 ? null : this.written.slice(i + 1);
  }

  private later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
    return t;
  }

  private clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }

  private accept(line: string) {
    this.writes.push({ line, at: Date.now(), seq: this.seq++ });

    if (line.toUpperCase().startsWith('M112')) {
      // Marlin's emergency parser acts on M112 out of band, then the firmware
      // halts. The USB device stays enumerated; it just stops talking.
      this.killed = true;
      this.clearTimers();
      return;
    }
    if (this.killed || this.opts.dead) return;
    if (this.opts.silent?.some((s) => line.toUpperCase().startsWith(s.toUpperCase()))) return;

    const key = Object.keys({ ...DEFAULT_REPLIES, ...this.opts.replies }).find((k) =>
      line.toUpperCase().startsWith(k.toUpperCase()),
    );
    const extra = key ? ({ ...DEFAULT_REPLIES, ...this.opts.replies }[key] ?? []) : [];

    const busyKey = Object.keys(this.opts.busy ?? {}).find((k) =>
      line.toUpperCase().startsWith(k.toUpperCase()),
    );
    const busyFor = busyKey ? (this.opts.busy?.[busyKey] ?? 0) : 0;

    if (busyFor > 0) {
      const interval = this.opts.busyIntervalMs;
      for (let t = interval; t < busyFor; t += interval) {
        this.later(() => this.emit('echo:busy: processing'), t);
      }
      this.later(() => {
        for (const l of extra) this.emit(l);
        this.emit('ok');
      }, busyFor);
      return;
    }

    this.later(() => {
      for (const l of extra) this.emit(l);
      this.emit('ok');
    }, this.opts.replyDelayMs);
  }
}

/** Timings small enough that a full connect takes milliseconds. */
export const FAST_TIMING = {
  bootWaitMs: 5,
  reopenDelayMs: 5,
  openRetryDelayMs: 5,
  defaultIdleTimeoutMs: 500,
  probeTimeoutMs: 200,
};
