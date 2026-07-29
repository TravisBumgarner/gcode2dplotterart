import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { PlotterConnection } from './plotter.js';
import type { JobLayer, JobLayerSummary, JobProgress, JobStatus, JobSummary } from './protocol.js';

/**
 * A single G-code line. Newlines are rejected rather than split, so one entry
 * in the array can never smuggle in extra commands: a job that claims to be
 * 400 lines must be 400 lines, which is what the progress numbers rest on.
 */
const gcodeLine = z
  .string()
  .max(256)
  .refine((s) => !/[\r\n]/.test(s), 'G-code lines must not contain line breaks');

/** Around 30 MB of G-code — far past any real page, well short of trouble. */
const MAX_TOTAL_LINES = 1_000_000;

export const jobUploadSchema = z
  .object({
    name: z.string().min(1).max(200),
    plotterName: z.string().min(1).max(200),
    prologue: z.array(gcodeLine).max(1000).default([]),
    layers: z
      .array(
        z.object({
          name: z.string().max(200).default(''),
          color: z.string().max(64).default('#000000'),
          lines: z.array(gcodeLine),
        }),
      )
      .min(1),
    epilogue: z.array(gcodeLine).max(1000).default([]),
  })
  .refine(
    (j) => j.prologue.length + j.layers.reduce((n, l) => n + l.lines.length, 0) < MAX_TOTAL_LINES,
    `Job exceeds ${MAX_TOTAL_LINES} lines`,
  );

export type JobUpload = z.infer<typeof jobUploadSchema>;

export type Job = JobUpload & { id: string; createdAt: number };

export const totalLines = (job: Job) =>
  job.prologue.length + job.layers.reduce((n, l) => n + l.lines.length, 0) + job.epilogue.length;

const layerSummary = (l: JobLayer): JobLayerSummary => ({
  name: l.name,
  color: l.color,
  lineCount: l.lines.length,
});

export const summarize = (job: Job): JobSummary => ({
  id: job.id,
  name: job.name,
  plotterName: job.plotterName,
  createdAt: job.createdAt,
  layers: job.layers.map(layerSummary),
  totalLines: totalLines(job),
});

/**
 * Uploaded jobs, in memory only. A job is a snapshot of a page the client
 * already had; if the server restarts, re-uploading it is one click. Persisting
 * megabytes of G-code to the Pi's SD card to save that click is a bad trade.
 */
export class JobStore {
  private jobs = new Map<string, Job>();

  constructor(private readonly max = 20) {}

  add(upload: JobUpload): Job {
    const job: Job = { ...upload, id: randomUUID(), createdAt: Date.now() };
    this.jobs.set(job.id, job);
    // Map iteration is insertion-ordered, so the first key is the oldest.
    while (this.jobs.size > this.max) {
      const oldest = this.jobs.keys().next();
      if (oldest.done) break;
      this.jobs.delete(oldest.value);
    }
    return job;
  }

  get(id: string) {
    return this.jobs.get(id);
  }

  delete(id: string) {
    return this.jobs.delete(id);
  }

  list(): JobSummary[] {
    return [...this.jobs.values()].sort((a, b) => b.createdAt - a.createdAt).map(summarize);
  }
}

/** Emit progress at most this often; a print is thousands of lines. */
const PROGRESS_INTERVAL_MS = 250;

/**
 * Runs a job against the plotter, locally.
 *
 * The point of the backend is that this loop lives next to the USB cable. Each
 * line still waits for its `ok` — that is how Marlin flow control works — but
 * the round trip is over USB, not over the network. Clients watch.
 *
 * The pen swap between layers used to be a `Promise` parked in a React
 * component: close the tab and the print was orphaned mid-page. It is state
 * here now, so the operator can walk away, swap the pen, and continue from
 * whatever device is to hand.
 */
export class JobRunner {
  private status: JobStatus | null = null;
  private continueWaiter: (() => void) | null = null;
  private stopReason: 'cancelled' | string | null = null;
  private runPromise: Promise<void> = Promise.resolve();
  private lastProgressAt = 0;

  constructor(
    private readonly conn: PlotterConnection,
    private readonly onChange: (status: JobStatus | null) => void = () => {},
  ) {}

  /**
   * What clients see. `paused` is derived rather than stored: the pause lives on
   * the connection (it gates interactive strokes too), and a job that is parked
   * at a pen swap is not additionally "paused".
   */
  get view(): JobStatus | null {
    if (!this.status) return null;
    const state =
      this.status.state === 'running' && this.conn.isPaused ? 'paused' : this.status.state;
    return { ...this.status, state };
  }

