import BoltIcon from '@mui/icons-material/Bolt';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DangerousIcon from '@mui/icons-material/Dangerous';
import GitHubIcon from '@mui/icons-material/GitHub';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PrintIcon from '@mui/icons-material/Print';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Toolbar as MuiToolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useConnection } from '../connection';
import { INTERACTIVE_PROJECT_ID, useProject } from '../project';
import { DebugModal } from './DebugModal';
import { SettingsMenu } from './SettingsMenu';

type Props = {
  onPrint: () => void;
};

/**
 * Who is driving. On one laptop with a USB cable this question did not exist;
 * on a network it does, and the answer has to be visible before someone
 * wonders why their Pause button does nothing.
 */
const ControlChip = ({
  serverReachable,
  isController,
  controllerName,
  observers,
  onTakeControl,
}: {
  serverReachable: boolean;
  isController: boolean;
  controllerName: string | null;
  observers: number;
  onTakeControl: () => void;
}) => {
  if (!serverReachable) {
    return (
      <Tooltip title="The page can't reach the plotter server. Reconnecting…">
        <Chip icon={<CloudOffIcon />} label="Server offline" color="error" size="small" />
      </Tooltip>
    );
  }
  if (isController) {
    return (
      <Tooltip
        title={
          observers > 0
            ? `You have control. ${observers} other ${observers === 1 ? 'device is' : 'devices are'} watching and can take it.`
            : 'You have control of the plotter.'
        }
      >
        <Chip
          icon={<LockOpenIcon />}
          label={observers > 0 ? `In control · ${observers} watching` : 'In control'}
          color="success"
          variant="outlined"
          size="small"
        />
      </Tooltip>
    );
  }
  return (
    <Tooltip
      title={`${controllerName ?? 'Another device'} controls the plotter. You can watch and emergency-stop, but not move it.`}
    >
      <Chip
        icon={<LockIcon />}
        label={`${controllerName ?? 'Someone else'} has control`}
        color="warning"
        size="small"
        onClick={onTakeControl}
      />
    </Tooltip>
  );
};

export const Toolbar = ({ onPrint }: Props) => {
  const { project, isDirty, isSaving, autosave, closeProject } = useProject();
  const {
    connected,
    paused,
    pause,
    resume,
    emergencyStop,
    emergencyStopped,
    acknowledgeEmergencyStop,
    isController,
    controllerName,
    takeControl,
    session,
    serverReachable,
  } = useConnection();
  const [takeoverOpen, setTakeoverOpen] = useState(false);
  const observers = (session?.clients.length ?? 1) - 1;

  const acknowledgeStop = () => {
    acknowledgeEmergencyStop();
    closeProject();
  };
  const [debugOpen, setDebugOpen] = useState(false);
  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;

  const status = isSaving ? 'saving…' : isDirty ? (autosave ? 'saving soon' : 'unsaved') : 'saved';

  return (
    <AppBar position="static" color="default" elevation={1}>
      <MuiToolbar variant="dense" sx={{ gap: 1 }}>
        <SettingsMenu />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, ml: 1 }}>
          {project?.name ?? 'paint-app'}
        </Typography>
        {project && !isInteractive && (
          <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isSaving && <CircularProgress size={12} />}
            <Typography variant="caption" color="text.secondary">
              {status}
            </Typography>
          </Box>
        )}
        <Box sx={{ flex: 1 }} />
        <ControlChip
          serverReachable={serverReachable}
          isController={isController}
          controllerName={controllerName}
          observers={observers}
          onTakeControl={() => setTakeoverOpen(true)}
        />
        {connected && (
          <Tooltip
            title={
              paused
                ? 'Resume — continue sending G-code'
                : 'Pause — stop sending after the current move; the plotter holds position'
            }
          >
            <span>
              <Button
                size="small"
                color={paused ? 'success' : 'warning'}
                variant="contained"
                startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
                onClick={paused ? resume : pause}
                disabled={!isController}
              >
                {paused ? 'Resume' : 'Pause'}
              </Button>
            </span>
          </Tooltip>
        )}
        {!isInteractive && (
          <Button
            size="small"
            startIcon={<PrintIcon />}
            variant="contained"
            onClick={onPrint}
            disabled={!connected}
          >
            Print
          </Button>
        )}
        {connected && (
          <Tooltip
            title={
              isController
                ? 'Manually test plotter movement and pen'
                : 'Another client has control — take it first'
            }
          >
            <span>
              <Button
                size="small"
                startIcon={<BugReportIcon />}
                variant="outlined"
                onClick={() => setDebugOpen(true)}
                disabled={!isController}
              >
                Debug
              </Button>
            </span>
          </Tooltip>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isInteractive && (
            <Tooltip
              title={
                connected
                  ? 'Each new stroke is sent to the plotter immediately.'
                  : 'Connect the plotter — strokes drawn while disconnected are not replayed.'
              }
            >
              <Chip
                icon={<BoltIcon />}
                label={connected ? 'Connected' : 'Disconnected'}
                color={connected ? 'success' : 'error'}
                size="small"
              />
            </Tooltip>
          )}
        </Box>
        <Tooltip title="View on GitHub">
          <IconButton
            size="small"
            component="a"
            href="https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/paint-app"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </MuiToolbar>
      {connected && (
        // Not gated on holding control, on purpose: any device in the session
        // can stop the machine. It also does not go through the command
        // socket — see PlotterClient.emergencyStop.
        <Tooltip title="Emergency stop — sends M112 immediately, from any device, whether or not you hold control. The board needs a power cycle afterwards.">
          <Button
            color="error"
            variant="contained"
            startIcon={<DangerousIcon />}
            onClick={emergencyStop}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 2000,
              fontWeight: 700,
              boxShadow: 6,
            }}
          >
            EMERGENCY STOP
          </Button>
        </Tooltip>
      )}
      <Dialog open={takeoverOpen} onClose={() => setTakeoverOpen(false)}>
        <DialogTitle>Take control?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {controllerName ? <strong>{controllerName}</strong> : 'Another client'} currently
            controls this plotter. Taking control is not refused mid-print — if a job is running,
            the job keeps running, but whoever had control will be locked out of pausing, continuing
            at a pen swap, or aborting it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTakeoverOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              takeControl();
              setTakeoverOpen(false);
            }}
          >
            Take control
          </Button>
        </DialogActions>
      </Dialog>
      {debugOpen && <DebugModal onClose={() => setDebugOpen(false)} />}
      <Dialog open={emergencyStopped} onClose={acknowledgeStop}>
        <DialogTitle sx={{ color: 'error.main' }}>Emergency stop triggered</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The plotter received an emergency stop (M112) and its firmware is now halted. It will
            not respond to any commands until you <strong>power cycle the 3D printer</strong> (turn
            it off, wait a few seconds, then turn it back on).
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            After power cycling, reconnect from the setup screen.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={acknowledgeStop}>Understood</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};
