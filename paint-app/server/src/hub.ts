import { randomUUID } from 'node:crypto';
import { JobRunner, JobStore } from './jobs.js';
import { PlotterConnection, type PlotterConnectionOptions } from './plotter.js';
import type {
  ClientInfo,
  ClientMessage,
  ConnectionStatus,
  LogKind,
  LogLine,
  ServerMessage,
  SessionStatus,
  Snapshot,
} from './protocol.js';

/** How long log lines are held before going out as one frame. */
const LOG_FLUSH_MS = 50;
/** Ceiling on a single log frame; a print outruns any socket otherwise. */
const LOG_BATCH_MAX = 500;
/** Context handed to a client that joins mid-session. */
const RECENT_LOG_MAX = 200;

/**
 * G-code a client may send outside a job. Deliberately narrow: this is the
 * "type anything at the machine" hole, and jogging plus a few status queries is
 * all the UI actually needs. Anything structural belongs in a job.
 */
const JOG_ALLOWED = /^(G(0|1|4|21|28|90|91|92)|M(17|18|84|105|114|115|400))\b/i;
const MAX_JOG_LINES = 32;
/**
 * A `stream` batch is one freehand stroke's worth of moves, which is a few
 * hundred `G1`s. The cap is here to bound a single message, not to be a
 * meaningful limit on drawing — anything larger belongs in a job.
 */
const MAX_STREAM_LINES = 2000;

export type Client = {
  id: string;
  name: string;
  since: number;
  logKinds: Set<LogKind>;
  send: (msg: ServerMessage) => void;
};

export type HubOptions = {
  serverVersion?: string;
  maxJobs?: number;
  /** Passed through to `PlotterConnection`; tests shrink the timings. */
  connection?: Pick<PlotterConnectionOptions, 'transport' | 'timing'>;
};

export type CommandResult = { ok: boolean; error?: string; data?: unknown };

/**
 * The single owner of the serial port, the job runner, and the connected
 * clients.
 *
 * Electron got single-ownership for free by refusing to launch twice. Over a
 * network any number of browsers can reach the Pi at once, so ownership is
 * explicit: exactly one client holds control and may move the machine; the rest
 * watch. Control is not a security boundary — anyone who can reach the port can
 * take it — it exists to stop two well-meaning people from interleaving G-code.
 *
 * The one exception is the emergency stop, which any client may fire at any
 * time. A safety control you have to request permission to use is not one.
 */
export class Hub {
  readonly connection: PlotterConnection;
  readonly runner: JobRunner;
  readonly jobs: JobStore;

