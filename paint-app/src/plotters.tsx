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

const ACTIVE_PLOTTER_LS_KEY = 'paint-app:activePlotterId';

export type PlotterDraft = Omit<Plotter, 'id' | 'createdAt'>;

type PlottersCtx = {
  plotters: Plotter[];
  ready: boolean;
  /**
   * The plotter output currently goes to — global and session-scoped, like the
   * selected printer in a word processor. Documents never reference it, so
   * switching targets mid-session is free. Null until one is configured.
   */
  activePlotter: Plotter | null;
  setActivePlotter: (id: string | null) => void;
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
  const [activePlotterId, setActivePlotterIdState] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_PLOTTER_LS_KEY),
  );

  const setActivePlotter = useCallback((id: string | null) => {
    setActivePlotterIdState(id);
    if (id) localStorage.setItem(ACTIVE_PLOTTER_LS_KEY, id);
    else localStorage.removeItem(ACTIVE_PLOTTER_LS_KEY);
  }, []);

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

  // Keep the selection pointing at something real: fall back to the most
  // recent plotter when none is chosen or the stored id has been deleted, so
  // single-plotter users never have to touch the picker.
  useEffect(() => {
    if (!ready || plotters.length === 0) return;
    if (activePlotterId && plotters.some((p) => p.id === activePlotterId)) return;
    setActivePlotter(plotters[plotters.length - 1].id);
  }, [ready, plotters, activePlotterId, setActivePlotter]);

  const createPlotter = useCallback(
    async (draft: PlotterDraft) => {
      const plotter: Plotter = { id: uid(), ...draft, createdAt: Date.now() };
      await db.plotters.put(plotter);
      setPlotters((prev) => [...prev, plotter].sort((a, b) => a.createdAt - b.createdAt));
      // A freshly configured plotter is almost always the one you meant to use.
      setActivePlotter(plotter.id);
      return plotter;
    },
    [setActivePlotter],
  );

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

  const activePlotter = useMemo(
    () => (activePlotterId ? (plotters.find((p) => p.id === activePlotterId) ?? null) : null),
    [plotters, activePlotterId],
  );

  const value = useMemo<PlottersCtx>(
    () => ({
      plotters,
      ready,
      activePlotter,
      setActivePlotter,
      createPlotter,
      updatePlotter,
      ingestPlotter,
      deletePlotter,
      getPlotter,
    }),
    [
      plotters,
      ready,
      activePlotter,
      setActivePlotter,
      createPlotter,
      updatePlotter,
      ingestPlotter,
      deletePlotter,
      getPlotter,
    ],
  );

  return <PlottersContext.Provider value={value}>{children}</PlottersContext.Provider>;
};

export const usePlotters = () => {
  const ctx = useContext(PlottersContext);
  if (!ctx) throw new Error('usePlotters must be used within PlottersProvider');
  return ctx;
};
