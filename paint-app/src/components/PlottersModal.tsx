import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { db } from '../db';
import { type PlotterDraft, usePlotters } from '../plotters';
import { PlotterCalibration } from './PlotterCalibration';

const EMPTY_DRAFT: PlotterDraft = {
  name: '',
  bedWidth: 220,
  bedHeight: 220,
  travelFeed: 6000,
  drawFeed: 3000,
  penUpZ: 5,
  penDownZ: 0,
};

type Mode = 'manual' | 'calibrate' | null;

type Props = { open: boolean; onClose: () => void };

export const PlottersModal = ({ open, onClose }: Props) => {
  const { plotters, createPlotter, updatePlotter, deletePlotter } = usePlotters();
  const [draft, setDraft] = useState<PlotterDraft>(EMPTY_DRAFT);
  const [mode, setMode] = useState<Mode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [usageById, setUsageById] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const all = await db.projects.toArray();
      const counts: Record<string, number> = {};
      for (const p of all) {
        const id = p.state.plotterId;
        if (!id) continue;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      if (!cancelled) setUsageById(counts);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const onSubmit = async () => {
    if (!draft.name.trim()) return;
    const clean = { ...draft, name: draft.name.trim() };
    if (editingId) {
      await updatePlotter(editingId, clean);
    } else {
      await createPlotter(clean);
    }
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setMode(null);
  };

  const onEdit = (id: string) => {
    const p = plotters.find((x) => x.id === id);
    if (!p) return;
    const { id: _id, createdAt: _createdAt, ...rest } = p;
    setDraft(rest);
    setEditingId(id);
    setMode('manual');
  };

  const onDelete = async (id: string) => {
    const inUse = usageById[id] ?? 0;
    if (inUse > 0) {
      alert(
        `This plotter is used by ${inUse} project${inUse === 1 ? '' : 's'} and can't be deleted.`,
      );
      return;
    }
    if (!confirm('Delete this plotter? This cannot be undone.')) return;
    await deletePlotter(id);
  };

  const handleClose = () => {
    setMode(null);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Plotters</DialogTitle>
      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Projects reference a plotter by id. Editing one changes every project that uses it the
          next time it builds G-code — create a separate plotter instead if you only want the change
          for a new project.
        </Alert>

        <Typography variant="subtitle2" gutterBottom>
          Existing plotters
        </Typography>
        {plotters.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            None yet.
          </Typography>
        ) : (
          <List dense disablePadding>
            {plotters.map((p) => {
              const usage = usageById[p.id] ?? 0;
              return (
                <ListItem
                  key={p.id}
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton edge="end" size="small" onClick={() => onEdit(p.id)} title="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onDelete(p.id)}
                        disabled={usage > 0}
                        title={
                          usage > 0 ? `Used by ${usage} project${usage === 1 ? '' : 's'}` : 'Delete'
                        }
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={p.name}
                    secondary={
                      <>
                        Bed {p.bedWidth}×{p.bedHeight}mm · travel {p.travelFeed} · draw {p.drawFeed}{' '}
                        · Z up {p.penUpZ} / down {p.penDownZ}
                        {usage > 0 && ` · used by ${usage} project${usage === 1 ? '' : 's'}`}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" gutterBottom>
          {editingId ? 'Edit plotter' : 'New plotter'}
        </Typography>

        {mode === null ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <MethodCard
              icon={<EditIcon />}
              title="Manual entry"
              description="Type each value (bed size, feed rates, pen Z heights). Quick if you already know your machine's parameters."
              onClick={() => setMode('manual')}
            />
            <MethodCard
              icon={<TuneIcon />}
              title="Calibrate"
              description="Connect and jog to two corners (bottom-left, top-right) plus pen up/down. Captures bed size, pen Z, and X/Y orientation live via M114."
              onClick={() => setMode('calibrate')}
            />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 1.5 }}>
              <Button
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setMode(null);
                  setEditingId(null);
                  setDraft(EMPTY_DRAFT);
                }}
              >
                {editingId
                  ? 'Cancel edit'
                  : `${mode === 'manual' ? 'Manual entry' : 'Calibrate'} · change method`}
              </Button>
            </Box>
            {mode === 'manual' ? (
              <Stack spacing={1.5}>
                <TextField
                  label="Name"
                  size="small"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  autoFocus
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <NumField
                    label="Bed width (mm)"
                    value={draft.bedWidth}
                    onChange={(v) => setDraft({ ...draft, bedWidth: v })}
                  />
                  <NumField
                    label="Bed height (mm)"
                    value={draft.bedHeight}
                    onChange={(v) => setDraft({ ...draft, bedHeight: v })}
                  />
                  <NumField
                    label="Travel feed (mm/min)"
                    value={draft.travelFeed}
                    onChange={(v) => setDraft({ ...draft, travelFeed: v })}
                  />
                  <NumField
                    label="Draw feed (mm/min)"
                    value={draft.drawFeed}
                    onChange={(v) => setDraft({ ...draft, drawFeed: v })}
                  />
                  <NumField
                    label="Pen up Z (mm)"
                    value={draft.penUpZ}
                    onChange={(v) => setDraft({ ...draft, penUpZ: v })}
                  />
                  <NumField
                    label="Pen down Z (mm)"
                    value={draft.penDownZ}
                    onChange={(v) => setDraft({ ...draft, penDownZ: v })}
                  />
                </Box>
              </Stack>
            ) : (
              <PlotterCalibration onCreated={() => setMode(null)} />
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        {mode === 'manual' && (
          <Button variant="contained" onClick={onSubmit} disabled={!draft.name.trim()}>
            {editingId ? 'Save changes' : 'Create plotter'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const MethodCard = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <ButtonBase
    onClick={onClick}
    sx={{ display: 'block', textAlign: 'left', borderRadius: 1, height: '100%' }}
  >
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 1,
        },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  </ButtonBase>
);

const NumField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <TextField
    label={label}
    size="small"
    type="number"
    value={value}
    onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
    slotProps={{ htmlInput: { step: 0.1 } }}
  />
);
