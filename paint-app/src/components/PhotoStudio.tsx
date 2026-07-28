import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoIcon from '@mui/icons-material/Photo';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PageSize } from '../pageSizes';
import {
  BUCKET_METHODS,
  type BucketMethod,
  DEFAULT_ADJUST,
  DEFAULT_PREPARE,
  GRAYSCALE_METHODS,
  type GrayscaleMethod,
  type LayerStrokes,
  PALETTE_PRESETS,
  PHOTO_PRESETS,
  type PhotoStyle,
  type PreparedImage,
  type PrepareParams,
  paletteFor,
  prepareImage,
  renderStyle,
  type StyleParams,
  targetResolution,
} from '../photo';
import { bucketPreviewUrl, decodeFile, fitWithin, resample } from '../photoDecode';
import { PageSizePicker } from './PageSizePicker';

export type PhotoResult = {
  name: string;
  pageSize: PageSize;
  marginMm: number;
  /** One entry per bucket, darkest first. Page-local mm. */
  layers: { color: string; strokes: LayerStrokes }[];
};

type Props = {
  onExit: () => void;
  onCreate: (result: PhotoResult) => void;
};

type TabKey = 'prepare' | 'style';

const STYLE_LABELS: Record<PhotoStyle, string> = {
  horizontal: 'Horizontal scan',
  diagonal: 'Diagonal lines',
  dots: 'Stipple dots',
  circles: 'Concentric circles',
};

const SIDEBAR_WIDTH = 380;
/** Long enough that dragging a slider doesn't re-render on every frame. */
const RENDER_DEBOUNCE_MS = 350;
/** Past this the plot is impractical and the canvas will crawl. */
const STROKE_WARN_THRESHOLD = 60_000;

/**
 * Full-page photo-to-plot workspace: controls on the left, a live preview of
 * whichever stage is being edited on the right. The two tabs are independent
 * rather than sequential — tone and shading are adjusted against each other,
 * so moving between them has to be free.
 */
