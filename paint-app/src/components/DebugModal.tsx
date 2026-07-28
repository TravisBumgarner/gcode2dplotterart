import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useConnection } from '../connection';
import { usePlotters } from '../plotters';
import { useStore } from '../store';

type Props = {
  onClose: () => void;
};

type Pos = { x: number; y: number; z: number };

const JOG_STEPS = [0.1, 1, 10];

/**
 * Manual plotter test panel. Lets you fire individual G-code commands
 * (home, pen up/down, jog, query position) to verify the machine is wired
 * up and responding before committing to a full print.
 */
export const DebugModal = ({ onClose }: Props) => {
  const { connection } = useConnection();
  const { state } = useStore();
  const { activePlotter: plotter } = usePlotters();
  const activePage = state.pages.find((p) => p.id === state.activePageId) ?? state.pages[0];

  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string>('');
  const [step, setStep] = useState(10);
  const [raw, setRaw] = useState('');
  const [position, setPosition] = useState<Pos | null>(null);

  const refreshPosition = async () => {
    try {
      const p = await connection.getPosition();
      if (p) setPosition(p);
    } catch {}
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: connection is stable; fetch once on open
  useEffect(() => {
    refreshPosition();
  }, []);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setLast(`${label}…`);
    try {
      const out = await fn();
      const text = Array.isArray(out)
        ? out.join(' / ')
        : out == null
          ? ''
          : typeof out === 'object'
            ? JSON.stringify(out)
            : String(out);
      setLast(`${label}: ${text || 'ok'}`);
    } catch (e) {
      setLast(`${label} failed: ${(e as Error).message}`);
    } finally {
      await refreshPosition();
      setBusy(false);
    }
  };

  const send = (label: string, gcode: string) => run(label, () => connection.send(gcode));

  const jog = (axis: 'X' | 'Y', dir: 1 | -1) =>
    run(`Jog ${axis}${dir > 0 ? '+' : '-'}${step}`, async () => {
      await connection.send('G91');
      const out = await connection.send(`G0 ${axis}${dir * step}`);
      await connection.send('G90');
      return out;
    });

  const moveAbs = (label: string, axis: 'X' | 'Y', value: number) => {
    if (!plotter) {
      setLast(`${label} failed: no plotter selected`);
      return;
    }
    run(label, async () => {
      await connection.send('G90');
      return connection.send(`G0 ${axis}${value} F${plotter.travelFeed}`);
    });
  };

  const penUp = () =>
    plotter
      ? send('Pen up', `G0 Z${plotter.penUpZ} F${plotter.travelFeed}`)
      : setLast('Pen up failed: no plotter selected');
  const penDown = () =>
    plotter
      ? send('Pen down', `G1 Z${plotter.penDownZ} F${plotter.travelFeed}`)
      : setLast('Pen down failed: no plotter selected');

  const fmt = (n: number) => n.toFixed(2);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Plotter debug</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Plotter: <strong>{plotter?.name ?? '— none —'}</strong>
          {activePage && (
            <>
              {' · '}
              {activePage.width} × {activePage.height} mm
            </>
          )}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
            p: 1,
            borderRadius: 1,
            bgcolor: 'action.hover',
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 13,
          }}
        >
          <Box sx={{ flex: 1 }}>
            {position
              ? `X ${fmt(position.x)}   Y ${fmt(position.y)}   Z ${fmt(position.z)}`
              : 'position —'}
          </Box>
          <IconButton size="small" disabled={busy} onClick={refreshPosition} title="Refresh">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            disabled={busy}
            onClick={() => send('Disable steppers', 'M84')}
          >
            Disable steppers
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body2">Jog step</Typography>
          <Select
            size="small"
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            sx={{ minWidth: 90 }}
          >
            {JOG_STEPS.map((s) => (
              <MenuItem key={s} value={s}>
                {s} mm
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
              maxWidth: 220,
            }}
          >
            <Box />
            <Button size="small" variant="outlined" disabled={busy} onClick={() => jog('Y', 1)}>
              Y+
            </Button>
            <Box />
            <Button size="small" variant="outlined" disabled={busy} onClick={() => jog('X', -1)}>
              X−
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={busy}
              onClick={() => send('Home', 'G28')}
              title="Home (G28)"
              sx={{ minWidth: 0 }}
            >
              <HomeIcon fontSize="small" />
            </Button>
            <Button size="small" variant="outlined" disabled={busy} onClick={() => jog('X', 1)}>
              X+
            </Button>
            <Box />
            <Button size="small" variant="outlined" disabled={busy} onClick={() => jog('Y', -1)}>
              Y−
            </Button>
            <Box />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button size="small" variant="outlined" disabled={busy} onClick={penUp}>
              Pen up
            </Button>
            <Button size="small" variant="outlined" disabled={busy} onClick={penDown}>
              Pen down
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" sx={{ mb: 1 }}>
          Bed extremes
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            disabled={busy || !plotter}
            onClick={() => moveAbs('Min X', 'X', 0)}
          >
            Min X
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={busy || !plotter}
            onClick={() => moveAbs('Max X', 'X', plotter?.bedWidth ?? 0)}
          >
            Max X
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={busy || !plotter}
            onClick={() => moveAbs('Min Y', 'Y', 0)}
          >
            Min Y
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={busy || !plotter}
            onClick={() => moveAbs('Max Y', 'Y', plotter?.bedHeight ?? 0)}
          >
            Max Y
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Raw G-code, e.g. M115"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && raw.trim()) send('Send', raw.trim());
            }}
          />
          <Button
            size="small"
            variant="outlined"
            disabled={busy || !raw.trim()}
            onClick={() => send('Send', raw.trim())}
          >
            Send
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, fontFamily: 'ui-monospace, Menlo, monospace' }}
        >
          {last || 'No commands sent yet.'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
