import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useConnection } from '../connection';
import { buildLayerPrograms, EPILOGUE, PROLOGUE } from '../gcode';
import { usePlotters } from '../plotters';
import { useProject } from '../project';
import { useStore } from '../store';

type Props = {
  onClose: () => void;
};

const Swatch = ({ color }: { color: string }) => (
  <Box
    sx={{
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: color,
      border: '1px solid #ccc',
      flexShrink: 0,
    }}
  />
);

/** The pen swap can happen while you are in another room. Make a noise. */
const playChime = () => {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
};

/**
 * Starting a print used to mean this component sat in a loop feeding lines to
 * the serial port and parking on a `Promise` at each pen swap — close the tab
 * and the page was orphaned half-drawn. Now the whole job is uploaded once, the
 * server runs it next to the cable, and this is a view of that job's state. Any
 * device in the session sees the same thing, including the swap prompt.
 */
export const PrintModal = ({ onClose }: Props) => {
  const { state } = useStore();
  const { getPlotter } = usePlotters();
  const { project } = useProject();
  const { client, job, isController, controllerName, connected, paused } = useConnection();
  const { pages, layers, activePageId, plotterId } = state;
  const activePage = pages.find((p) => p.id === activePageId);
  const plotter = getPlotter(plotterId) ?? null;
  const programs = activePage && plotter ? buildLayerPrograms(layers, activePage, plotter) : [];

  const [jobId, setJobId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The job we started, as opposed to one another client left lying around.
  const ours = jobId && job?.job.id === jobId ? job : null;
  const otherJobRunning =
    !ours && job !== null && (job.state === 'running' || job.state === 'awaiting_pen_swap');

  const lastState = useRef<string | null>(null);
  useEffect(() => {
    if (ours?.state === 'awaiting_pen_swap' && lastState.current !== 'awaiting_pen_swap') {
      playChime();
    }
    lastState.current = ours?.state ?? null;
  }, [ours?.state]);

  const guard = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    guard(async () => {
      if (!plotter) throw new Error('No plotter selected for this project.');
      if (!activePage || programs.length === 0) {
        throw new Error('Nothing to print on the active page.');
      }
      const summary = await client.uploadJob({
        name: project?.name ?? 'Untitled page',
        plotterName: plotter.name,
        prologue: PROLOGUE(plotter),
        layers: programs.map((p) => ({ name: p.layerName, color: p.color, lines: p.lines })),
        epilogue: EPILOGUE(plotter),
      });
      setJobId(summary.id);
      await client.startJob(summary.id);
    });

  const progress = ours?.progress ?? null;
  const percent =
    progress && progress.totalLines > 0
      ? Math.round((progress.sentLines / progress.totalLines) * 100)
      : 0;

  const idle = !ours;
  const finished =
    ours?.state === 'done' || ours?.state === 'failed' || ours?.state === 'cancelled';
  const active = ours?.state === 'running' || ours?.state === 'paused';
  const swapping = ours?.state === 'awaiting_pen_swap';

  return (
    <Dialog open onClose={idle || finished ? onClose : undefined} fullWidth maxWidth="xs">
      <DialogTitle>Print</DialogTitle>
      <DialogContent dividers>
        {!isController && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {controllerName ? `${controllerName} has control.` : 'Another client has control.'} You
            can watch this print but not start or change one.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {idle && (
          <>
            {otherJobRunning && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                The plotter is already running “{job?.job.name}”. Starting another will be refused
                until it finishes or is cancelled.
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 1 }}>
              Plotter: <strong>{plotter?.name ?? '— none —'}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              About to print <strong>{programs.length}</strong> visible layer
              {programs.length === 1 ? '' : 's'} on the active page. The whole job is uploaded to
              the plotter server, which runs it — you can close this tab once it starts.
            </Typography>
            {programs.map((p) => (
              <Box key={p.layerId} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Swatch color={p.color} />
                <Typography variant="body2">{p.layerName}</Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {p.lines.length} lines
                </Typography>
              </Box>
            ))}
          </>
        )}

        {ours && !finished && progress && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Swatch color={progress.color} />
              <Typography>
                {swapping ? 'Waiting at' : 'Printing'} <strong>{progress.layerName}</strong>
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">
                layer {progress.layerIndex + 1}/{progress.layerCount}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={percent} sx={{ mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {progress.sentLines} / {progress.totalLines} lines ({percent}%)
              {paused && ours.state === 'paused' && ' · paused'}
            </Typography>
          </>
        )}

        {swapping && ours?.nextLayer && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Swap pen</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography>
                Insert pen for <strong>{ours.nextLayer.name}</strong>
              </Typography>
              <Swatch color={ours.nextLayer.color} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              The plotter is holding position with the pen up. It will wait as long as it takes.
            </Typography>
          </Box>
        )}

        {ours?.state === 'done' && <Typography>Done.</Typography>}
        {ours?.state === 'cancelled' && <Typography>Cancelled.</Typography>}
        {ours?.state === 'failed' && (
          <Typography color="error">Failed: {ours.error ?? 'unknown error'}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        {idle && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={start}
              disabled={programs.length === 0 || !plotter || !connected || !isController || busy}
            >
              Start
            </Button>
          </>
        )}
        {(active || swapping) && (
          <>
            <Button
              color="error"
              disabled={!isController || busy}
              onClick={() => guard(() => client.cancelJob())}
            >
              Abort
            </Button>
            {swapping && (
              <Button
                variant="contained"
                disabled={!isController || busy}
                onClick={() => guard(() => client.continueJob())}
              >
                Continue
              </Button>
            )}
          </>
        )}
        {finished && <Button onClick={onClose}>Close</Button>}
      </DialogActions>
    </Dialog>
  );
};