  get isActive() {
    const s = this.status?.state;
    return s === 'running' || s === 'awaiting_pen_swap';
  }

  /** Resolves when the current run finishes, however it finishes. */
  settled() {
    return this.runPromise;
  }

  /** Re-broadcast, e.g. when the connection's pause flag flipped underneath us. */
  notify() {
    this.onChange(this.view);
  }

  start(job: Job) {
    if (this.isActive) throw new Error('A job is already running.');
    if (!this.conn.connected) throw new Error('Not connected to a plotter.');
    this.stopReason = null;
    this.continueWaiter = null;
    this.status = {
      job: summarize(job),
      state: 'running',
      progress: {
        layerIndex: 0,
        layerCount: job.layers.length,
        layerName: job.layers[0]?.name ?? '',
        color: job.layers[0]?.color ?? '#000000',
        lineIndex: 0,
        lineCount: job.layers[0]?.lines.length ?? 0,
        sentLines: 0,
        totalLines: totalLines(job),
      },
      nextLayer: null,
      error: null,
      startedAt: Date.now(),
      finishedAt: null,
    };
    this.notify();
    this.runPromise = this.run(job);
    return this.view as JobStatus;
  }

  /** Operator has swapped the pen and wants the next layer. */
  continue() {
    if (this.status?.state !== 'awaiting_pen_swap') {
      throw new Error('The job is not waiting for a pen swap.');
    }
    const waiter = this.continueWaiter;
    this.continueWaiter = null;
    waiter?.();
  }

  cancel() {
    if (!this.isActive) throw new Error('No job is running.');
    this.stop('cancelled');
  }

  /**
   * Stop for a reason that isn't the operator asking — device lost, emergency
   * stop. The loop notices at the next line boundary; anything already blocked
   * on a reply was failed by the connection itself.
   */
  abort(reason: string) {
    if (!this.isActive) return;
    this.stop(reason);
  }

  private stop(reason: string) {
    this.stopReason = reason;
    const waiter = this.continueWaiter;
    this.continueWaiter = null;
    waiter?.();
  }

  private checkStop() {
    if (this.stopReason) throw new Error(this.stopReason);
  }

  private progress(patch: Partial<JobProgress>, force = false) {
    if (!this.status?.progress) return;
    this.status.progress = { ...this.status.progress, ...patch };
    const now = Date.now();
    if (!force && now - this.lastProgressAt < PROGRESS_INTERVAL_MS) return;
    this.lastProgressAt = now;
    this.notify();
  }

  private async sendBlock(lines: string[], onSent: () => void) {
    for (const line of lines) {
      this.checkStop();
      await this.conn.send(line);
      onSent();
    }
  }

  private async run(job: Job) {
    if (!this.status) return;
    let sent = 0;
    try {
      await this.sendBlock(job.prologue, () => {
        sent++;
        this.progress({ sentLines: sent });
      });

      for (let i = 0; i < job.layers.length; i++) {
        this.checkStop();
        const layer = job.layers[i];
        this.progress(
          {
            layerIndex: i,
            layerName: layer.name,
            color: layer.color,
            lineIndex: 0,
            lineCount: layer.lines.length,
            sentLines: sent,
          },
          true,
        );

        let inLayer = 0;
        await this.sendBlock(layer.lines, () => {
          sent++;
          inLayer++;
          this.progress({ lineIndex: inLayer, sentLines: sent });
        });

        const next = job.layers[i + 1];
        if (!next) continue;
        // The plotter is holding position with the pen up. Park here until a
        // client says the next colour is loaded.
        this.status.state = 'awaiting_pen_swap';
        this.status.nextLayer = layerSummary(next);
        this.progress({ sentLines: sent }, true);
        await new Promise<void>((resolve) => {
          this.continueWaiter = resolve;
        });
        this.checkStop();
        this.status.state = 'running';
        this.status.nextLayer = null;
        this.progress({ sentLines: sent }, true);
      }

      await this.sendBlock(job.epilogue, () => {
        sent++;
        this.progress({ sentLines: sent });
      });

      this.finish('done', null);
    } catch (e) {
      const message = (e as Error).message;
      this.finish(this.stopReason === 'cancelled' ? 'cancelled' : 'failed', message);
    }
  }

  private finish(state: 'done' | 'failed' | 'cancelled', error: string | null) {
    if (!this.status) return;
    this.status.state = state;
    this.status.nextLayer = null;
    this.status.error = state === 'cancelled' ? null : error;
    this.status.finishedAt = Date.now();
    this.notify();
  }
}
