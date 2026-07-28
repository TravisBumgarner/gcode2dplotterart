import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type ConnectedDataConfig,
  elapsedToX,
  getNumber,
  plotArea,
  seriesWindowFull,
  snapshotPoints,
  valueToY,
} from './connectedData';
import { fetchText } from './desktop';
import { useProject } from './project';
import { useStore } from './store';
import type { Point } from './types';

export type ConnectedDataStatus = {
  polls: number;
  lastPollAt: number | null;
  lastError: string | null;
  /** Live series have run off the right edge of the page; they stop extending. */
  windowFull: boolean;
};

const IDLE_STATUS: ConnectedDataStatus = {
  polls: 0,
  lastPollAt: null,
  lastError: null,
  windowFull: false,
};

type ConnectedDataCtx = {
  config: ConnectedDataConfig | null;
  status: ConnectedDataStatus;
  start: (config: ConnectedDataConfig) => void;
  stop: () => void;
  /** Called by the sync loop. Stable identity — the loop depends on it. */
  reportStatus: (status: ConnectedDataStatus) => void;
};

const ConnectedDataContext = createContext<ConnectedDataCtx | null>(null);

export const ConnectedDataProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ConnectedDataConfig | null>(null);
  const [status, setStatus] = useState<ConnectedDataStatus>(IDLE_STATUS);

  const start = useCallback((next: ConnectedDataConfig) => {
    setStatus(IDLE_STATUS);
    setConfig(next);
  }, []);

  const stop = useCallback(() => {
    setConfig(null);
    setStatus(IDLE_STATUS);
  }, []);

  const reportStatus = useCallback((next: ConnectedDataStatus) => setStatus(next), []);

  const value = useMemo<ConnectedDataCtx>(
    () => ({ config, status, start, stop, reportStatus }),
    [config, status, start, stop, reportStatus],
  );

  return <ConnectedDataContext.Provider value={value}>{children}</ConnectedDataContext.Provider>;
};

export const useConnectedData = () => {
  const ctx = useContext(ConnectedDataContext);
  if (!ctx) throw new Error('useConnectedData must be used within ConnectedDataProvider');
  return ctx;
};

/**
 * Drives a Connected Data session: polls the endpoint on its interval and
 * turns each response into strokes.
 *
 * Live series are emitted as one short segment per poll (previous sample →
 * new sample) rather than as one ever-growing polyline. That is what makes
 * them plottable: the interactive streamer sends each new stroke exactly once,
 * so the pen extends the curve instead of retracing it from the origin on
 * every tick. Snapshots are the opposite — the whole array is a single stroke,
 * re-emitted only when the underlying data actually changes.
 */
export const useConnectedDataSync = () => {
  // Only `config` and `reportStatus` are read: both are stable across status
  // updates, so a status report can't tear down and restart the poll loop.
  const { config, reportStatus, stop } = useConnectedData();
  const { state, addStroke } = useStore();
  const { project } = useProject();

  // The loop must survive every store change, so mutable reads go through refs.
  const stateRef = useRef(state);
  stateRef.current = state;
  const addStrokeRef = useRef(addStroke);
  addStrokeRef.current = addStroke;

  // Closing the document ends the session; otherwise it would keep polling
  // into a store that no longer belongs to it.
  useEffect(() => {
    if (!project && config) stop();
  }, [project, config, stop]);

  useEffect(() => {
    if (!config || !project) return;

    let cancelled = false;
    const startedAt = Date.now();
    const lastPoint = new Map<string, Point>();
    const lastSnapshot = new Map<string, string>();
    let polls = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const { body } = await fetchText(config.url);
        if (cancelled) return;
        const json = JSON.parse(body);

        const snapshot = stateRef.current;
        const page = snapshot.pages.find((p) => p.id === snapshot.activePageId);
        if (!page) return;
        const layerId = snapshot.activeLayerId;
        const area = plotArea(config.pageSize, config.marginMm);
        const toWorld = (p: Point): Point => ({ x: p.x + page.x, y: p.y + page.y });

        const elapsed = Date.now() - startedAt;
        const full = seriesWindowFull(elapsed, config.windowMinutes);

        for (const selection of config.selections) {
          if (selection.mode === 'series') {
            if (full) continue;
            const value = getNumber(json, selection.path);
            if (value === null) continue;
            const point: Point = {
              x: elapsedToX(elapsed, config.windowMinutes, area),
              y: valueToY(value, selection.yMin, selection.yMax, area),
            };
            const previous = lastPoint.get(selection.id);
            lastPoint.set(selection.id, point);
            // The first sample is only an anchor — a segment needs two ends.
            if (previous) {
              addStrokeRef.current(layerId, [toWorld(previous), toWorld(point)], selection.color);
            }
            continue;
          }

          const points = snapshotPoints(json, selection, area);
          if (points.length < 2) continue;
          const key = JSON.stringify(points);
          if (lastSnapshot.get(selection.id) === key) continue;
          lastSnapshot.set(selection.id, key);
          addStrokeRef.current(layerId, points.map(toWorld), selection.color);
        }

        polls += 1;
        reportStatus({ polls, lastPollAt: Date.now(), lastError: null, windowFull: full });
      } catch (e) {
        if (cancelled) return;
        reportStatus({
          polls,
          lastPollAt: Date.now(),
          lastError: (e as Error).message,
          windowFull: false,
        });
      }
    };

    poll();
    const timer = setInterval(poll, Math.max(1, config.intervalSeconds) * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [config, project, reportStatus]);
};
