import { useEffect, useRef } from 'react';
import { useConnection } from './connection';
import { buildStrokeLines, PROLOGUE } from './gcode';
import { usePlotters } from './plotters';
import { INTERACTIVE_PROJECT_ID, useProject } from './project';
import { useStore } from './store';

/**
 * In interactive mode, every freshly-drawn stroke is streamed to the plotter
 * as soon as the user releases the pointer. Strokes that already existed when
 * the session started (or that were drawn while disconnected) are NOT
 * replayed — only new strokes go down the wire.
 *
 * The first stroke after a fresh connection sends the prologue (G21/G90/G28).
 * Strokes are sent through a serialized promise queue so concurrent draws
 * don't interleave G-code on the bus.
 */
export const useInteractiveSync = () => {
  const { state } = useStore();
  const { project } = useProject();
  const { connection, connected } = useConnection();
  const { getPlotter } = usePlotters();

  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;
  const sentRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const sessionKeyRef = useRef<string | null>(null);

  // (Re-)prime the "already sent" set whenever we enter the mode or the
  // connection comes back. This is what stops the existing project history
  // from being plotted on load.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-prime on session-boundary changes
  useEffect(() => {
    if (!isInteractive || !connected) {
      sentRef.current = new Set();
      sessionKeyRef.current = null;
      return;
    }
    const ids = new Set<string>();
    for (const layer of state.layers) {
      for (const stroke of layer.strokes) ids.add(stroke.id);
    }
    sentRef.current = ids;
    sessionKeyRef.current = null;
  }, [isInteractive, connected, project?.id]);

  // Stream new strokes whenever the store changes.
  useEffect(() => {
    if (!isInteractive || !connected || !project) return;
    const plotter = getPlotter(state.plotterId);
    if (!plotter) return;
    const activePage = state.pages.find((p) => p.id === state.activePageId);
    if (!activePage) return;

    const expectedSession = `${project.id}:${plotter.id}`;
    const newPrograms: string[][] = [];

    for (const layer of state.layers) {
      if (!layer.visible) continue;
      for (const stroke of layer.strokes) {
        if (sentRef.current.has(stroke.id)) continue;
        sentRef.current.add(stroke.id);
        const lines = buildStrokeLines(stroke.points, activePage, plotter);
        if (lines.length > 0) newPrograms.push(lines);
      }
    }

    if (newPrograms.length === 0) return;

    queueRef.current = queueRef.current.then(async () => {
      try {
        if (sessionKeyRef.current !== expectedSession) {
          await connection.sendMany(PROLOGUE(plotter));
          sessionKeyRef.current = expectedSession;
        }
        for (const lines of newPrograms) {
          await connection.sendMany(lines);
        }
      } catch (e) {
        console.error('interactive stream failed', e);
      }
    });
  }, [state, isInteractive, connected, project, connection, getPlotter]);
};
