import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import {
  type ConnectedDataConfig,
  DEFAULT_INTERVAL_SECONDS,
  DEFAULT_MARGIN_MM,
  DEFAULT_WINDOW_MINUTES,
  type DiscoveredField,
  discoverFields,
  getNumber,
  plotArea,
  SERIES_COLORS,
  type Selection,
  seedRange,
  snapshotPoints,
  valueToY,
} from '../connectedData';
import { fetchText } from '../desktop';
import { loadLastPageSize, type PageSize } from '../pageSizes';
import { PageSizePicker } from './PageSizePicker';

const STEPS = ['Source', 'Data', 'Plot'];

const INTERVAL_PRESETS = [
  { label: '5s', value: 5 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '1h', value: 3600 },
];

type Probe = {
  json: unknown;
  fields: DiscoveredField[];
  viaDesktop: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onStart: (config: ConnectedDataConfig) => void;
};

/** Whether a discovered field can be plotted at all. */
const isPlottable = (field: DiscoveredField) =>
  (field.kind === 'scalar' && field.valueKind === 'number') ||
  field.kind === 'numberArray' ||
  field.kind === 'objectArray';

const numericItemFields = (field: DiscoveredField) =>
  field.kind === 'objectArray' ? field.itemFields.filter((f) => f.kind === 'number') : [];

