import HomeIcon from '@mui/icons-material/Home';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useConnection } from '../connection';
import { type PlotterDraft, usePlotters } from '../plotters';

type StepKind = 'corner-bl' | 'corner-tr' | 'penDownZ' | 'penUpZ';

type Captured = {
  blX?: number;
  blY?: number;
  trX?: number;
  trY?: number;
  penDownZ?: number;
  penUpZ?: number;
};

type CalStep = {
  kind: StepKind;
  title: string;
  description: string;
};

const STEPS: CalStep[] = [
  {
    kind: 'corner-bl',
    title: 'Bottom-left',
    description:
      'Jog the head to the BOTTOM-LEFT corner of the drawing area as it should appear on paper, then capture.',
  },
  {
    kind: 'corner-tr',
    title: 'Top-right',
    description:
      'Jog the head to the TOP-RIGHT corner of the drawing area, then capture. The two corners define size and orientation (X/Y direction).',
  },
  {
    kind: 'penDownZ',
    title: 'Pen down',
    description: 'Lower Z until the pen just touches the paper. This is the drawing height.',
  },
  {
    kind: 'penUpZ',
    title: 'Pen up',
    description: 'Raise Z so the pen safely clears the paper for travel moves.',
  },
];

const captureLabel = (c: Captured, kind: StepKind): string => {
  const f = (n?: number) => (n === undefined ? '—' : n.toFixed(2));
  switch (kind) {
    case 'corner-bl':
      return `${f(c.blX)}, ${f(c.blY)}`;
    case 'corner-tr':
      return `${f(c.trX)}, ${f(c.trY)}`;
    case 'penDownZ':
      return f(c.penDownZ);
    case 'penUpZ':
      return f(c.penUpZ);
  }
};

const STEP_OPTIONS = [0.1, 1, 10];

type Props = { onCreated: () => void };

