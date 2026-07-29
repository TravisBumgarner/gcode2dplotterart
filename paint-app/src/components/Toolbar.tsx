import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BoltIcon from '@mui/icons-material/Bolt';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
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
  Divider,
  IconButton,
  Toolbar as MuiToolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useConnectedData } from '../connectedDataSession';
import { useConnection } from '../connection';
import { usePlotters } from '../plotters';
import { INTERACTIVE_PROJECT_ID, useProject } from '../project';
import { DebugModal } from './DebugModal';
import { PlotterControls } from './PlotterControls';
import { SettingsMenu } from './SettingsMenu';

type Props = {
  onPrint: () => void;
  /** Set when a full-page util owns the view; it takes over the bar's title. */
  utilTitle: string | null;
  onExitUtil: () => void;
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

/**
 * The application's single top bar. Mounted above the document/home swap so
 * plotter selection and the connection live at app scope: you can connect,
 * switch machines, or emergency-stop from anywhere, including the home screen.
 */
export const Toolbar = ({ onPrint, utilTitle, onExitUtil }: Props) => {
  const { project, isDirty, isSaving, autosave } = useProject();
  const {
    connected,
    paused,
    pause,
    resume,
    emergencyStop,
    isController,
    controllerName,
    takeControl,
    session,
    serverReachable,
  } = useConnection();
  const { activePlotter } = usePlotters();
  const connectedData = useConnectedData();
  const [takeoverOpen, setTakeoverOpen] = useState(false);
  const observers = (session?.clients.length ?? 1) - 1;

  const [debugOpen, setDebugOpen] = useState(false);

  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;
  const status = isSaving ? 'saving…' : isDirty ? (autosave ? 'saving soon' : 'unsaved') : 'saved';

  return (
    <AppBar position="static" color="default" elevation={1}>
      <MuiToolbar variant="dense" sx={{ gap: 1 }}>
        {utilTitle ? (
          <>
            <Button size="small" startIcon={<ArrowBackIcon />} onClick={onExitUtil}>
              Back
            </Button>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {utilTitle}
            </Typography>
          </>
        ) : (
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {project?.name ?? 'paint-app'}
          </Typography>
        )}
        {!utilTitle && project && !isInteractive && (
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
        {isInteractive && (
          <Tooltip
            title={
              !activePlotter
                ? 'Choose a plotter to send strokes to.'
                : connected
                  ? 'Each new stroke is sent to the plotter immediately.'
                  : 'Connect the plotter — strokes drawn while disconnected are not replayed.'
            }
          >
            <Chip
              icon={<BoltIcon />}
              label={!activePlotter ? 'No plotter' : connected ? 'Live' : 'Disconnected'}
              color={!activePlotter ? 'default' : connected ? 'success' : 'error'}
              size="small"
              sx={{ ml: 1 }}
            />
          </Tooltip>
        )}
        {connected && (
          <Tooltip
            title={
              paused
                ? 'Resume the job.'
                : 'Pause after the current line — the machine holds position.'
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
        {connectedData.config && (
          <Tooltip
            title={
              connectedData.status.lastError
                ? `Last fetch failed: ${connectedData.status.lastError}`
                : connectedData.status.windowFull
                  ? 'The time window is full — live series have stopped extending.'
                  : `Polling ${connectedData.config.url} every ${connectedData.config.intervalSeconds}s`
            }
          >
            <Chip
              icon={<CloudDownloadIcon />}
              label={
                connectedData.status.lastError
                  ? 'Fetch failed'
                  : connectedData.status.windowFull
                    ? 'Window full'
                    : `${connectedData.status.polls} polls`
              }
              color={
                connectedData.status.lastError
                  ? 'error'
                  : connectedData.status.windowFull
                    ? 'warning'
                    : 'info'
              }
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
            />
          </Tooltip>
        )}

        <Box sx={{ flex: 1 }} />

        {project && !isInteractive && (
          <Button
            size="small"
            startIcon={<PrintIcon />}
            variant="contained"
            onClick={onPrint}
            disabled={!connected || !activePlotter}
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

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

        <PlotterControls />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

        <SettingsMenu />
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
    </AppBar>
  );
};
