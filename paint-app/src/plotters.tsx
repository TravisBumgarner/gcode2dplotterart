import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { db } from './db';
import type { Plotter } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

export type PlotterDraft = Omit<Plotter, 'id' | 'createdAt'>;

type PlottersCtx = {
  plotters: Plotter[];
  ready: boolean;
  createPlotter: (draft: PlotterDraft) => Promise<Plotter>;
  /**
   * Overwrite an existing plotter's parameters in place (id and createdAt
   * are preserved). Every project referencing this plotter by id will use
   * the new values next time it builds G-code.
   */
  updatePlotter: (id: string, draft: PlotterDraft) => Promise<Plotter>;
  /**
   * Insert a plotter snapshot (e.g. from imported JSON), preserving its
   * id if there is no collision. Returns the canonical plotter that should
   * be referenced going forward.
   */
  ingestPlotter: (snapshot: Plotter) => Promise<Plotter>;
  deletePlotter: (id: string) => Promise<void>;
  getPlotter: (id: string) => Plotter | undefined;
};

const PlottersContext = createContext<PlottersCtx | null>(null);

export const PlottersProvider = ({ children }: { children: ReactNode }) => {
  const [plotters, setPlotters] = useState<Plotter[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await db.plotters.orderBy('createdAt').toArray();
      if (!cancelled) {
        setPlotters(all);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const createPlotter = useCallback(async (draft: PlotterDraft) => {
    const plotter: Plotter = { id: uid(), ...draft, createdAt: Date.now() };
    await db.plotters.put(plotter);
    setPlotters((prev) => [...prev, plotter].sort((a, b) => a.createdAt - b.createdAt));
    return plotter;
  }, []);

  const ingestPlotter = useCallback(async (snapshot: Plotter) => {
    const existing = await db.plotters.get(snapshot.id);
    if (existing) return existing;
    await db.plotters.put(snapshot);
    setPlotters((prev) => [...prev, snapshot].sort((a, b) => a.createdAt - b.createdAt));
    return snapshot;
  }, []);

  const updatePlotter = useCallback(async (id: string, draft: PlotterDraft) => {
    const existing = await db.plotters.get(id);
    if (!existing) throw new Error('Plotter not found');
    const updated: Plotter = { ...existing, ...draft, id, createdAt: existing.createdAt };
    await db.plotters.put(updated);
    setPlotters((prev) =>
      prev.map((p) => (p.id === id ? updated : p)).sort((a, b) => a.createdAt - b.createdAt),
    );
    return updated;
  }, []);

  const deletePlotter = useCallback(async (id: string) => {
    await db.plotters.delete(id);
    setPlotters((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPlotter = useCallback((id: string) => plotters.find((p) => p.id === id), [plotters]);

  const value = useMemo<PlottersCtx>(
    () => ({
      plotters,
      ready,
      createPlotter,
      updatePlotter,
      ingestPlotter,
      deletePlotter,
      getPlotter,
    }),
    [plotters, ready, createPlotter, updatePlotter, ingestPlotter, deletePlotter, getPlotter],
  );

  return <PlottersContext.Provider value={value}>{children}</PlottersContext.Provider>;
};

export const usePlotters = () => {
  const ctx = useContext(PlottersContext);
  if (!ctx) throw new Error('usePlotters must be used within PlottersProvider');
  return ctx;
};

/**
 * Resolve the active project's plotter. Returns null if no plotter has been
 * selected yet, or if the referenced plotter no longer exists.
 */
export const useActivePlotter = (plotterId: string): Plotter | null => {
  const { getPlotter } = usePlotters();
  return getPlotter(plotterId) ?? null;
};
