import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
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
import { useState } from 'react';
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
  const { plotters, activePlotter, setActivePlotter, createPlotter, updatePlotter, deletePlotter } =
    usePlotters();
  const [draft, setDraft] = useState<PlotterDraft>(EMPTY_DRAFT);
  const [mode, setMode] = useState<Mode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
        <Alert severity="info" sx={{ mb: 2 }}>
          Plotters are output targets, like printers — drawings don't belong to one. Pick which
          plotter to send to from the top bar at any time.
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
              const isActive = activePlotter?.id === p.id;
              return (
                <ListItem
                  key={p.id}
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      {isActive ? (
                        <Chip label="Active" size="small" color="primary" variant="outlined" />
                      ) : (
                        <Button size="small" onClick={() => setActivePlotter(p.id)}>
                          Use
                        </Button>
                      )}
                      <IconButton edge="end" size="small" onClick={() => onEdit(p.id)} title="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onDelete(p.id)}
                        title="Delete"
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
