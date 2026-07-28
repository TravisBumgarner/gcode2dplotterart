import BoltIcon from '@mui/icons-material/Bolt';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import PhotoIcon from '@mui/icons-material/Photo';
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import type { ConnectedDataConfig } from '../connectedData';
import { useConnectedData } from '../connectedDataSession';
import { db, type Project } from '../db';
import { loadLastPageSize, type PageSize, saveLastPageSize } from '../pageSizes';
import { INTERACTIVE_PROJECT_ID, useProject } from './../project';
import { createInitialState } from '../store';
import { type AppState, AppStateSchema } from '../types';
import { ConnectedDataWizard } from './ConnectedDataWizard';
import { PageSizePicker } from './PageSizePicker';
import { type PhotoResult, PhotoStudio } from './PhotoStudio';

const uid = () => Math.random().toString(36).slice(2, 10);

export const ProjectGate = () => {
  const { setProject } = useProject();
  const { start: startConnectedData } = useConnectedData();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState('');

  const [size, setSize] = useState<PageSize>(() => loadLastPageSize());
  const [connectedDataOpen, setConnectedDataOpen] = useState(false);
  // The photo util takes over the whole view rather than opening a dialog —
  // it is a workspace, not a form.
  const [photoOpen, setPhotoOpen] = useState(false);

  const refresh = useCallback(async () => {
    const all = await db.projects.orderBy('updatedAt').reverse().toArray();
    setProjects(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || size.width <= 0 || size.height <= 0) return;
    saveLastPageSize(size);
    const now = Date.now();
    const project: Project = {
      id: uid(),
      name: trimmed,
      state: createInitialState(size),
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.put(project);
    setProject({ id: project.id, name: project.name }, project.state);
  };

  const onOpen = async (id: string) => {
    const project = await db.projects.get(id);
    if (!project) return;
    // Older documents carried plotter references (v1 `settings`, v2
    // `plotterId`); the schema drops them and keeps the page geometry.
    const parsed = AppStateSchema.safeParse(project.state);
    if (!parsed.success) {
      alert('This project has an unrecognised state shape and cannot be opened.');
      return;
    }
    setProject({ id: project.id, name: project.name }, parsed.data);
  };

  /** Ephemeral: wipe any leftover persisted record and start in memory only. */
  const startLiveSession = async (name: string, pageSize: PageSize) => {
    await db.projects.delete(INTERACTIVE_PROJECT_ID).catch(() => {});
    setProject({ id: INTERACTIVE_PROJECT_ID, name }, createInitialState(pageSize));
  };

  const onStartInteractive = () => startLiveSession('Interactive session', loadLastPageSize());

  // A Connected Data run is an interactive session whose strokes come from a
  // poll loop rather than the pointer, so it reuses the same live document and
  // streaming path — only the source of the geometry differs.
  const onStartConnectedData = async (config: ConnectedDataConfig) => {
    setConnectedDataOpen(false);
    let host = config.url;
    try {
      host = new URL(config.url).host;
    } catch {}
    await startLiveSession(`Connected Data · ${host}`, config.pageSize);
    startConnectedData(config);
  };

  /**
   * A photo plot is a multi-pen print job, not a live session: it becomes a
   * saved project with one layer per tone so the print flow can pause for a
   * pen swap between them.
   */
  const onCreatePhoto = async (result: PhotoResult) => {
    setPhotoOpen(false);
    const now = Date.now();
    const pageId = uid();
    const state: AppState = {
      pages: [
        { id: pageId, x: 0, y: 0, width: result.pageSize.width, height: result.pageSize.height },
      ],
      layers: result.layers.map((layer, index) => ({
        id: uid(),
        name: `Pen ${index + 1}${index === 0 ? ' (darkest)' : ''}`,
        color: layer.color,
        thickness: 0.5,
        visible: true,
        strokes: layer.strokes.map((points) => ({
          id: uid(),
          // Strokes arrive page-local; the margin is applied here so the
          // renderer's world space stays the single source of truth.
          points: points.map((p) => ({ x: p.x + result.marginMm, y: p.y + result.marginMm })),
          color: layer.color,
        })),
      })),
      activePageId: pageId,
      activeLayerId: '',
    };
    state.activeLayerId = state.layers[0].id;

    const project: Project = {
      id: uid(),
      name: result.name,
      state,
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.put(project);
    saveLastPageSize(result.pageSize);
    setProject({ id: project.id, name: project.name }, state);
  };

  const visibleProjects = (projects ?? []).filter((p) => p.id !== INTERACTIVE_PROJECT_ID);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await db.projects.delete(id);
    refresh();
  };

  if (photoOpen) {
    return <PhotoStudio onExit={() => setPhotoOpen(false)} onCreate={onCreatePhoto} />;
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', p: 3 }}>
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 600, p: 3, height: 'fit-content' }}>
        <Stack spacing={3}>
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
                Choose and connect a plotter from the top bar once you're in.
              </Typography>
            </Box>
            <Button variant="contained" onClick={onStartInteractive}>
              Start
            </Button>
          </Paper>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Projects
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                <TextField
                  size="small"
                  fullWidth
                  label="New project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onCreate()}
                  autoFocus
                />
                <PageSizePicker value={size} onChange={setSize} minWidth={190} />
                <Button variant="contained" onClick={onCreate} disabled={!name.trim()}>
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
                      <ListItemButton onClick={() => onOpen(p.id)}>
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
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Custom Utils
            </Typography>
            <Paper
              variant="outlined"
              sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <CloudDownloadIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Connected Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Poll a JSON endpoint and plot fields from it — numbers as a live series, arrays as
                  a chart.
                </Typography>
              </Box>
              <Button variant="contained" onClick={() => setConnectedDataOpen(true)}>
                Configure
              </Button>
            </Paper>

            <Paper
              variant="outlined"
              sx={{ p: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <PhotoIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Photo processing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Turn a photo into a multi-pen plot — grayscale, split into tonal layers, then
                  shade with lines, dots, or circles.
                </Typography>
              </Box>
              <Button variant="contained" onClick={() => setPhotoOpen(true)}>
                Open
              </Button>
            </Paper>
          </Box>
        </Stack>
      </Paper>

      <ConnectedDataWizard
        open={connectedDataOpen}
        onClose={() => setConnectedDataOpen(false)}
        onStart={onStartConnectedData}
      />
    </Box>
  );
};
