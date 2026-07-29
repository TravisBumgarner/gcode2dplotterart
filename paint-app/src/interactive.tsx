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
 *
 * Geometry outside the target plotter's bed is clipped away silently — there's
 * no point prompting per stroke the way the print flow does, and driving the
 * machine past its limits is worse than dropping the overflow.
 *
 * Each stroke crosses the network as one batch, not a line at a time; the
 * server's send loop still waits for Marlin's `ok` per line, over USB.
 */
export const useInteractiveSync = () => {
  const { state } = useStore();
  const { project } = useProject();
  const { client, connected, isController } = useConnection();
  const { activePlotter } = usePlotters();

  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;
  const sentRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const sessionKeyRef = useRef<string | null>(null);

  // (Re-)prime the "already sent" set whenever we enter the mode, the
  // connection comes back, or the target plotter changes. This is what stops
  // the existing document from being replotted from the top.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-prime on session-boundary changes
  useEffect(() => {
    if (!isInteractive || !connected || !isController) {
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
  }, [isInteractive, connected, isController, project?.id, activePlotter?.id]);

  // Stream new strokes whenever the store changes. Read-only observers watch
  // the canvas without their strokes reaching the machine.
  useEffect(() => {
    if (!isInteractive || !connected || !isController || !project) return;
    const plotter = activePlotter;
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
        const lines = buildStrokeLines(stroke.points, activePage, plotter, true);
        if (lines.length > 0) newPrograms.push(lines);
      }
    }

    if (newPrograms.length === 0) return;

    queueRef.current = queueRef.current.then(async () => {
      try {
        if (sessionKeyRef.current !== expectedSession) {
          await client.sendMany(PROLOGUE(plotter));
          sessionKeyRef.current = expectedSession;
        }
        for (const lines of newPrograms) {
          await client.sendMany(lines);
        }
      } catch (e) {
        // A refused stroke (control lost, job started) must not leave the
        // session key set, or the prologue is skipped on the next attempt.
        sessionKeyRef.current = null;
        console.error('interactive stream failed', e);
      }
    });
  }, [state, isInteractive, connected, isController, project, client, activePlotter]);
};