export const PlotterCalibration = ({ onCreated }: Props) => {
  const { connection, connected, connect } = useConnection();
  const { createPlotter } = usePlotters();

  const [stepIdx, setStepIdx] = useState(0);
  const [jogMm, setJogMm] = useState(10);
  const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const [captured, setCaptured] = useState<Captured>({});

  // Final-form fields (not capturable by jogging)
  const [name, setName] = useState('');
  const [travelFeed, setTravelFeed] = useState(6000);
  const [drawFeed, setDrawFeed] = useState(3000);

  const onLastStep = stepIdx >= STEPS.length;
  const step = STEPS[Math.min(stepIdx, STEPS.length - 1)];

  const allCaptured = [
    captured.blX,
    captured.blY,
    captured.trX,
    captured.trY,
    captured.penDownZ,
    captured.penUpZ,
  ].every((v) => v !== undefined);

  const refreshPosition = async () => {
    if (!connected) return;
    setBusy(true);
    try {
      const p = await connection.getPosition();
      if (p) setPosition(p);
    } finally {
      setBusy(false);
    }
  };

  const jog = async (axis: 'X' | 'Y' | 'Z', delta: number) => {
    if (!connected) return;
    setBusy(true);
    try {
      await connection.send('G91');
      await connection.send(`G1 ${axis}${delta} F${travelFeed}`);
      await connection.send('G90');
      const p = await connection.getPosition();
      if (p) setPosition(p);
    } finally {
      setBusy(false);
    }
  };

  const home = async () => {
    if (!connected) return;
    setBusy(true);
    try {
      await connection.send('G28');
      const p = await connection.getPosition();
      if (p) setPosition(p);
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    if (!connected) return;
    setBusy(true);
    try {
      const p = (await connection.getPosition()) ?? position;
      if (!p) return;
      setPosition(p);
      setCaptured((prev) => {
        switch (step.kind) {
          case 'corner-bl':
            return { ...prev, blX: p.x, blY: p.y };
          case 'corner-tr':
            return { ...prev, trX: p.x, trY: p.y };
          case 'penDownZ':
            return { ...prev, penDownZ: p.z };
          case 'penUpZ':
            return { ...prev, penUpZ: p.z };
        }
      });
      setStepIdx((idx) => idx + 1);
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setCaptured({});
    setStepIdx(0);
  };

  const onSave = async () => {
    if (!allCaptured || !name.trim()) return;
    const blX = captured.blX ?? 0;
    const blY = captured.blY ?? 0;
    const trX = captured.trX ?? 0;
    const trY = captured.trY ?? 0;
    // Drawing-local origin is the page top-left with +y pointing down.
    // Left edge = bottom-left's X; top edge = top-right's Y. The ±1
    // directions absorb a machine whose X and/or Y runs backwards.
    const dirX: 1 | -1 = trX >= blX ? 1 : -1;
    const dirY: 1 | -1 = blY >= trY ? 1 : -1;
    const draft: PlotterDraft = {
      name: name.trim(),
      bedWidth: Math.abs(trX - blX),
      bedHeight: Math.abs(blY - trY),
      travelFeed,
      drawFeed,
      penUpZ: captured.penUpZ ?? 5,
      penDownZ: captured.penDownZ ?? 0,
      originX: blX,
      originY: trY,
      dirX,
      dirY,
    };
    await createPlotter(draft);
    setName('');
    setCaptured({});
    setStepIdx(0);
    onCreated();
  };

  return (
    <Stack spacing={2}>
      {!connected && (
        <Alert
          severity="warning"
          action={
            <Button size="small" onClick={connect}>
              Connect
            </Button>
          }
        >
          Connect to the plotter to calibrate.
        </Alert>
      )}

      <Stepper activeStep={onLastStep ? STEPS.length : stepIdx} alternativeLabel>
        {STEPS.map((s) => (
          <Step key={s.kind}>
            <StepLabel>{s.title}</StepLabel>
          </Step>
        ))}
        <Step>
          <StepLabel>Save</StepLabel>
        </Step>
      </Stepper>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <JogPad
          disabled={!connected || busy}
          jogMm={jogMm}
          setJogMm={setJogMm}
          onJog={jog}
          onHome={home}
          onReadPosition={refreshPosition}
          position={position}
        />

        <Box sx={{ flex: 1 }}>
          {!onLastStep ? (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Step {stepIdx + 1} of {STEPS.length}: {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {step.description}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button variant="contained" onClick={capture} disabled={!connected || busy}>
                  {step.kind.startsWith('corner') ? 'Capture corner' : 'Capture Z'}
                </Button>
                {stepIdx > 0 && (
                  <Button onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={busy}>
                    Back
                  </Button>
                )}
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Review and save
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Plotter name"
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField
                    label="Travel feed (mm/min)"
                    size="small"
                    type="number"
                    value={travelFeed}
                    onChange={(e) => setTravelFeed(Number.parseFloat(e.target.value) || 0)}
                  />
                  <TextField
                    label="Draw feed (mm/min)"
                    size="small"
                    type="number"
                    value={drawFeed}
                    onChange={(e) => setDrawFeed(Number.parseFloat(e.target.value) || 0)}
                  />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button onClick={restart}>Recalibrate</Button>
                  <Box sx={{ flex: 1 }} />
                  <Button variant="contained" onClick={onSave} disabled={!name.trim()}>
                    Save plotter
                  </Button>
                </Stack>
              </Stack>
            </>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Captured
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, gap: 1, flexWrap: 'wrap' }}>
              {STEPS.map((s) => {
                const label = captureLabel(captured, s.kind);
                const done = !label.includes('—');
                return (
                  <Chip
                    key={s.kind}
                    size="small"
                    label={`${s.title}: ${label}`}
                    variant={done ? 'filled' : 'outlined'}
                    color={done ? 'primary' : 'default'}
                  />
                );
              })}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Stack>
  );
};

const JogPad = ({
  disabled,
  jogMm,
  setJogMm,
  onJog,
  onHome,
  onReadPosition,
  position,
}: {
  disabled: boolean;
  jogMm: number;
  setJogMm: (n: number) => void;
  onJog: (axis: 'X' | 'Y' | 'Z', delta: number) => void;
  onHome: () => void;
  onReadPosition: () => void;
  position: { x: number; y: number; z: number } | null;
}) => {
  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        minWidth: 240,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          step
        </Typography>
        <Select
          size="small"
          value={jogMm}
          onChange={(e) => setJogMm(Number(e.target.value))}
          sx={{ minWidth: 80 }}
        >
          {STEP_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {s} mm
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={onHome} disabled={disabled} title="Home (G28)">
          <HomeIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '40px 40px 40px 1fr 40px',
          gridTemplateRows: '40px 40px 40px',
          gap: 0.5,
          alignItems: 'center',
          justifyContent: 'start',
        }}
      >
        <Box />
        <IconButton disabled={disabled} onClick={() => onJog('Y', -jogMm)} title="Y -" size="small">
          <KeyboardArrowUpIcon />
        </IconButton>
        <Box />
        <Box />
        <Button
          disabled={disabled}
          size="small"
          variant="outlined"
          onClick={() => onJog('Z', jogMm)}
          sx={{ minWidth: 0, gridRow: 1, gridColumn: 5 }}
        >
          Z+
        </Button>

        <IconButton disabled={disabled} onClick={() => onJog('X', -jogMm)} title="X -" size="small">
          <KeyboardArrowLeftIcon />
        </IconButton>
        <Button
          disabled={disabled}
          size="small"
          variant="outlined"
          onClick={onReadPosition}
          sx={{ minWidth: 0 }}
        >
          ?
        </Button>
        <IconButton disabled={disabled} onClick={() => onJog('X', jogMm)} title="X +" size="small">
          <KeyboardArrowRightIcon />
        </IconButton>
        <Box />
        <Box />

        <Box />
        <IconButton disabled={disabled} onClick={() => onJog('Y', jogMm)} title="Y +" size="small">
          <KeyboardArrowDownIcon />
        </IconButton>
        <Box />
        <Box />
        <Button
          disabled={disabled}
          size="small"
          variant="outlined"
          onClick={() => onJog('Z', -jogMm)}
          sx={{ minWidth: 0, gridRow: 3, gridColumn: 5 }}
        >
          Z−
        </Button>
      </Box>

      <Box sx={{ mt: 1.5, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
        {position
          ? `X ${position.x.toFixed(2)}  Y ${position.y.toFixed(2)}  Z ${position.z.toFixed(2)}`
          : 'position —'}
      </Box>
    </Box>
  );
};
