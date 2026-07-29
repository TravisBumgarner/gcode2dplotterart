import BoltIcon from '@mui/icons-material/Bolt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Toolbar as MuiToolbar,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useConnection } from '../connection';
import { db, type Project } from '../db';
import { type PlotterDraft, usePlotters } from '../plotters';
import { INTERACTIVE_PROJECT_ID, useProject } from './../project';
import { createInitialState } from '../store';
import { type AppState, AppStateSchema, LegacyAppStateSchema } from '../types';
import { PlottersModal } from './PlottersModal';
import { SerialPortRow } from './SerialPortRow';
import { SettingsMenu } from './SettingsMenu';

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Bring a stored AppState onto the current schema. Returns `[migratedState, plotterToCreate?]`
 * where plotterToCreate is non-null if we had to fabricate a plotter from a
 * legacy project's inline `settings` block.
 */
const migrateState = (raw: unknown): { state: AppState; plotterDraft?: PlotterDraft } | null => {
  const direct = AppStateSchema.safeParse(raw);
  if (direct.success) return { state: direct.data };
  const legacy = LegacyAppStateSchema.safeParse(raw);
  if (legacy.success) {
    const tempPlotterId = uid();
    return {
      state: {
        pages: legacy.data.pages,
        layers: legacy.data.layers,
        activePageId: legacy.data.activePageId,
        activeLayerId: legacy.data.activeLayerId,
        plotterId: tempPlotterId,
      },
      plotterDraft: {
        name: 'Migrated plotter',
        ...legacy.data.settings,
      },
    };
  }
  return null;
};

export const ProjectGate = () => {
  const { setProject } = useProject();
  const { plotters, ready: plottersReady, createPlotter } = usePlotters();
  const { connected, connectError, dismissConnectError } = useConnection();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState('');
  const [pickedPlotterId, setPickedPlotterId] = useState<string>('');
  const [plottersOpen, setPlottersOpen] = useState(false);

  const refresh = useCallback(async () => {
    const all = await db.projects.orderBy('updatedAt').reverse().toArray();
    setProjects(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Default the new-project plotter selector to the most recent plotter.
  useEffect(() => {
    if (!pickedPlotterId && plotters.length > 0) {
      setPickedPlotterId(plotters[plotters.length - 1].id);
    }
  }, [plotters, pickedPlotterId]);

  const onCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || !pickedPlotterId) return;
    const plotter = plotters.find((p) => p.id === pickedPlotterId);
    if (!plotter) return;
    const now = Date.now();
    const project: Project = {
      id: uid(),
      name: trimmed,
      state: createInitialState(plotter),
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.put(project);
    setProject({ id: project.id, name: project.name }, project.state);
  };

  const onOpen = async (id: string) => {
    const project = await db.projects.get(id);
    if (!project) return;
    const migrated = migrateState(project.state);
    if (!migrated) {
      alert('This project has an unrecognised state shape and cannot be opened.');
      return;
    }
    let { state } = migrated;
    if (migrated.plotterDraft) {
      const newPlotter = await createPlotter(migrated.plotterDraft);
      state = { ...state, plotterId: newPlotter.id };
    }
    if (state !== project.state) {
      await db.projects.update(id, { state });
    }
    setProject({ id: project.id, name: project.name }, state);
  };

  const onStartInteractive = async () => {
    const plotter = plotters[plotters.length - 1];
    if (!plotter) return;
    // Interactive sessions are ephemeral. Wipe any leftover persisted record
    // (from earlier app versions or aborted runs) and start in memory only.
    await db.projects.delete(INTERACTIVE_PROJECT_ID).catch(() => {});
    setProject(
      { id: INTERACTIVE_PROJECT_ID, name: 'Interactive session' },
      createInitialState(plotter),
    );
  };

  const visibleProjects = (projects ?? []).filter((p) => p.id !== INTERACTIVE_PROJECT_ID);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await db.projects.delete(id);
    refresh();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppBar position="static" color="default" elevation={1}>
        <MuiToolbar variant="dense" sx={{ gap: 1 }}>
          <SettingsMenu />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, ml: 1 }}>
            paint-app
          </Typography>
        </MuiToolbar>
      </AppBar>
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', p: 3 }}>
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: 600, p: 3 }}>
          <Stack spacing={3}>
            <Box>
              {!plottersReady ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} /> <span>Loading plotters…</span>
                </Box>
              ) : (
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    {plotters.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        No plotters configured — define one before starting.
                      </Typography>
                    ) : (
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Plotter</InputLabel>
                        <Select
                          label="Plotter"
                          value={pickedPlotterId}
                          onChange={(e) => setPickedPlotterId(e.target.value)}
                        >
                          {plotters.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    <Button
                      size="small"
                      variant={plotters.length === 0 ? 'contained' : 'text'}
                      onClick={() => setPlottersOpen(true)}
                    >
                      {plotters.length === 0 ? 'Create plotter' : 'Manage…'}
                    </Button>
                  </Stack>

                  <SerialPortRow />
                </Stack>
              )}
            </Box>

            <Divider />

            <Tooltip
              title={plotters.length === 0 ? 'Create a plotter first' : ''}
              disableHoverListener={plotters.length > 0}
              arrow
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderColor: 'primary.main',
                }}
              >
                <BoltIcon color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Interactive session
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    One live document — every stroke is sent to the plotter as soon as you draw it.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={onStartInteractive}
                  disabled={plotters.length === 0 || !connected}
                >
                  Start
                </Button>
              </Paper>
            </Tooltip>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Projects
              </Typography>
              {!plottersReady ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} /> <span>Loading plotters…</span>
                </Box>
              ) : plotters.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Create a plotter above first.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="New project name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onCreate()}
                      autoFocus
                    />
                    <Button
                      variant="contained"
                      onClick={onCreate}
                      disabled={!name.trim() || !pickedPlotterId || !connected}
                    >
                      Create
                    </Button>
                  </Stack>
                  {projects === null ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading…
                    </Typography>
                  ) : visibleProjects.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No saved projects yet.
                    </Typography>
                  ) : (
                    <List dense disablePadding>
                      {visibleProjects.map((p) => (
                        <ListItem
                          key={p.id}
                          disablePadding
                          secondaryAction={
                            <IconButton
                              edge="end"
                              size="small"
                              aria-label="delete"
                              onClick={() => onDelete(p.id)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemButton onClick={() => onOpen(p.id)} disabled={!connected}>
                            <ListItemText
                              primary={p.name}
                              secondary={`Updated ${new Date(p.updatedAt).toLocaleString()}`}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        </Paper>
      </Box>

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
    </Box>
  );
};
