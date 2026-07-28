import BoltIcon from '@mui/icons-material/Bolt';
import BugReportIcon from '@mui/icons-material/BugReport';
import GitHubIcon from '@mui/icons-material/GitHub';
import PrintIcon from '@mui/icons-material/Print';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Toolbar as MuiToolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useConnection } from '../connection';
import { usePlotters } from '../plotters';
import { INTERACTIVE_PROJECT_ID, useProject } from '../project';
import { DebugModal } from './DebugModal';
import { PlotterControls } from './PlotterControls';
import { SettingsMenu } from './SettingsMenu';

type Props = {
  onPrint: () => void;
};

/**
 * The application's single top bar. Mounted above the document/home swap so
 * plotter selection and the connection live at app scope: you can connect,
 * switch machines, or emergency-stop from anywhere, including the home screen.
 */
export const Toolbar = ({ onPrint }: Props) => {
  const { project, isDirty, isSaving, autosave } = useProject();
  const { connected } = useConnection();
  const { activePlotter } = usePlotters();
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

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

        <PlotterControls />

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
      {debugOpen && <DebugModal onClose={() => setDebugOpen(false)} />}
    </AppBar>
  );
};
