import type {
  ClientMessage,
  ConnectionStatus,
  JobStatus,
  JobSummary,
  LogKind,
  LogLine,
  PortInfo,
  ServerMessage,
  SessionStatus,
  Snapshot,
} from '../server/src/protocol.js';

export type {
  ConnectionStatus,
  ConnectPhase,
  JobLayerSummary,
  JobState,
  JobStatus,
  JobSummary,
  LogKind,
  LogLine,
  PortInfo,
  SessionStatus,
} from '../server/src/protocol.js';

/** How the page's own link to the server is doing, as opposed to the plotter's. */
export type SocketState = 'connecting' | 'open' | 'closed';

export type JobUpload = {
  name: string;
  plotterName: string;
  prologue: string[];
  layers: { name: string; color: string; lines: string[] }[];
  epilogue: string[];
};

export type PlotterClientOptions = {
  /**
   * Origin of the plotter server, e.g. `http://plotter.local:8080`. Empty
   * string means same-origin, which is the production case — the server serves
   * this page. Resolved by the caller so this class stays free of `window` and
   * can be exercised under Node against the real server.
   */
  baseUrl: string;
  /** Shown to other clients in the session list. */
  name?: string;
  onLog?: (lines: LogLine[]) => void;
  onConnection?: (status: ConnectionStatus) => void;
  onSession?: (session: SessionStatus, selfId: string | null) => void;
  onJob?: (job: JobStatus | null) => void;
  onSocket?: (state: SocketState) => void;
  /** The plotter dropped off the port without anyone asking it to. */
  onLost?: () => void;
};

/** Reconnect backoff. Fast enough to survive a Pi reboot without a page reload. */
const RECONNECT_MIN_MS = 500;
const RECONNECT_MAX_MS = 5_000;

/**
 * A `stream` message is capped server-side; one long freehand stroke can exceed
 * it, so batches are split. Each chunk still waits for its ack before the next
 * goes out, so ordering on the wire is unchanged.
 */
const STREAM_CHUNK = 1000;

/** Marlin has no use for our comments and the server's allowlist rejects them. */
const stripComments = (lines: string[]) =>
  lines.map((l) => l.replace(/;.*$/, '').trim()).filter((l) => l.length > 0);

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/**
 * The client half of the plotter protocol.
 *
 * This replaces the Web Serial wrapper that used to live in `serial.ts`. The
 * shape is deliberately close to it — `connect` / `disconnect` / `send` /
 * `sendMany` / `pause` / `resume` / `emergencyStop` / `getPosition`, with `log`
 * and `lost` callbacks — so the components that drive it barely changed. Three
 * things genuinely differ, and they are the point of the exercise:
 *
 * - `connect` takes a port path, because the port is on the Pi and the browser
 *   has no picker for it. `listPorts()` is where that path comes from.
 * - A print is uploaded whole and run by the server. `sendMany` is only for
 *   interactive strokes now; a page of art never crosses the network line by
 *   line.
 * - State is the server's, not ours. Everything interesting arrives as a
 *   broadcast, including changes another browser made.
 */
export class PlotterClient {
  readonly baseUrl: string;

  private socket: WebSocket | null = null;
  private closed = false;
  private reconnectDelay = RECONNECT_MIN_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private nextRequestId = 0;
  private pending = new Map<
    string,
    { resolve: (data: unknown) => void; reject: (e: Error) => void }
  >();
  private openResolvers: (() => void)[] = [];
  private logKinds: LogKind[] = ['info', 'err'];
  private selfId: string | null = null;
  private readonly opts: PlotterClientOptions;

  constructor(opts: PlotterClientOptions) {
    this.opts = opts;
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
  }

  get clientId() {
    return this.selfId;
  }

  // ----------------------------------------------------------------- socket

  /** Open the session socket and keep it open until `stop()`. */
  start() {
    this.closed = false;
    this.openSocket();
  }