export const ConnectedDataWizard = ({ open, onClose, onStart }: Props) => {
  const [step, setStep] = useState(0);

  // Step 1
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'json' | 'html'>('json');
  const [probing, setProbing] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [probe, setProbe] = useState<Probe | null>(null);

  // Step 2
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [intervalSeconds, setIntervalSeconds] = useState(DEFAULT_INTERVAL_SECONDS);

  // Step 3
  const [pageSize, setPageSize] = useState<PageSize>(() => loadLastPageSize());
  const [marginMm, setMarginMm] = useState(DEFAULT_MARGIN_MM);
  const [windowMinutes, setWindowMinutes] = useState(DEFAULT_WINDOW_MINUTES);

  const chosen = useMemo(() => Object.values(selections), [selections]);
  const hasSeries = chosen.some((s) => s.mode === 'series');

  const reset = () => {
    setStep(0);
    setUrl('');
    setProbe(null);
    setProbeError(null);
    setSelections({});
    setIntervalSeconds(DEFAULT_INTERVAL_SECONDS);
    setMarginMm(DEFAULT_MARGIN_MM);
    setWindowMinutes(DEFAULT_WINDOW_MINUTES);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const runProbe = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setProbing(true);
    setProbeError(null);
    setProbe(null);
    setSelections({});
    try {
      const { body, viaDesktop } = await fetchText(trimmed);
      const json = JSON.parse(body);
      const fields = discoverFields(json);
      if (fields.length === 0) {
        setProbeError('Fetched successfully, but no plottable fields were found in the response.');
      } else {
        setProbe({ json, fields, viaDesktop });
      }
    } catch (e) {
      const message = (e as Error).message;
      setProbeError(message.includes('JSON') ? `Response was not valid JSON: ${message}` : message);
    } finally {
      setProbing(false);
    }
  };

  const toggleField = (field: DiscoveredField) => {
    setSelections((prev) => {
      if (prev[field.path]) {
        const { [field.path]: _removed, ...rest } = prev;
        return rest;
      }
      const color = SERIES_COLORS[Object.keys(prev).length % SERIES_COLORS.length];
      if (field.kind === 'scalar') {
        const value = probe ? (getNumber(probe.json, field.path) ?? 0) : 0;
        return {
          ...prev,
          [field.path]: {
            id: field.path,
            path: field.path,
            label: field.label,
            mode: 'series',
            color,
            xField: null,
            yField: null,
            autoRange: false,
            ...seedRange(value),
          },
        };
      }
      const numeric = numericItemFields(field);
      return {
        ...prev,
        [field.path]: {
          id: field.path,
          path: field.path,
          label: field.label,
          mode: 'snapshot',
          color,
          xField: null,
          yField: field.kind === 'objectArray' ? (numeric[0]?.path ?? null) : null,
          autoRange: true,
          yMin: 0,
          yMax: 1,
        },
      };
    });
  };

  const patch = (id: string, changes: Partial<Selection>) =>
    setSelections((prev) => ({ ...prev, [id]: { ...prev[id], ...changes } }));

  const canAdvance =
    step === 0
      ? probe !== null
      : step === 1
        ? chosen.length > 0 &&
          chosen.every((s) => s.mode !== 'snapshot' || s.yField !== null || isNumberArray(s, probe))
        : true;

  const finish = () => {
    onStart({
      url: url.trim(),
      format: 'json',
      intervalSeconds,
      pageSize,
      marginMm,
      windowMinutes,
      selections: chosen,
    });
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Connected Data</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Stack spacing={2}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={format}
              onChange={(_e, v) => v && setFormat(v)}
            >
              <ToggleButton value="json">JSON</ToggleButton>
              <Tooltip title="Not implemented yet">
                <span>
                  <ToggleButton value="html" disabled>
                    HTML
                  </ToggleButton>
                </span>
              </Tooltip>
            </ToggleButtonGroup>

            <TextField
              size="small"
              fullWidth
              label="URL"
              placeholder="https://api.example.com/readings"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runProbe()}
              autoFocus
            />

            <Box>
              <Button
                variant="contained"
                onClick={runProbe}
                disabled={!url.trim() || probing}
                startIcon={probing ? <CircularProgress size={14} color="inherit" /> : null}
              >
                {probing ? 'Fetching…' : 'Fetch'}
              </Button>
            </Box>

            {probeError && <Alert severity="error">{probeError}</Alert>}
            {probe && (
              <Alert severity="success">
                Found <strong>{probe.fields.length}</strong> field
                {probe.fields.length === 1 ? '' : 's'}, of which{' '}
                <strong>{probe.fields.filter(isPlottable).length}</strong> can be plotted.
                {!probe.viaDesktop &&
                  ' Fetched directly from the browser — the desktop app can reach endpoints that block CORS.'}
              </Alert>
            )}
          </Stack>
        )}

        {step === 1 && probe && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Numbers are sampled repeatedly to build a live series. Arrays are drawn all at once
              from a single response.
            </Typography>

            <Paper variant="outlined" sx={{ maxHeight: 340, overflow: 'auto' }}>
              <Stack divider={<Divider />}>
                {probe.fields.map((field) => {
                  const selected = selections[field.path];
                  const plottable = isPlottable(field);
                  return (
                    <Box key={field.path} sx={{ p: 1.5, opacity: plottable ? 1 : 0.5 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Checkbox
                          size="small"
                          checked={Boolean(selected)}
                          disabled={!plottable}
                          onChange={() => toggleField(field)}
                          sx={{ p: 0.5 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'ui-monospace, Menlo, monospace' }}
                          >
                            {field.label}
                            {field.kind !== 'scalar' && '[]'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {field.sample}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={field.kind === 'scalar' ? <TimelineIcon /> : <ShowChartIcon />}
                          label={
                            field.kind === 'scalar'
                              ? field.valueKind === 'number'
                                ? 'live series'
                                : field.valueKind
                              : field.kind === 'numberArray'
                                ? `${field.length} numbers`
                                : `${field.length} objects`
                          }
                        />
                      </Stack>

                      {selected && (
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mt: 1.5, ml: 4, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
                        >
                          {field.kind === 'objectArray' && (
                            <>
                              <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>X axis</InputLabel>
                                <Select
                                  label="X axis"
                                  value={selected.xField ?? ''}
                                  onChange={(e) =>
                                    patch(selected.id, { xField: e.target.value || null })
                                  }
                                >
                                  <MenuItem value="">Item index</MenuItem>
                                  {numericItemFields(field).map((f) => (
                                    <MenuItem key={f.path} value={f.path}>
                                      {f.path}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Y axis</InputLabel>
                                <Select
                                  label="Y axis"
                                  value={selected.yField ?? ''}
                                  onChange={(e) =>
                                    patch(selected.id, { yField: e.target.value || null })
                                  }
                                >
                                  {numericItemFields(field).map((f) => (
                                    <MenuItem key={f.path} value={f.path}>
                                      {f.path}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </>
                          )}

                          {selected.mode === 'snapshot' && (
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={selected.autoRange}
                                  onChange={(e) =>
                                    patch(selected.id, { autoRange: e.target.checked })
                                  }
                                />
                              }
                              label={<Typography variant="body2">Fit to data</Typography>}
                            />
                          )}

                          {!selected.autoRange && (
                            <>
                              <TextField
                                size="small"
                                type="number"
                                label="Y min"
                                value={selected.yMin}
                                onChange={(e) =>
                                  patch(selected.id, {
                                    yMin: Number.parseFloat(e.target.value) || 0,
                                  })
                                }
                                sx={{ width: 110 }}
                              />
                              <TextField
                                size="small"
                                type="number"
                                label="Y max"
                                value={selected.yMax}
                                onChange={(e) =>
                                  patch(selected.id, {
                                    yMax: Number.parseFloat(e.target.value) || 0,
                                  })
                                }
                                sx={{ width: 110 }}
                              />
                            </>
                          )}

                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: selected.color,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
                        </Stack>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Paper>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2">Fetch every</Typography>
              {INTERVAL_PRESETS.map((preset) => (
                <Chip
                  key={preset.value}
                  label={preset.label}
                  size="small"
                  color={intervalSeconds === preset.value ? 'primary' : 'default'}
                  variant={intervalSeconds === preset.value ? 'filled' : 'outlined'}
                  onClick={() => setIntervalSeconds(preset.value)}
                />
              ))}
              <TextField
                size="small"
                type="number"
                label="seconds"
                value={intervalSeconds}
                onChange={(e) =>
                  setIntervalSeconds(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
                }
                sx={{ width: 110 }}
              />
            </Stack>

            {hasSeries && (
              <Alert severity="info">
                A live series can't auto-range: earlier points are already drawn (and possibly
                plotted) by the time a new extreme arrives, so the Y range is fixed up front. The
                defaults come from the value in the response you just fetched.
              </Alert>
            )}
          </Stack>
        )}

        {step === 2 && probe && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <PageSizePicker value={pageSize} onChange={setPageSize} />
              <TextField
                size="small"
                type="number"
                label="Margin (mm)"
                value={marginMm}
                onChange={(e) => setMarginMm(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                sx={{ width: 130 }}
              />
              {hasSeries && (
                <TextField
                  size="small"
                  type="number"
                  label="Time across page (min)"
                  value={windowMinutes}
                  onChange={(e) =>
                    setWindowMinutes(Math.max(1, Number.parseFloat(e.target.value) || 1))
                  }
                  sx={{ width: 180 }}
                />
              )}
            </Stack>

            <PlotPreview
              json={probe.json}
              selections={chosen}
              pageSize={pageSize}
              marginMm={marginMm}
            />

            <PlotSummary
              selections={chosen}
              intervalSeconds={intervalSeconds}
              windowMinutes={windowMinutes}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
        {step < STEPS.length - 1 ? (
          <Button variant="contained" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={finish} disabled={chosen.length === 0}>
            Start session
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

/** numberArray selections need no Y field; objectArray ones do. */
const isNumberArray = (selection: Selection, probe: Probe | null) =>
  probe?.fields.find((f) => f.path === selection.path)?.kind === 'numberArray';

const PlotPreview = ({
  json,
  selections,
  pageSize,
  marginMm,
}: {
  json: unknown;
  selections: Selection[];
  pageSize: PageSize;
  marginMm: number;
}) => {
  const area = plotArea(pageSize, marginMm);

  return (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
      <Box
        component="svg"
        viewBox={`0 0 ${pageSize.width} ${pageSize.height}`}
        sx={{ width: '100%', maxWidth: 320, height: 'auto', maxHeight: 340 }}
      >
        <title>Plot preview</title>
        <rect
          x={0}
          y={0}
          width={pageSize.width}
          height={pageSize.height}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={0.6}
        />
        <rect
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth={0.4}
          strokeDasharray="2 2"
        />
        {selections.map((selection) => {
          if (selection.mode === 'snapshot') {
            const points = snapshotPoints(json, selection, area);
            if (points.length < 2) return null;
            return (
              <polyline
                key={selection.id}
                points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={selection.color}
                strokeWidth={0.8}
                strokeLinejoin="round"
              />
            );
          }
          // A live series has exactly one real point so far; show where it
          // starts and which way it will grow.
          const value = getNumber(json, selection.path);
          if (value === null) return null;
          const y = valueToY(value, selection.yMin, selection.yMax, area);
          return (
            <g key={selection.id}>
              <line
                x1={area.x}
                y1={y}
                x2={area.x + area.width}
                y2={y}
                stroke={selection.color}
                strokeOpacity={0.35}
                strokeWidth={0.5}
                strokeDasharray="3 3"
              />
              <circle cx={area.x} cy={y} r={1.4} fill={selection.color} />
            </g>
          );
        })}
      </Box>
    </Paper>
  );
};

const PlotSummary = ({
  selections,
  intervalSeconds,
  windowMinutes,
}: {
  selections: Selection[];
  intervalSeconds: number;
  windowMinutes: number;
}) => {
  const series = selections.filter((s) => s.mode === 'series');
  const snapshots = selections.filter((s) => s.mode === 'snapshot');
  const samples = Math.floor((windowMinutes * 60) / Math.max(1, intervalSeconds));

  return (
    <Alert severity="info" icon={false}>
      <Stack spacing={0.5}>
        {series.length > 0 && (
          <Typography variant="body2">
            <strong>{series.length}</strong> live series ({series.map((s) => s.label).join(', ')}) —
            one segment drawn per fetch, about <strong>{samples}</strong> points before the page is
            full at {intervalSeconds}s intervals.
          </Typography>
        )}
        {snapshots.length > 0 && (
          <Typography variant="body2">
            <strong>{snapshots.length}</strong> snapshot series (
            {snapshots.map((s) => s.label).join(', ')}) — redrawn whenever the fetched data changes.
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Strokes go to the plotter as they're drawn, exactly like an interactive session. Connect a
          plotter from the top bar; anything drawn while disconnected stays on screen only.
        </Typography>
      </Stack>
    </Alert>
  );
};
