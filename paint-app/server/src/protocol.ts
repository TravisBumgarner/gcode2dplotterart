/**
 * The wire contract between the plotter backend and its clients.
 *
 * This file is deliberately dependency-free, and the React client imports it
 * directly (`paint-app/src/plotterClient.ts`) rather than keeping a parallel
 * copy — a protocol that can drift between the two halves of an emergency stop
 * is not one worth having.
 */

export type LogKind = 'tx' | 'rx' | 'info' | 'err';

/** One line of the connection log. `t` is `Date.now()` at the time it was produced. */
export type LogLine = { t: number; kind: LogKind; line: string };

export type ConnectPhase = 'connecting' | 'homing';

export type PortInfo = {
  /**
   * What to hand back to `connect`. On Linux this is the `/dev/serial/by-id`
   * symlink when one exists, because that name survives a replug and a reboot;
   * `/dev/ttyUSB0` does not.
   */
  path: string;
  /** The underlying device node the path resolves to. Display only. */
  device: string;
  label: string;
  manufacturer?: string;
  vendorId?: string;
  productId?: string;
  serialNumber?: string;
  /** The USB vendor id belongs to a chip commonly found on Marlin/GRBL boards. */
  known: boolean;
};

export type JobState =
  | 'queued'
  | 'running'
  | 'awaiting_pen_swap'
  | 'paused'
  | 'done'
  | 'failed'
  | 'cancelled';

export type JobLayer = { name: string; color: string; lines: string[] };
export type JobLayerSummary = { name: string; color: string; lineCount: number };

/** A job without its G-code. Everything the UI needs to describe one. */
export type JobSummary = {
  id: string;
  name: string;
  plotterName: string;
  createdAt: number;
  layers: JobLayerSummary[];
  /** Prologue + every layer + epilogue. */
  totalLines: number;
};

export type JobProgress = {
  layerIndex: number;
  layerCount: number;
  layerName: string;
  color: string;
  /** Lines sent within the current layer. */
  lineIndex: number;
  lineCount: number;
  /** Lines sent across the whole job, prologue and epilogue included. */
  sentLines: number;
  totalLines: number;
};

export type JobStatus = {
  job: JobSummary;
  state: JobState;
  progress: JobProgress | null;
  /** Only set while `awaiting_pen_swap`: the layer that starts once you continue. */
  nextLayer: JobLayerSummary | null;
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
};

export type ConnectionStatus = {
  connected: boolean;
  connecting: boolean;
  phase: ConnectPhase | null;
  portPath: string | null;
  paused: boolean;
  /**
   * True from an `M112` until the next successful connect. The board is in a
   * killed state and needs a power cycle before it answers anything.
   */
  emergencyStopped: boolean;
};

export type ClientInfo = { id: string; name: string; controller: boolean; since: number };

export type SessionStatus = {
  /** The one client allowed to move the machine. Null when nobody holds it. */
  controllerId: string | null;
  clients: ClientInfo[];
};

export type Snapshot = {
  connection: ConnectionStatus;
  session: SessionStatus;
  activeJob: JobStatus | null;
};

/**
 * Client -> server. Every message may carry an `id`; when it does, the server
 * answers with a matching `ack` so callers can await a result.
 */
export type ClientMessage =
  | { id?: string; type: 'ping' }
  | { id?: string; type: 'identify'; name: string }
  /** Which log kinds to stream. `tx`/`rx` are thousands of lines per print. */
  | { id?: string; type: 'log.subscribe'; kinds: LogKind[] }
  | { id?: string; type: 'control.claim' }
  | { id?: string; type: 'control.release' }
  | { id?: string; type: 'control.takeover' }
  | { id?: string; type: 'connect'; portPath: string }
  | { id?: string; type: 'disconnect' }
  | { id?: string; type: 'job.start'; jobId: string }
  | { id?: string; type: 'job.continue' }
  | { id?: string; type: 'job.pause' }
  | { id?: string; type: 'job.resume' }
  | { id?: string; type: 'job.cancel' }
  /** Operator-driven moves. Bypasses the pause gate; acks with the reply lines. */
  | { id?: string; type: 'jog'; lines: string[] }
  /**
   * A batch of movement G-code from a live drawing session. Same allowlist as
   * `jog` and the same one-controller rule, but it honours the pause gate and
   * takes far more lines, because a single freehand stroke is hundreds of them.
   */
  | { id?: string; type: 'stream'; lines: string[] }
  | { id?: string; type: 'position' }
  /** Never gated on control, never queued behind a job. See `estop` in the README. */
  | { id?: string; type: 'estop' };

export type ServerMessage =
  | {
      type: 'hello';
      clientId: string;
      serverVersion: string;
      snapshot: Snapshot;
      /** The last few `info`/`err` lines, so a late joiner has context. */
      recentLog: LogLine[];
    }
  | { type: 'log'; lines: LogLine[] }
  | { type: 'connection'; connection: ConnectionStatus }
  | { type: 'session'; session: SessionStatus }
  | { type: 'job'; job: JobStatus | null }
  /** The port dropped without anyone asking it to. */
  | { type: 'lost' }
  | { type: 'ack'; id: string; ok: boolean; error?: string; data?: unknown }
  | { type: 'pong' };