  private clients = new Map<string, Client>();
  private controllerId: string | null = null;
  private pendingLog: LogLine[] = [];
  private recentLog: LogLine[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private droppedLogLines = 0;
  private readonly serverVersion: string;

  constructor(opts: HubOptions = {}) {
    this.serverVersion = opts.serverVersion ?? '0.0.0';
    this.jobs = new JobStore(opts.maxJobs);
    this.connection = new PlotterConnection({
      ...opts.connection,
      log: (line, kind) => this.pushLog(line, kind),
      onPhase: () => this.broadcastConnection(),
      onLost: () => {
        // The board went away mid-print. Fail the job now rather than letting
        // it grind through the remaining lines against a dead port.
        this.runner.abort('connection lost');
        this.broadcast({ type: 'lost' });
        this.broadcastConnection();
      },
      onPauseChange: () => {
        this.runner.notify();
        this.broadcastConnection();
      },
    });
    this.runner = new JobRunner(this.connection, (status) =>
      this.broadcast({ type: 'job', job: status }),
    );
  }

  // ---------------------------------------------------------------- clients

  addClient(send: (msg: ServerMessage) => void): Client {
    const client: Client = {
      id: randomUUID(),
      name: 'anonymous',
      since: Date.now(),
      // tx/rx are opt-in; a print emits thousands of them and most viewers
      // only care that something is happening.
      logKinds: new Set<LogKind>(['info', 'err']),
      send,
    };
    this.clients.set(client.id, client);
    // First one in gets control, so the common single-user case needs no
    // ceremony. Anyone joining a live session starts read-only.
    if (!this.controllerId) this.controllerId = client.id;
    client.send({
      type: 'hello',
      clientId: client.id,
      serverVersion: this.serverVersion,
      snapshot: this.snapshot(),
      recentLog: [...this.recentLog],
    });
    this.broadcastSession();
    return client;
  }

  removeClient(id: string) {
    if (!this.clients.delete(id)) return;
    // A closed tab shouldn't be able to strand the machine. Control goes back
    // to the pool; the job carries on, because the job is ours, not the tab's.
    if (this.controllerId === id) {
      this.controllerId = this.clients.keys().next().value ?? null;
    }
    this.broadcastSession();
  }

  get controller() {
    return this.controllerId;
  }

  // ---------------------------------------------------------------- status

  connectionStatus(): ConnectionStatus {
    return {
      connected: this.connection.connected,
      connecting: this.connection.currentPhase !== null,
      phase: this.connection.currentPhase,
      portPath: this.connection.path,
      paused: this.connection.isPaused,
      emergencyStopped: this.connection.isEmergencyStopped,
    };
  }

  sessionStatus(): SessionStatus {
    const clients: ClientInfo[] = [...this.clients.values()].map((c) => ({
      id: c.id,
      name: c.name,
      controller: c.id === this.controllerId,
      since: c.since,
    }));
    return { controllerId: this.controllerId, clients };
  }

  snapshot(): Snapshot {
    return {
      connection: this.connectionStatus(),
      session: this.sessionStatus(),
      activeJob: this.runner.view,
    };
  }

  // ------------------------------------------------------------------- log

  private pushLog(line: string, kind: LogKind) {
    const entry: LogLine = { t: Date.now(), kind, line };
    if (kind === 'info' || kind === 'err') {
      this.recentLog.push(entry);
      if (this.recentLog.length > RECENT_LOG_MAX) this.recentLog.shift();
    }
    if (this.pendingLog.length >= LOG_BATCH_MAX) {
      this.droppedLogLines++;
      return;
    }
    this.pendingLog.push(entry);
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flushLog(), LOG_FLUSH_MS);
  }

  private flushLog() {
    this.flushTimer = null;
    const batch = this.pendingLog;
    this.pendingLog = [];
    if (this.droppedLogLines > 0) {
      batch.push({
        t: Date.now(),
        kind: 'info',
        line: `… ${this.droppedLogLines} log line(s) dropped (client too slow)`,
      });
      this.droppedLogLines = 0;
    }
    if (batch.length === 0) return;
    for (const client of this.clients.values()) {
      const lines = batch.filter((l) => client.logKinds.has(l.kind));
      if (lines.length > 0) client.send({ type: 'log', lines });
    }
  }

  /** Stop the flush timer so a test or a shutdown doesn't hang on it. */
  dispose() {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = null;
  }

  // ------------------------------------------------------------- broadcast

  broadcast(msg: ServerMessage) {
    for (const client of this.clients.values()) client.send(msg);
  }

  private broadcastConnection() {
    this.broadcast({ type: 'connection', connection: this.connectionStatus() });
  }

  private broadcastSession() {
    this.broadcast({ type: 'session', session: this.sessionStatus() });
  }

  // -------------------------------------------------------------- commands

  /**
   * The one hole through which a client can put arbitrary text on the wire.
   * Every line has to be a single movement or status command from the
   * allowlist; anything structural belongs in a job, where the line count is
   * fixed up front and progress can be reported against it.
   */
  private validateGcode(raw: unknown, max: number): string[] {
    const lines = Array.isArray(raw) ? raw : [];
    if (lines.length === 0 || lines.length > max) {
      throw new Error(`Send between 1 and ${max} lines.`);
    }
    for (const line of lines) {
      if (typeof line !== 'string' || /[\r\n]/.test(line)) {
        throw new Error('Invalid G-code line.');
      }
      if (!JOG_ALLOWED.test(line.trim())) {
        throw new Error(`Not allowed outside a job: ${line}`);
      }
    }
    return lines as string[];
  }

  private requireControl(clientId: string) {
    if (this.controllerId !== clientId) {
      throw new Error('Read-only: another client is controlling this plotter. Take control first.');
    }
  }

  /**
   * Emergency stop. Not gated on control, not queued behind the job, and
   * reachable over both WebSocket and REST so a wedged socket can't be the
   * thing standing between a person and a stopped machine.
   */
  async emergencyStop() {
    await this.connection.emergencyStop();
    this.runner.abort('emergency stop');
    // M112 kills the firmware; the port is useless until the board is
    // power-cycled. Tear down so nothing shows a live connection.
    await this.connection.disconnect().catch(() => {});
    this.broadcastConnection();
  }

