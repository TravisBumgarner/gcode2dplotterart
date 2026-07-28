import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PageSize } from '../pageSizes';
import {
  BUCKET_METHODS,
  type BucketedImage,
  type BucketMethod,
  bucketImage,
  DEFAULT_STYLE_PARAMS,
  GRAYSCALE_METHODS,
  type GrayscaleMethod,
  type LayerStrokes,
  PHOTO_PRESETS,
  type PhotoStyle,
  paletteFor,
  renderStyle,
  type StyleParams,
  targetResolution,
  toGrayscale,
} from '../photo';
import { bucketPreviewUrl, decodeFile, fitWithin, resample } from '../photoDecode';
import { PageSizePicker } from './PageSizePicker';

const STEPS = ['Image', 'Process', 'Style'];

export type PhotoResult = {
  name: string;
  pageSize: PageSize;
  marginMm: number;
  /** One entry per bucket, darkest first. Page-local mm. */
  layers: { color: string; strokes: LayerStrokes }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (result: PhotoResult) => void;
};

const STYLE_LABELS: Record<PhotoStyle, string> = {
  horizontal: 'Horizontal scan',
  diagonal: 'Diagonal lines',
  dots: 'Stipple dots',
  circles: 'Concentric circles',
};

export const PhotoWizard = ({ open, onClose, onCreate }: Props) => {
  const [step, setStep] = useState(0);

  // Step 1
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Step 2
  const [presetId, setPresetId] = useState(PHOTO_PRESETS[0].id);
  const [grayscale, setGrayscale] = useState<GrayscaleMethod>('luminosity');
  const [bucket, setBucket] = useState<BucketMethod>('even-pixels');
  const [layerCount, setLayerCount] = useState(4);
  const [palette, setPalette] = useState<string[]>(PHOTO_PRESETS[0].palette);

  // Step 3
  const [style, setStyle] = useState<PhotoStyle>('diagonal');
  const [params, setParams] = useState<StyleParams>(DEFAULT_STYLE_PARAMS);
  const [pageSize, setPageSize] = useState<PageSize>({ width: 180, height: 240 });
  const [marginMm, setMarginMm] = useState(10);

  const [rendering, setRendering] = useState(false);
  const [rendered, setRendered] = useState<LayerStrokes[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const areaWidth = Math.max(1, pageSize.width - 2 * marginMm);
  const areaHeight = Math.max(1, pageSize.height - 2 * marginMm);

  const applyPreset = useCallback((id: string) => {
    const preset = PHOTO_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setStyle(preset.style);
    setGrayscale(preset.grayscale);
    setBucket(preset.bucket);
    setLayerCount(preset.layerCount);
    setParams(preset.params);
    setPalette(preset.palette);
  }, []);

  useEffect(() => {
    if (open) applyPreset(PHOTO_PRESETS[0].id);
  }, [open, applyPreset]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  const colors = useMemo(() => paletteFor(palette, layerCount), [palette, layerCount]);

  /**
   * The bucketed image at the resolution the chosen style wants. Recomputed
   * whenever anything upstream changes; it also backs the step-2 preview.
   */
  const processed: BucketedImage | null = useMemo(() => {
    if (!bitmap) return null;
    const target = targetResolution(style, areaWidth, areaHeight, params);
    const fitted = fitWithin(bitmap.width, bitmap.height, target.width, target.height);
    const image = resample(bitmap, fitted.width, fitted.height);
    const gray = toGrayscale(image.rgba, grayscale);
    return bucketImage(gray, image.width, image.height, layerCount, bucket);
  }, [bitmap, style, areaWidth, areaHeight, params, grayscale, layerCount, bucket]);

  const previewUrl = useMemo(
    () =>
      processed
        ? bucketPreviewUrl(processed.data, processed.width, processed.height, colors)
        : null,
    [processed, colors],
  );

  const onPickFile = async (picked: File) => {
    setLoadError(null);
    try {
      const decoded = await decodeFile(picked);
      setFile(picked);
      setBitmap(decoded);
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      setSourceUrl(URL.createObjectURL(picked));
    } catch (e) {
      setLoadError((e as Error).message);
    }
  };

  // Rendering the strokes is the expensive step, so it runs when the user
  // reaches the last step rather than on every parameter tweak.
  const render = useCallback(() => {
    if (!processed) return;
    setRendering(true);
    // Yield first so the spinner paints before the main thread blocks.
    setTimeout(() => {
      try {
        setRendered(renderStyle(style, processed, params));
      } finally {
        setRendering(false);
      }
    }, 0);
  }, [processed, style, params]);

  useEffect(() => {
    if (step === 2) render();
  }, [step, render]);

  const strokeCount = rendered?.reduce((sum, l) => sum + l.length, 0) ?? 0;

  const reset = () => {
    setStep(0);
    setFile(null);
    setBitmap(null);
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
    setLoadError(null);
    setRendered(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finish = () => {
    if (!rendered) return;
    onCreate({
      name: file ? file.name.replace(/\.[^.]+$/, '') : 'Photo',
      pageSize,
      marginMm,
      layers: rendered.map((strokes, i) => ({ color: colors[i], strokes })),
    });
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Photo processing</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
              Choose image…
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) onPickFile(picked);
                e.target.value = '';
              }}
            />
            {loadError && <Alert severity="error">{loadError}</Alert>}
            {bitmap && sourceUrl && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {file?.name} — {bitmap.width}×{bitmap.height}px
                </Typography>
                <Box
                  component="img"
                  src={sourceUrl}
                  alt="Source"
                  sx={{ maxWidth: '100%', maxHeight: 320, borderRadius: 1 }}
                />
              </>
            )}
          </Stack>
        )}

        {step === 1 && (
          <Stack direction="row" spacing={3}>
            <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Preset</InputLabel>
                <Select
                  label="Preset"
                  value={presetId}
                  onChange={(e) => applyPreset(e.target.value)}
                >
                  {PHOTO_PRESETS.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                {PHOTO_PRESETS.find((p) => p.id === presetId)?.description}
              </Typography>

              <FormControl size="small" fullWidth>
                <InputLabel>Grayscale</InputLabel>
                <Select
                  label="Grayscale"
                  value={grayscale}
                  onChange={(e) => setGrayscale(e.target.value as GrayscaleMethod)}
                >
                  {GRAYSCALE_METHODS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label} — {m.hint}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Bucketing</InputLabel>
                <Select
                  label="Bucketing"
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value as BucketMethod)}
                >
                  {BUCKET_METHODS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                {BUCKET_METHODS.find((m) => m.value === bucket)?.hint}
              </Typography>

              <Box>
                <Typography variant="body2" gutterBottom>
                  Layers (pens): {layerCount}
                </Typography>
                <Slider
                  size="small"
                  min={2}
                  max={8}
                  step={1}
                  marks
                  value={layerCount}
                  onChange={(_e, v) => setLayerCount(v as number)}
                />
              </Box>

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {colors.map((color, i) => (
                  <Box
                    // biome-ignore lint/suspicious/noArrayIndexKey: position is the pen's identity — index 0 is always the darkest tone
                    key={i}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const next = [...colors];
                        next[i] = e.target.value;
                        setPalette(next);
                      }}
                      style={{ width: 28, height: 24, border: 'none', background: 'none' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {i === 0 ? 'darkest' : i === layerCount - 1 ? 'lightest' : `#${i + 1}`}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>

            <Box sx={{ width: 300 }}>
              <Typography variant="overline" color="text.secondary">
                Bucketed preview
              </Typography>
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Bucketed preview"
                  sx={{
                    width: '100%',
                    imageRendering: 'pixelated',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Choose an image first.
                </Typography>
              )}
              {processed && (
                <Typography variant="caption" color="text.secondary">
                  Sampled at {processed.width}×{processed.height}
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        {step === 2 && (
          <Stack direction="row" spacing={3}>
            <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Style</InputLabel>
                <Select
                  label="Style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as PhotoStyle)}
                >
                  {(Object.keys(STYLE_LABELS) as PhotoStyle[]).map((s) => (
                    <MenuItem key={s} value={s}>
                      {STYLE_LABELS[s]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <PageSizePicker value={pageSize} onChange={setPageSize} />
              <TextField
                size="small"
                type="number"
                label="Margin (mm)"
                value={marginMm}
                onChange={(e) => setMarginMm(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                sx={{ width: 140 }}
              />

              {(style === 'horizontal' || style === 'diagonal') && (
                <Stack direction="row" spacing={1}>
                  <NumField
                    label="Line spacing (px)"
                    value={params.lineSpacing}
                    onChange={(v) => setParams({ ...params, lineSpacing: v })}
                  />
                  <NumField
                    label="Gap after run"
                    value={params.colinearGap}
                    onChange={(v) => setParams({ ...params, colinearGap: v })}
                  />
                </Stack>
              )}
              {style === 'dots' && (
                <NumField
                  label="Cell size (mm)"
                  value={params.boxSide}
                  onChange={(v) => setParams({ ...params, boxSide: v })}
                />
              )}
              {style === 'circles' && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <NumField
                    label="Sample (px)"
                    value={params.sampleLength}
                    onChange={(v) => setParams({ ...params, sampleLength: v })}
                  />
                  <NumField
                    label="Diameter (mm)"
                    value={params.circleDiameter}
                    step={0.1}
                    onChange={(v) => setParams({ ...params, circleDiameter: v })}
                  />
                  <NumField
                    label="Ring gap (mm)"
                    value={params.lineWidth}
                    step={0.05}
                    onChange={(v) => setParams({ ...params, lineWidth: v })}
                  />
                </Stack>
              )}

              <Button variant="outlined" onClick={render} disabled={rendering || !processed}>
                Re-render preview
              </Button>

              {rendered && (
                <Alert severity={strokeCount > 60_000 ? 'warning' : 'info'}>
                  <strong>{strokeCount.toLocaleString()}</strong> strokes across {rendered.length}{' '}
                  layers.
                  {strokeCount > 60_000 &&
                    ' That is a lot — the canvas will be sluggish and the plot will take hours. Increase line spacing or the gap after each run.'}
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {rendered.map((layer, i) => (
                      <Chip
                        key={colors[i] + String(i)}
                        size="small"
                        variant="outlined"
                        label={`${layer.length.toLocaleString()}`}
                        sx={{ borderColor: colors[i], color: colors[i] }}
                      />
                    ))}
                  </Box>
                </Alert>
              )}
            </Stack>

            <Box sx={{ width: 320 }}>
              <Typography variant="overline" color="text.secondary">
                Plot preview
              </Typography>
              {rendering ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 4 }}>
                  <CircularProgress size={18} /> <Typography variant="body2">Rendering…</Typography>
                </Box>
              ) : (
                <StrokePreview
                  layers={rendered}
                  colors={colors}
                  pageSize={pageSize}
                  marginMm={marginMm}
                />
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
        {step < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !bitmap}
          >
            Next
          </Button>
        ) : (
          <Button variant="contained" onClick={finish} disabled={!rendered || strokeCount === 0}>
            Create project
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const NumField = ({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) => (
  <TextField
    size="small"
    type="number"
    label={label}
    value={value}
    onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
    slotProps={{ htmlInput: { step, min: 0 } }}
    sx={{ width: 150 }}
  />
);

/**
 * Renders every stroke as SVG. Above a few thousand this gets heavy, so the
 * preview thins the set down — the real project keeps all of them.
 */
const PREVIEW_STROKE_LIMIT = 4000;

const StrokePreview = ({
  layers,
  colors,
  pageSize,
  marginMm,
}: {
  layers: LayerStrokes[] | null;
  colors: string[];
  pageSize: PageSize;
  marginMm: number;
}) => {
  if (!layers) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nothing rendered yet.
      </Typography>
    );
  }

  const total = layers.reduce((sum, l) => sum + l.length, 0);
  const stride = Math.max(1, Math.ceil(total / PREVIEW_STROKE_LIMIT));

  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Box
        component="svg"
        viewBox={`0 0 ${pageSize.width} ${pageSize.height}`}
        sx={{ width: '100%', height: 'auto', maxHeight: 400, display: 'block' }}
      >
        <title>Plot preview</title>
        <rect
          x={0}
          y={0}
          width={pageSize.width}
          height={pageSize.height}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeWidth={0.5}
        />
        <g transform={`translate(${marginMm} ${marginMm})`}>
          {layers.map((strokes, layerIndex) => (
            <g key={colors[layerIndex] + String(layerIndex)} stroke={colors[layerIndex]}>
              {strokes
                .filter((_s, i) => i % stride === 0)
                .map((stroke, i) => (
                  <polyline
                    // biome-ignore lint/suspicious/noArrayIndexKey: static render of a fixed list
                    key={i}
                    points={stroke.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    strokeWidth={0.3}
                  />
                ))}
            </g>
          ))}
        </g>
      </Box>
      {stride > 1 && (
        <Typography variant="caption" color="text.secondary">
          Showing 1 in {stride} strokes for speed — the project gets all {total.toLocaleString()}.
        </Typography>
      )}
    </Paper>
  );
};