export const PhotoStudio = ({ onExit, onCreate }: Props) => {
  const [tab, setTab] = useState<TabKey>('prepare');

  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Preparation: everything about the image itself.
  const [prepare, setPrepare] = useState<PrepareParams>(DEFAULT_PREPARE);
  // Per-ink colour overrides. Anything unset falls back to what the image
  // suggests, so changing the ink count never strands a stale palette.
  const [inkOverrides, setInkOverrides] = useState<Record<number, string>>({});

  // Shading: everything about how it lands on paper.
  const [presetId, setPresetId] = useState(PHOTO_PRESETS[0].id);
  const [style, setStyle] = useState<PhotoStyle>(PHOTO_PRESETS[0].style);
  const [params, setParams] = useState<StyleParams>(PHOTO_PRESETS[0].params);
  const [pageSize, setPageSize] = useState<PageSize>({ width: 210, height: 297 });
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
    setParams(preset.params);
  }, []);

  const patchPrepare = useCallback(
    (changes: Partial<PrepareParams>) => setPrepare((previous) => ({ ...previous, ...changes })),
    [],
  );

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  /** The reduced image at whatever resolution the chosen style needs. */
  const processed: PreparedImage | null = useMemo(() => {
    if (!bitmap) return null;
    const target = targetResolution(style, areaWidth, areaHeight, params);
    const fitted = fitWithin(bitmap.width, bitmap.height, target.width, target.height);
    const image = resample(bitmap, fitted.width, fitted.height);
    return prepareImage(image.rgba, image.width, image.height, prepare);
  }, [bitmap, style, areaWidth, areaHeight, params, prepare]);

  const colors = useMemo(() => {
    const base = processed?.suggestedPalette ?? paletteFor(['#000000'], prepare.colorCount);
    return base.map((color, i) => inkOverrides[i] ?? color);
  }, [processed, inkOverrides, prepare.colorCount]);

  const previewUrl = useMemo(
    () =>
      processed
        ? bucketPreviewUrl(processed.data, processed.width, processed.height, colors)
        : null,
    [processed, colors],
  );

  // Any change upstream invalidates the strokes immediately. Without this,
  // editing tone on the Prepare tab would leave the previous render in place
  // and "Create project" would happily commit strokes from the old settings.
  // biome-ignore lint/correctness/useExhaustiveDependencies: invalidate on input identity, not on reading them
  useEffect(() => {
    setRendered(null);
  }, [processed, style, params]);

  // Strokes are the expensive step, so they're only built while the Style tab
  // is open, and only once the knobs have settled.
  useEffect(() => {
    if (!processed || tab !== 'style') return;
    setRendering(true);
    const timer = setTimeout(() => {
      setRendered(renderStyle(style, processed, params));
      setRendering(false);
    }, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [processed, style, params, tab]);

  const loadImage = async (picked: File) => {
    setLoadError(null);
    try {
      const decoded = await decodeFile(picked);
      setFile(picked);
      setBitmap(decoded);
      setRendered(null);
      setSourceUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(picked);
      });
    } catch (e) {
      setLoadError((e as Error).message);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const picked = e.dataTransfer.files?.[0];
    if (picked) loadImage(picked);
  };

  const strokeCount = rendered?.reduce((sum, l) => sum + l.length, 0) ?? 0;

  const finish = () => {
    if (!rendered) return;
    onCreate({
      name: file ? file.name.replace(/\.[^.]+$/, '') : 'Photo',
      pageSize,
      marginMm,
      layers: rendered.map((strokes, i) => ({ color: colors[i], strokes })),
    });
  };

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        const picked = e.target.files?.[0];
        if (picked) loadImage(picked);
        e.target.value = '';
      }}
    />
  );

  // Nothing here is meaningful without a source image, so the whole workspace
  // is replaced by the picker until there is one.
  if (!bitmap) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <StudioHeader onExit={onExit} />
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}
        >
          <Paper
            variant="outlined"
            sx={{
              width: '100%',
              maxWidth: 560,
              p: 6,
              textAlign: 'center',
              borderStyle: 'dashed',
              borderWidth: 2,
              borderColor: dragging ? 'primary.main' : 'divider',
              bgcolor: dragging ? 'action.hover' : 'transparent',
            }}
          >
            <PhotoIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h6" sx={{ mt: 1 }}>
              Choose a photo to plot
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Drop an image here, or pick one from your computer. Everything else unlocks once an
              image is loaded.
            </Typography>
            <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
              Choose image…
            </Button>
            {loadError && (
              <Alert severity="error" sx={{ mt: 3, textAlign: 'left' }}>
                {loadError}
              </Alert>
            )}
          </Paper>
          {hiddenInput}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StudioHeader onExit={onExit} />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* ── Controls ── */}
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {/* The source image is the one thing every control below depends on,
              so it is set apart rather than reading as the first setting. */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              p: 2,
              alignItems: 'center',
              bgcolor: 'action.hover',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              component="img"
              src={sourceUrl ?? ''}
              alt=""
              sx={{
                width: 48,
                height: 48,
                objectFit: 'cover',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap title={file?.name} sx={{ fontWeight: 600 }}>
                {file?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {bitmap.width}×{bitmap.height}px
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              sx={{ flexShrink: 0 }}
              onClick={() => fileInputRef.current?.click()}
            >
              Change
            </Button>
          </Stack>
          {hiddenInput}

          <Tabs value={tab} onChange={(_e, v) => setTab(v as TabKey)} variant="fullWidth">
            <Tab value="prepare" label="Prepare Image" />
            <Tab value="style" label="Style" />
          </Tabs>
          <Divider />

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {tab === 'prepare' ? (
              <Stack spacing={2.5}>
                <Section title="Levels" onReset={() => patchPrepare(DEFAULT_ADJUST)}>
                  <LabelledSlider
                    label="Black point"
                    value={prepare.blackPoint}
                    min={0}
                    max={254}
                    onChange={(v) =>
                      patchPrepare({ blackPoint: Math.min(v, prepare.whitePoint - 1) })
                    }
                  />
                  <LabelledSlider
                    label="Gray point"
                    value={prepare.gamma}
                    min={0.1}
                    max={3}
                    step={0.05}
                    format={(v) => v.toFixed(2)}
                    onChange={(v) => patchPrepare({ gamma: v })}
                  />
                  <LabelledSlider
                    label="White point"
                    value={prepare.whitePoint}
                    min={1}
                    max={255}
                    onChange={(v) =>
                      patchPrepare({ whitePoint: Math.max(v, prepare.blackPoint + 1) })
                    }
                  />
                  <LabelledSlider
                    label="Contrast"
                    value={prepare.contrast}
                    min={-100}
                    max={100}
                    onChange={(v) => patchPrepare({ contrast: v })}
                  />
                  {prepare.grayscale && prepare.bucketMethod === 'even-pixels' && (
                    <Alert severity="info" sx={{ py: 0 }}>
                      Even pixel count splits by rank, so a tone curve on its own can't move a pixel
                      between inks — the gray point will do nothing here. Only clipping (black/white
                      points, or hard contrast) changes the split. Switch to Even histogram to make
                      these fully effective.
                    </Alert>
                  )}
                </Section>

                <Divider />

                <Section title="Color">
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={prepare.grayscale}
                        onChange={(e) => patchPrepare({ grayscale: e.target.checked })}
                      />
                    }
                    label={<Typography variant="body2">Convert to grayscale</Typography>}
                  />

                  {prepare.grayscale ? (
                    <>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Method</InputLabel>
                        <Select
                          label="Method"
                          value={prepare.grayscaleMethod}
                          onChange={(e) =>
                            patchPrepare({ grayscaleMethod: e.target.value as GrayscaleMethod })
                          }
                        >
                          {GRAYSCALE_METHODS.map((m) => (
                            <MenuItem key={m.value} value={m.value}>
                              {m.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography variant="caption" color="text.secondary">
                        {GRAYSCALE_METHODS.find((m) => m.value === prepare.grayscaleMethod)?.hint}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Colors are reduced with k-means clustering, which picks the inks that best
                      represent the image.
                    </Typography>
                  )}
                </Section>

                <Divider />

                <Section title={`Reduce to ${prepare.colorCount} inks`}>
                  <Slider
                    size="small"
                    min={2}
                    max={8}
                    step={1}
                    marks
                    value={prepare.colorCount}
                    onChange={(_e, v) => patchPrepare({ colorCount: v as number })}
                  />
                  {prepare.grayscale && (
                    <>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Split tones by</InputLabel>
                        <Select
                          label="Split tones by"
                          value={prepare.bucketMethod}
                          onChange={(e) =>
                            patchPrepare({ bucketMethod: e.target.value as BucketMethod })
                          }
                        >
                          {BUCKET_METHODS.map((m) => (
                            <MenuItem key={m.value} value={m.value}>
                              {m.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography variant="caption" color="text.secondary">
                        {BUCKET_METHODS.find((m) => m.value === prepare.bucketMethod)?.hint}
                      </Typography>
                    </>
                  )}
                </Section>

                <Divider />

                <Section
                  title="Ink colors"
                  onReset={
                    Object.keys(inkOverrides).length > 0 ? () => setInkOverrides({}) : undefined
                  }
                >
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {colors.map((color, i) => (
                      <Stack
                        // biome-ignore lint/suspicious/noArrayIndexKey: position is the ink's identity — index 0 is always the darkest
                        key={i}
                        sx={{ alignItems: 'center' }}
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) =>
                            setInkOverrides((previous) => ({ ...previous, [i]: e.target.value }))
                          }
                          style={{ width: 34, height: 26, border: 'none', background: 'none' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {i === 0 ? 'dark' : i === colors.length - 1 ? 'light' : i + 1}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {PALETTE_PRESETS.map((preset) => (
                      <Chip
                        key={preset.name}
                        size="small"
                        variant="outlined"
                        label={preset.name}
                        onClick={() =>
                          setInkOverrides(
                            Object.fromEntries(
                              paletteFor(preset.colors, colors.length).map((c, i) => [i, c]),
                            ),
                          )
                        }
                      />
                    ))}
                  </Stack>
                </Section>
              </Stack>
            ) : (
              <Stack spacing={2}>
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

                <Divider />

                <PageSizePicker value={pageSize} onChange={setPageSize} minWidth={0} />
                <NumField
                  label="Margin (mm)"
                  value={marginMm}
                  onChange={(v) => setMarginMm(Math.max(0, v))}
                />

                <Divider />

                {(style === 'horizontal' || style === 'diagonal') && (
                  <>
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
                  </>
                )}
                {style === 'dots' && (
                  <NumField
                    label="Cell size (mm)"
                    value={params.boxSide}
                    onChange={(v) => setParams({ ...params, boxSide: v })}
                  />
                )}
                {style === 'circles' && (
                  <>
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
                  </>
                )}
              </Stack>
            )}
          </Box>

          {/* ── Result summary + commit ── */}
          <Divider />
          <Box sx={{ p: 2 }}>
            {rendered && !rendering && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2">
                  <strong>{strokeCount.toLocaleString()}</strong> strokes across {rendered.length}{' '}
                  layers
                </Typography>
                <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {rendered.map((layer, i) => (
                    <Chip
                      // biome-ignore lint/suspicious/noArrayIndexKey: one chip per pen, in fixed tonal order
                      key={i}
                      size="small"
                      variant="outlined"
                      label={layer.length.toLocaleString()}
                      sx={{ borderColor: colors[i], color: colors[i] }}
                    />
                  ))}
                </Stack>
                {strokeCount > STROKE_WARN_THRESHOLD && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    That's a lot of strokes — the canvas will be sluggish and the plot will take
                    hours. Raise the line spacing or the gap after each run.
                  </Alert>
                )}
              </Box>
            )}
            <Button
              fullWidth
              variant="contained"
              onClick={finish}
              disabled={!rendered || rendering || strokeCount === 0}
            >
              Create project
            </Button>
            {!rendered && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1, textAlign: 'center' }}
              >
                Open the Style tab to generate strokes.
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Preview ── */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            overflow: 'auto',
            bgcolor: 'action.hover',
          }}
        >
          {tab === 'prepare' ? (
            previewUrl && (
              <Stack spacing={1} sx={{ alignItems: 'center', maxHeight: '100%' }}>
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Bucketed preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 'calc(100vh - 220px)',
                    imageRendering: 'pixelated',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    boxShadow: 3,
                  }}
                />
                {processed && (
                  <Typography variant="caption" color="text.secondary">
                    Sampled at {processed.width}×{processed.height} for the {STYLE_LABELS[style]}{' '}
                    style
                  </Typography>
                )}
              </Stack>
            )
          ) : rendering ? (
            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Generating strokes…
              </Typography>
            </Stack>
          ) : (
            <StrokePreview
              layers={rendered}
              colors={colors}
              pageSize={pageSize}
              marginMm={marginMm}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

const StudioHeader = ({ onExit }: { onExit: () => void }) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{
      px: 2,
      py: 1,
      alignItems: 'center',
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Button size="small" startIcon={<ArrowBackIcon />} onClick={onExit}>
      Back
    </Button>
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
      Photo processing
    </Typography>
  </Stack>
);

/** A titled group of controls, with an optional reset affordance. */
const Section = ({
  title,
  onReset,
  children,
}: {
  title: string;
  onReset?: () => void;
  children: React.ReactNode;
}) => (
  <Box>
    <Stack direction="row" sx={{ alignItems: 'center', mb: 0.5 }}>
      <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>
        {title}
      </Typography>
      {onReset && (
        <Button size="small" onClick={onReset}>
          Reset
        </Button>
      )}
    </Stack>
    <Stack spacing={1}>{children}</Stack>
  </Box>
);

const LabelledSlider = ({
  label,
  value,
  min,
  max,
  step = 1,
  format = (v: number) => String(Math.round(v)),
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) => (
  <Box>
    <Stack direction="row" sx={{ alignItems: 'baseline' }}>
      <Typography variant="body2" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {format(value)}
      </Typography>
    </Stack>
    <Slider
      size="small"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(_e, v) => onChange(v as number)}
    />
  </Box>
);

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
    fullWidth
    type="number"
    label={label}
    value={value}
    onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)}
    slotProps={{ htmlInput: { step, min: 0 } }}
  />
);

/**
 * Every stroke as SVG. Past a few thousand this gets heavy to lay out, so the
 * preview thins the set — the created project always keeps all of them.
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
        Adjust the knobs to generate a preview.
      </Typography>
    );
  }

  const total = layers.reduce((sum, l) => sum + l.length, 0);
  const stride = Math.max(1, Math.ceil(total / PREVIEW_STROKE_LIMIT));

  return (
    <Stack spacing={1} sx={{ alignItems: 'center', maxHeight: '100%' }}>
      <Box
        component="svg"
        viewBox={`0 0 ${pageSize.width} ${pageSize.height}`}
        sx={{
          maxHeight: 'calc(100vh - 220px)',
          maxWidth: '100%',
          height: `${pageSize.height * 3}px`,
          bgcolor: 'background.paper',
          boxShadow: 3,
          borderRadius: 1,
        }}
      >
        <title>Plot preview</title>
        <g transform={`translate(${marginMm} ${marginMm})`}>
          {layers.map((strokes, layerIndex) => (
            <g
              // biome-ignore lint/suspicious/noArrayIndexKey: one group per pen, in fixed tonal order
              key={layerIndex}
              stroke={colors[layerIndex]}
            >
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
      <Typography variant="caption" color="text.secondary">
        {pageSize.width}×{pageSize.height}mm
        {stride > 1 &&
          ` · showing 1 in ${stride} strokes for speed, project gets all ${total.toLocaleString()}`}
      </Typography>
    </Stack>
  );
};
