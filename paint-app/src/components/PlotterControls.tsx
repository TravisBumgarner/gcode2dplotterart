import DangerousIcon from '@mui/icons-material/Dangerous';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PrintIcon from '@mui/icons-material/Print';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { useConnection } from '../connection';
import { usePlotters } from '../plotters';
import { PlottersModal } from './PlottersModal';

/**
 * Which plotter output goes to, and the live state of the link to it. Global
 * rather than per-document — the same session can draw one thing and send it
 * to whichever machine is plugged in, so these controls live in the top bar
 * and stay mounted whether or not a document is open.
 */
export const PlotterControls = () => {
  const { plotters, activePlotter, setActivePlotter } = usePlotters();
  const {
    connected,
    connecting,
    connectPhase,
    connect,
    disconnect,
    connectError,
    dismissConnectError,
    paused,
    pause,
    resume,
    emergencyStop,
    emergencyStopped,
    acknowledgeEmergencyStop,
  } = useConnection();

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [plottersOpen, setPlottersOpen] = useState(false);

  const connectLabel =
    connectPhase === 'homing'
      ? 'Homing…'
      : connectPhase === 'connecting'
        ? 'Connecting…'
        : 'Connect';

  return (
    <>
      <Tooltip
        title={
          activePlotter
            ? `Sending to ${activePlotter.name} — bed ${activePlotter.bedWidth}×${activePlotter.bedHeight}mm`
            : 'No plotter configured'
        }
      >
        <Button
          size="small"
          variant={activePlotter ? 'text' : 'contained'}
          color={activePlotter ? 'inherit' : 'primary'}
          startIcon={<PrintIcon />}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          {activePlotter?.name ?? 'Add plotter'}
        </Button>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {plotters.map((p) => (
          <MenuItem
            key={p.id}
            selected={p.id === activePlotter?.id}
            onClick={() => {
              setActivePlotter(p.id);
              setAnchor(null);
            }}
          >
            <ListItemText primary={p.name} secondary={`${p.bedWidth}×${p.bedHeight}mm`} />
          </MenuItem>
        ))}
        {plotters.length > 0 && <Divider />}
        <MenuItem
          onClick={() => {
            setPlottersOpen(true);
            setAnchor(null);
          }}
        >
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={plotters.length === 0 ? 'Configure a plotter…' : 'Manage…'} />
        </MenuItem>
      </Menu>

      {connected ? (
        <Button size="small" color="error" onClick={disconnect}>
          Disconnect
        </Button>
      ) : (
        <Button
          size="small"
          variant="contained"
          onClick={connect}
          disabled={connecting}
          startIcon={connecting ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {connectLabel}
        </Button>
      )}

      {connected && (
        <Tooltip
          title={
            paused
              ? 'Resume — continue sending G-code'
              : 'Pause — stop sending after the current move; the plotter holds position'
          }
        >
          <Button
            size="small"
            color={paused ? 'success' : 'warning'}
            variant="contained"
            startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
            onClick={paused ? resume : pause}
          >
            {paused ? 'Resume' : 'Pause'}
          </Button>
        </Tooltip>
      )}

      {connected && (
        <>
          {/* Kept at the far end of the bar, away from Disconnect — a
              misclick here costs a power cycle. */}
          <Box sx={{ width: 8 }} />
          <Tooltip title="Emergency stop — halts the plotter immediately (M112). Requires a power cycle afterward.">
            <Button
              size="small"
              color="error"
              variant="contained"
              startIcon={<DangerousIcon />}
              onClick={emergencyStop}
              sx={{ fontWeight: 700 }}
            >
              STOP
            </Button>
          </Tooltip>
        </>
      )}

      <PlottersModal open={plottersOpen} onClose={() => setPlottersOpen(false)} />

      <Dialog open={connectError !== null} onClose={dismissConnectError}>
        <DialogTitle sx={{ color: 'error.main' }}>Connection failed</DialogTitle>
        <DialogContent>
          <DialogContentText>{connectError}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={dismissConnectError}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={emergencyStopped} onClose={acknowledgeEmergencyStop}>
        <DialogTitle sx={{ color: 'error.main' }}>Emergency stop triggered</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The plotter received an emergency stop (M112) and its firmware is now halted. It will
            not respond to any commands until you <strong>power cycle the 3D printer</strong> (turn
            it off, wait a few seconds, then turn it back on).
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            After power cycling, reconnect from the top bar. Your work stays open.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={acknowledgeEmergencyStop}>Understood</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
