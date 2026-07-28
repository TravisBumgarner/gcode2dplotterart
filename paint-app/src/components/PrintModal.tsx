import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useConnection } from '../connection';
import { buildLayerPrograms, EPILOGUE, PROLOGUE, pageFitsBed } from '../gcode';
import { usePlotters } from '../plotters';
import { useStore } from '../store';

type Props = {
  onClose: () => void;
};

type Phase =
  | { kind: 'idle' }
  | { kind: 'running'; layerIdx: number; layerName: string; color: string }
  | { kind: 'paused'; nextLayerIdx: number; nextLayerName: string; nextColor: string }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

export const PrintModal = ({ onClose }: Props) => {
  const { state } = useStore();
  const { activePlotter: plotter } = usePlotters();
  const { connection } = useConnection();
  const { pages, layers, activePageId } = state;
  const activePage = pages.find((p) => p.id === activePageId);

  // A document is sized independently of any machine, so the page can be
  // bigger than the plotter it's being sent to. Printing is blocked until the
  // user decides what should happen to the overflow.
  const [clipToBed, setClipToBed] = useState(false);
  const overflows = Boolean(activePage && plotter && !pageFitsBed(activePage, plotter));
  const blockedByOverflow = overflows && !clipToBed;

  const programs =
    activePage && plotter ? buildLayerPrograms(layers, activePage, plotter, clipToBed) : [];

  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const cancelled = useRef(false);
  const resumeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cancelled.current = true;
      resumeRef.current?.();
    };
  }, []);

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

  const start = async () => {
    if (!plotter) {
      setPhase({ kind: 'error', message: 'No plotter selected. Choose one from the top bar.' });
      return;
    }
    if (blockedByOverflow) return;
    if (!activePage || programs.length === 0) {
      setPhase({ kind: 'error', message: 'Nothing to print on the active page.' });
      return;
    }
    cancelled.current = false;
    try {
      await connection.sendMany(PROLOGUE(plotter));
      for (let i = 0; i < programs.length; i++) {
        if (cancelled.current) return;
        const program = programs[i];
        setPhase({
          kind: 'running',
          layerIdx: i,
          layerName: program.layerName,
          color: program.color,
        });
        await connection.sendMany(program.lines);
        if (cancelled.current) return;
        if (i < programs.length - 1) {
          const next = programs[i + 1];
          playChime();
          setPhase({
            kind: 'paused',
            nextLayerIdx: i + 1,
            nextLayerName: next.layerName,
            nextColor: next.color,
          });
          await new Promise<void>((resolve) => {
            resumeRef.current = resolve;
          });
          resumeRef.current = null;
          if (cancelled.current) return;
        }
      }
      await connection.sendMany(EPILOGUE(plotter));
      setPhase({ kind: 'done' });
    } catch (e) {
      setPhase({ kind: 'error', message: (e as Error).message });
    }
  };

  return (
    <Dialog open onClose={phase.kind === 'idle' ? onClose : undefined} fullWidth maxWidth="xs">
      <DialogTitle>Print</DialogTitle>
      <DialogContent dividers>
        {phase.kind === 'idle' && (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Plotter: <strong>{plotter?.name ?? '— none —'}</strong>
            </Typography>
            {overflows && activePage && plotter && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Page is larger than the bed</AlertTitle>
                This page is {activePage.width}×{activePage.height}mm but {plotter.name} can only
                reach {plotter.bedWidth}×{plotter.bedHeight}mm
                {activePage.width > plotter.bedWidth && activePage.height > plotter.bedHeight
                  ? ' — it overflows in both directions.'
                  : activePage.width > plotter.bedWidth
                    ? ' — it overflows horizontally.'
                    : ' — it overflows vertically.'}
                <FormControlLabel
                  sx={{ mt: 1, display: 'block' }}
                  control={
                    <Checkbox
                      size="small"
                      checked={clipToBed}
                      onChange={(e) => setClipToBed(e.target.checked)}
                    />
                  }
                  label="Clip to the bed and print what fits"
                />
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 2 }}>
              About to print <strong>{programs.length}</strong> visible layer
              {programs.length === 1 ? '' : 's'} on the active page
              {clipToBed && overflows ? ', clipped to the bed' : ''}.
            </Typography>
            {programs.map((p) => (
              <Box key={p.layerId} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: p.color,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <Typography variant="body2">{p.layerName}</Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {p.lines.length} lines
                </Typography>
              </Box>
            ))}
          </>
        )}
        {phase.kind === 'running' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography>
              Printing <strong>{phase.layerName}</strong>
            </Typography>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: phase.color,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          </Box>
        )}
        {phase.kind === 'paused' && (
          <>
            <Typography variant="h6">Swap pen</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography>
                Insert pen for <strong>{phase.nextLayerName}</strong>
              </Typography>
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: phase.nextColor,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            </Box>
          </>
        )}
        {phase.kind === 'done' && <Typography>Done.</Typography>}
        {phase.kind === 'error' && <Typography color="error">Error: {phase.message}</Typography>}
      </DialogContent>
      <DialogActions>
        {phase.kind === 'idle' && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={start}
              disabled={programs.length === 0 || !plotter || blockedByOverflow}
            >
              Start
            </Button>
          </>
        )}
        {phase.kind === 'paused' && (
          <>
            <Button
              color="error"
              onClick={() => {
                cancelled.current = true;
                resumeRef.current?.();
                onClose();
              }}
            >
              Abort
            </Button>
            <Button variant="contained" onClick={() => resumeRef.current?.()}>
              Resume
            </Button>
          </>
        )}
        {(phase.kind === 'done' || phase.kind === 'error') && (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
