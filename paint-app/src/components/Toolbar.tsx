import BoltIcon from '@mui/icons-material/Bolt';
import BugReportIcon from '@mui/icons-material/BugReport';
import DangerousIcon from '@mui/icons-material/Dangerous';
import GitHubIcon from '@mui/icons-material/GitHub';
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
  } = useConnection();

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
          <Tooltip title="Manually test plotter movement and pen">
            <Button
              size="small"
              startIcon={<BugReportIcon />}
              variant="outlined"
              onClick={() => setDebugOpen(true)}
            >
              Debug
            </Button>
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
        <Tooltip title="Emergency stop — halts the plotter immediately (M112). Reconnect required afterward.">
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