  stop() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
    this.failPending(new Error('Disconnected from the plotter server.'));
  }

  private openSocket() {
    if (this.closed) return;
    this.opts.onSocket?.('connecting');
    const socket = new WebSocket(this.wsUrl());
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectDelay = RECONNECT_MIN_MS;
      this.opts.onSocket?.('open');
      // Re-announce on every reconnect: to the server this is a brand new
      // client, with a new id and no memory of what the last one asked for.
      if (this.opts.name) this.raw({ type: 'identify', name: this.opts.name });
      this.raw({ type: 'log.subscribe', kinds: this.logKinds });
      const waiters = this.openResolvers;
      this.openResolvers = [];
      for (const w of waiters) w();
    };

    socket.onmessage = (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      this.receive(msg);
    };

    socket.onclose = () => {
      if (this.socket === socket) this.socket = null;
      this.opts.onSocket?.('closed');
      // Anything waiting on an ack will never get one. Fail it now rather
      // than leaving a button spinning forever.
      this.failPending(new Error('Lost the connection to the plotter server.'));
      if (this.closed) return;
      this.reconnectTimer = setTimeout(() => this.openSocket(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
    };

    // `onerror` is always followed by `onclose`; reconnecting is handled there.
    socket.onerror = () => {};
  }

  private receive(msg: ServerMessage) {
    switch (msg.type) {
      case 'hello':
        this.selfId = msg.clientId;
        this.opts.onConnection?.(msg.snapshot.connection);
        this.opts.onSession?.(msg.snapshot.session, this.selfId);
        this.opts.onJob?.(msg.snapshot.activeJob);
        if (msg.recentLog.length > 0) this.opts.onLog?.(msg.recentLog);
        break;
      case 'log':
        this.opts.onLog?.(msg.lines);
        break;
      case 'connection':
        this.opts.onConnection?.(msg.connection);
        break;
      case 'session':
        this.opts.onSession?.(msg.session, this.selfId);
        break;
      case 'job':
        this.opts.onJob?.(msg.job);
        break;
      case 'lost':
        this.opts.onLost?.();
        break;
      case 'ack': {
        const waiter = this.pending.get(msg.id);
        if (!waiter) break;
        this.pending.delete(msg.id);
        if (msg.ok) waiter.resolve(msg.data);
        else waiter.reject(new Error(msg.error ?? 'The plotter server refused that.'));
        break;
      }
    }
  }

  private failPending(error: Error) {
    const waiters = [...this.pending.values()];
    this.pending.clear();
    for (const w of waiters) w.reject(error);
  }

  private raw(msg: ClientMessage) {
    this.socket?.send(JSON.stringify(msg));
  }

  private whenOpen(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.closed) return Promise.reject(new Error('Not connected to the plotter server.'));
    return new Promise<void>((resolve) => this.openResolvers.push(resolve));
  }

  /** Send a command and wait for the server's verdict on it. */
  private async request(msg: ClientMessage): Promise<unknown> {
    await this.whenOpen();
    const id = `c${this.nextRequestId++}`;
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket?.send(JSON.stringify({ ...msg, id }));
    });
  }

  private wsUrl() {
    return `${this.baseUrl.replace(/^http/, 'ws')}/ws`;
  }

  // -------------------------------------------------------------- REST bits

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) throw new Error(`${path} failed (${res.status})`);
    return (await res.json()) as T;
  }

  /** The port picker's contents. Replaces `navigator.serial.requestPort()`. */
  async listPorts(): Promise<PortInfo[]> {
    const { ports } = await this.get<{ ports: PortInfo[] }>('/api/ports');
    return ports;
  }

  async snapshot(): Promise<Snapshot> {
    return this.get<Snapshot>('/api/state');
  }

  async uploadJob(job: JobUpload): Promise<JobSummary> {
    const res = await fetch(`${this.baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(job),
    });
    const body = (await res.json().catch(() => null)) as {
      job?: JobSummary;
      error?: string;
    } | null;
    if (!res.ok || !body?.job) throw new Error(body?.error ?? `Upload failed (${res.status})`);
    return body.job;
  }

  // ------------------------------------------------------------- the plotter

  async connect(portPath: string) {
    await this.request({ type: 'connect', portPath });
  }

  async disconnect() {
    await this.request({ type: 'disconnect' });
  }

  /** Send one line and get back whatever the board said before its `ok`. */
  async send(gcode: string): Promise<string[]> {
    const lines = stripComments([gcode]);
    if (lines.length === 0) return [];
    const data = await this.request({ type: 'jog', lines });
    return Array.isArray(data) ? (data as string[]) : [];
  }

  /**
   * Stream a batch of movement G-code — an interactive stroke, a calibration
   * sequence. NOT how a print is sent: that goes through `uploadJob` so the
   * send loop runs next to the cable instead of across the network.
   */
  async sendMany(lines: string[]) {
    const clean = stripComments(lines);
    if (clean.length === 0) return;
    for (const batch of chunk(clean, STREAM_CHUNK)) {
      await this.request({ type: 'stream', lines: batch });
    }
  }

  async pause() {
    await this.request({ type: 'job.pause' });
  }

  async resume() {
    await this.request({ type: 'job.resume' });
  }

  async getPosition(): Promise<{ x: number; y: number; z: number } | null> {
    const data = await this.request({ type: 'position' });
    return (data as { x: number; y: number; z: number } | null) ?? null;
  }

  /**
   * Emergency stop.
   *
   * This deliberately does not go through `request()`. That path waits for the
   * socket to be open, takes a slot in the ack table, and — on the server side —
   * lands in the same dispatcher as everything else. A stop that can be delayed
   * by any of those is not a stop.
   *
   * `POST /api/estop` is a bare HTTP request the server answers without
   * consulting the control lock, the write queue, the pause gate, or the
   * running job. Any client may fire it, including a read-only observer: a
   * safety control you have to ask permission to use is not one. The socket is
   * only a fallback for when HTTP itself fails, and `estop` is ungated there
   * too.
   */
  async emergencyStop(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/estop`, { method: 'POST' });
      if (res.ok) return;
      throw new Error(`Emergency stop failed (${res.status})`);
    } catch (e) {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.raw({ type: 'estop' });
        return;
      }
      throw e;
    }
  }

  // ------------------------------------------------------------------- jobs

  async startJob(jobId: string) {
    await this.request({ type: 'job.start', jobId });
  }

  /** Operator has swapped the pen; run the next layer. */
  async continueJob() {
    await this.request({ type: 'job.continue' });
  }

  async cancelJob() {
    await this.request({ type: 'job.cancel' });
  }

  // ---------------------------------------------------------------- control

  async claimControl() {
    await this.request({ type: 'control.claim' });
  }

  async releaseControl() {
    await this.request({ type: 'control.release' });
  }

  /** Unconditional. See the takeover warning in the UI. */
  async takeControl() {
    await this.request({ type: 'control.takeover' });
  }

  setLogKinds(kinds: LogKind[]) {
    this.logKinds = kinds;
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.raw({ type: 'log.subscribe', kinds });
    }
  }
}
