import BoltIcon from '@mui/icons-material/Bolt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db, type Project } from '../db';
import {
  DEFAULT_PAGE_SIZE,
  formatSize,
  loadLastPageSize,
  type PageSize,
  plotterPageSize,
  STANDARD_SIZES,
  saveLastPageSize,
} from '../pageSizes';
import { usePlotters } from '../plotters';
import { INTERACTIVE_PROJECT_ID, useProject } from './../project';
import { createInitialState } from '../store';
import { AppStateSchema } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

const CUSTOM_KEY = 'custom';

export const ProjectGate = () => {
  const { setProject } = useProject();
  const { plotters } = usePlotters();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState('');

  // Page size selection. The key drives the dropdown; `custom` holds the
  // hand-entered dimensions so switching to Custom and back is lossless.
  const [sizeKey, setSizeKey] = useState<string>(CUSTOM_KEY);
  const [custom, setCustom] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const options = useMemo(() => {
    const fromPlotters = plotters.map((p) => ({
      key: `plotter:${p.id}`,
      label: `${p.name} (bed)`,
      size: plotterPageSize(p),
    }));
    const standard = STANDARD_SIZES.map((s) => ({
      key: `std:${s.label}`,
      label: s.label,
      size: s.size,
    }));
    return { fromPlotters, standard };
  }, [plotters]);

  // Seed from the last-used size: preselect whichever option matches it so the
  // common case (same paper every time) is already correct on arrival. Plotters
  // arrive asynchronously, so this re-runs when they land — but never after the
  // user has made a choice of their own.
  const touched = useRef(false);
  useEffect(() => {
    if (touched.current) return;
    const last = loadLastPageSize();
    setCustom(last);
    const all = [...options.fromPlotters, ...options.standard];
    const match = all.find((o) => o.size.width === last.width && o.size.height === last.height);
    setSizeKey(match?.key ?? CUSTOM_KEY);
  }, [options]);

  const size: PageSize = useMemo(() => {
    const all = [...options.fromPlotters, ...options.standard];
    return all.find((o) => o.key === sizeKey)?.size ?? custom;
  }, [sizeKey, custom, options]);

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

  const onStartInteractive = async () => {
    // Interactive sessions are ephemeral. Wipe any leftover persisted record
    // (from earlier app versions or aborted runs) and start in memory only.
    await db.projects.delete(INTERACTIVE_PROJECT_ID).catch(() => {});
    setProject(
      { id: INTERACTIVE_PROJECT_ID, name: 'Interactive session' },
      createInitialState(loadLastPageSize()),
    );
  };

  const visibleProjects = (projects ?? []).filter((p) => p.id !== INTERACTIVE_PROJECT_ID);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await db.projects.delete(id);
    refresh();
  };

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
                <FormControl size="small" sx={{ minWidth: 168 }}>
                  <InputLabel>Page size</InputLabel>
                  <Select
                    label="Page size"
                    value={sizeKey}
                    onChange={(e) => {
                      touched.current = true;
                      setSizeKey(e.target.value);
                    }}
                  >
                    {options.fromPlotters.length > 0 && (
                      <ListSubheader>From a plotter</ListSubheader>
                    )}
                    {options.fromPlotters.map((o) => (
                      <MenuItem key={o.key} value={o.key}>
                        {o.label} — {formatSize(o.size)}
                      </MenuItem>
                    ))}
                    <ListSubheader>Standard</ListSubheader>
                    {options.standard.map((o) => (
                      <MenuItem key={o.key} value={o.key}>
                        {o.label} — {formatSize(o.size)}
                      </MenuItem>
                    ))}
                    <ListSubheader>Other</ListSubheader>
                    <MenuItem value={CUSTOM_KEY}>Custom…</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={onCreate} disabled={!name.trim()}>
                  Create
                </Button>
              </Stack>

              {sizeKey === CUSTOM_KEY && (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Width (mm)"
                    value={custom.width}
                    onChange={(e) => {
                      touched.current = true;
                      setCustom((c) => ({ ...c, width: Number.parseFloat(e.target.value) || 0 }));
                    }}
                    sx={{ width: 140 }}
                  />
                  <Typography color="text.secondary">×</Typography>
                  <TextField
                    size="small"
                    type="number"
                    label="Height (mm)"
                    value={custom.height}
                    onChange={(e) => {
                      touched.current = true;
                      setCustom((c) => ({ ...c, height: Number.parseFloat(e.target.value) || 0 }));
                    }}
                    sx={{ width: 140 }}
                  />
                </Stack>
              )}

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
        </Stack>
      </Paper>
    </Box>
  );
};
