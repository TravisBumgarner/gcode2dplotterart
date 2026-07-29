import PrintIcon from '@mui/icons-material/Print';
import UsbIcon from '@mui/icons-material/Usb';
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
  Popover,
  Tooltip,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useConnection } from '../connection';
import { usePlotters } from '../plotters';
import { PlottersModal } from './PlottersModal';
import { SerialPortRow } from './SerialPortRow';

/**
 * Which plotter output goes to, and the live state of the link to it. Global
 * rather than per-document — the same session can draw one thing and send it
 * to whichever machine is plugged in, so these controls live in the top bar
 * and stay mounted whether or not a document is open.
 *
 * That includes picking the serial port. It used to be a step on the setup
 * screen, back when a document owned its plotter and you passed through the
 * gate on the way in; now that the plotter is a print target rather than a
 * document property there is no such moment, so the port lives here, one click
 * from anywhere, next to the machine it belongs to.
 */
export const PlotterControls = () => {
  const { plotters, activePlotter, setActivePlotter } = usePlotters();
  const {
    serverReachable,
    connected,
    connecting,
    connectPhase,
    portPath,
    connectError,
    dismissConnectError,
    emergencyStopped,
    acknowledgeEmergencyStop,
  } = useConnection();

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [portAnchor, setPortAnchor] = useState<HTMLElement | null>(null);
  const [plottersOpen, setPlottersOpen] = useState(false);

  // The picker has done its job the moment the link comes up; leaving it open
  // over the canvas is just something else to dismiss.
  useEffect(() => {
    if (connected) setPortAnchor(null);
  }, [connected]);

  const connectLabel = !serverReachable
    ? 'Server offline'
    : connected
      ? (portPath ?? 'Connected')
      : connectPhase === 'homing'
        ? 'Homing…'
        : connecting
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

      <Tooltip
        title={
          connected
            ? `The server is holding ${portPath}. Open to disconnect or switch ports.`
            : 'Pick which of the server’s serial ports the plotter is on, and connect.'
        }
      >
        <Button
          size="small"
          variant={connected ? 'text' : 'contained'}
          color={connected ? 'success' : serverReachable ? 'primary' : 'error'}
          startIcon={connecting ? <CircularProgress size={14} color="inherit" /> : <UsbIcon />}
          onClick={(e) => setPortAnchor(e.currentTarget)}
        >
          {connectLabel}
        </Button>
      </Tooltip>
      <Popover
        open={Boolean(portAnchor)}
        anchorEl={portAnchor}
        onClose={() => setPortAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 400, maxWidth: '90vw' }}>
          <SerialPortRow />
        </Box>
      </Popover>

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