  async handle(clientId: string, msg: ClientMessage): Promise<CommandResult> {
    const client = this.clients.get(clientId);
    if (!client) return { ok: false, error: 'Unknown client' };
    try {
      const data = await this.dispatch(client, msg);
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  private async dispatch(client: Client, msg: ClientMessage): Promise<unknown> {
    switch (msg.type) {
      case 'ping':
        return undefined;

      case 'identify':
        client.name = String(msg.name ?? '').slice(0, 64) || 'anonymous';
        this.broadcastSession();
        return undefined;

      case 'log.subscribe': {
        const kinds = Array.isArray(msg.kinds) ? msg.kinds : [];
        client.logKinds = new Set(
          kinds.filter((k): k is LogKind => ['tx', 'rx', 'info', 'err'].includes(k)),
        );
        return undefined;
      }

      case 'control.claim':
        if (this.controllerId && this.controllerId !== client.id) {
          throw new Error('Another client holds control. Use takeover to force it.');
        }
        this.controllerId = client.id;
        this.broadcastSession();
        return undefined;

      case 'control.release':
        if (this.controllerId !== client.id) return undefined;
        this.controllerId = [...this.clients.keys()].find((id) => id !== client.id) ?? null;
        this.broadcastSession();
        return undefined;

      case 'control.takeover':
        // Deliberately unconditional. The alternative is a stuck session with
        // no way out, and the previous holder is told immediately.
        this.controllerId = client.id;
        this.broadcastSession();
        return undefined;

      case 'estop':
        await this.emergencyStop();
        return undefined;

      case 'connect': {
        this.requireControl(client.id);
        if (typeof msg.portPath !== 'string' || !msg.portPath) {
          throw new Error('portPath is required');
        }
        await this.connection.connect(msg.portPath);
        this.broadcastConnection();
        return undefined;
      }

      case 'disconnect':
        this.requireControl(client.id);
        if (this.runner.isActive) throw new Error('Cancel the running job first.');
        await this.connection.disconnect();
        this.broadcastConnection();
        return undefined;

      case 'job.start': {
        this.requireControl(client.id);
        const job = this.jobs.get(msg.jobId);
        if (!job) throw new Error('No such job. Upload it first.');
        return this.runner.start(job);
      }

      case 'job.continue':
        this.requireControl(client.id);
        this.runner.continue();
        return undefined;

      case 'job.pause':
        this.requireControl(client.id);
        this.connection.pause();
        return undefined;

      case 'job.resume':
        this.requireControl(client.id);
        this.connection.resume();
        return undefined;

      case 'job.cancel':
        this.requireControl(client.id);
        this.runner.cancel();
        return undefined;

      case 'jog': {
        this.requireControl(client.id);
        // Jogging while a job is mid-layer would splice movement into the
        // drawing. At a pen swap, or paused, it is exactly what you want.
        if (this.runner.view?.state === 'running') {
          throw new Error('Cannot jog while a job is running. Pause it first.');
        }
        const lines = this.validateGcode(msg.lines, MAX_JOG_LINES);
        // The reply lines come back so the client can read an `M114` or an
        // `M115` banner without a second round trip.
        const replies: string[] = [];
        for (const line of lines) {
          replies.push(...(await this.connection.send(line, { bypassPause: true })));
        }
        return replies;
      }

      case 'stream': {
        this.requireControl(client.id);
        // Interactive strokes and a job are two things drawing on the same
        // page at once. The job wins; the stroke is refused rather than
        // interleaved.
        if (this.runner.isActive) {
          throw new Error('Cannot draw interactively while a job is loaded. Cancel it first.');
        }
        const lines = this.validateGcode(msg.lines, MAX_STREAM_LINES);
        // No bypassPause: an interactive stroke is exactly the output that
        // Pause exists to hold back.
        await this.connection.sendMany(lines);
        return undefined;
      }

      case 'position': {
        this.requireControl(client.id);
        if (this.runner.view?.state === 'running') {
          throw new Error('Cannot query position while a job is running.');
        }
        return this.connection.getPosition();
      }

      default: {
        const unknown = msg as { type?: string };
        throw new Error(`Unknown message type: ${unknown.type}`);
      }
    }
  }
}
