import type { Point } from './types';

/**
 * Port of `gcode2dplotterart/experimental_photo_utils` plus the buckets→strokes
 * step the Python side never had (it lived inline in each sketch under
 * Plotter-Explorations/bought-a-3d-printer).
 *
 * The pipeline is: decode → resize to fit → grayscale → bucket → render.
 * Everything here is pure and works on plain arrays; decoding and resizing
 * need a canvas and live in `photoDecode.ts`.
 */

// ─── Grayscale ───────────────────────────────────────────────────────────

export type GrayscaleMethod = 'average' | 'luminosity' | 'lightness';

export const GRAYSCALE_METHODS: { value: GrayscaleMethod; label: string; hint: string }[] = [
  { value: 'average', label: 'Average', hint: '(R + G + B) / 3' },
  {
    value: 'luminosity',
    label: 'Luminosity',
    hint: '0.21R + 0.72G + 0.07B — matches perceived brightness',
  },
  { value: 'lightness', label: 'Lightness', hint: '(max + min) / 2' },
];

/** RGBA bytes → one 0..255 float per pixel. */
export const toGrayscale = (rgba: Uint8ClampedArray, method: GrayscaleMethod): Float32Array => {
  const out = new Float32Array(rgba.length / 4);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    if (method === 'average') {
      out[p] = (r + g + b) / 3;
    } else if (method === 'luminosity') {
      out[p] = r * 0.21 + g * 0.72 + b * 0.07;
    } else {
      out[p] = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    }
  }
  return out;
};

// ─── Bucketing ───────────────────────────────────────────────────────────

export type BucketMethod = 'even-pixels' | 'even-histogram';

export const BUCKET_METHODS: { value: BucketMethod; label: string; hint: string }[] = [
  {
    value: 'even-pixels',
    label: 'Even pixel count',
    hint: 'Each layer covers roughly the same number of pixels — even ink per pen',
  },
  {
    value: 'even-histogram',
    label: 'Even histogram',
    hint: 'Each layer covers an equal slice of the 0–255 range — truer tones, uneven ink',
  },
];

export type BucketedImage = {
  width: number;
  height: number;
  /** Bucket index per pixel, row-major. 0 is darkest. */
  data: Uint8Array;
  layerCount: number;
};

const histogram256 = (gray: Float32Array): Int32Array => {
  const hist = new Int32Array(256);
  for (const value of gray) {
    const v = value < 0 ? 0 : value > 255 ? 255 : Math.floor(value);
    hist[v]++;
  }
  return hist;
};

/**
 * `np.digitize(x, bins)` with ascending bins: the number of bins <= x, which
 * is the count of thresholds the value has passed.
 */
const digitize = (value: number, bins: number[]): number => {
  let low = 0;
  let high = bins.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (bins[mid] <= value) low = mid + 1;
    else high = mid;
  }
  return low;
};

/** Thresholds that split the histogram into equal-population slices. */
const evenPixelBins = (gray: Float32Array, layerCount: number): number[] => {
  const hist = histogram256(gray);
  const target = gray.length / layerCount;
  const bins: number[] = [];
  let count = 0;
  for (let value = 0; value < 256; value++) {
    if (count >= target && bins.length < layerCount - 1) {
      count = 0;
      bins.push(value);
    }
    count += hist[value];
  }
  return bins;
};

/** Thresholds at equal intervals across the 0..255 range. */
const evenHistogramBins = (layerCount: number): number[] => {
  const bins: number[] = [];
  const segment = 256 / layerCount;
  for (let i = 1; i < layerCount; i++) bins.push(Math.round(i * segment));
  return bins;
};

export const bucketImage = (
  gray: Float32Array,
  width: number,
  height: number,
  layerCount: number,
  method: BucketMethod,
): BucketedImage => {
  const count = Math.max(2, Math.floor(layerCount));
  const bins = method === 'even-pixels' ? evenPixelBins(gray, count) : evenHistogramBins(count);
  const data = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const bucket = digitize(gray[i], bins);
    data[i] = bucket > count - 1 ? count - 1 : bucket;
  }
  return { width, height, data, layerCount: count };
};

export const bucketAt = (image: BucketedImage, x: number, y: number): number =>
  image.data[y * image.width + x];

// ─── Styles ──────────────────────────────────────────────────────────────

export type PhotoStyle = 'horizontal' | 'diagonal' | 'dots' | 'circles';

export type StyleParams = {
  /** Rows/diagonals to skip between drawn lines. 1 draws every one. */
  lineSpacing: number;
  /** Pixels skipped after each emitted segment, thinning dense areas. */
  colinearGap: number;
  /** Dots: side of the cell each source pixel expands into, in mm. */
  boxSide: number;
  /** Circles: source pixels averaged per output circle. */
  sampleLength: number;
  /** Circles: diameter of the largest circle, in mm. */
  circleDiameter: number;
  /** Circles: spacing between concentric rings, in mm. */
  lineWidth: number;
};

export const DEFAULT_STYLE_PARAMS: StyleParams = {
  lineSpacing: 3,
  colinearGap: 1,
  boxSide: 2,
  sampleLength: 10,
  circleDiameter: 2,
  lineWidth: 0.4,
};

/**
 * Strokes for one layer, in page-local mm. Index in the outer array is the
 * bucket, so layer 0 is the darkest tone.
 */
export type LayerStrokes = Point[][];

const emptyLayers = (count: number): LayerStrokes[] =>
  Array.from({ length: count }, () => [] as LayerStrokes);

/**
 * Walk a path of pixels, emitting one segment per run of constant bucket.
 * Shared by the horizontal and diagonal styles — the only difference between
 * them is the path.
 */
const emitRuns = (
  path: { x: number; y: number }[],
  image: BucketedImage,
  layers: LayerStrokes[],
  colinearGap: number,
  toMm: (p: { x: number; y: number }) => Point,
) => {
  if (path.length < 2) return;
  let start = path[0];
  let bucket = bucketAt(image, start.x, start.y);
  let index = 0;

  while (index < path.length) {
    const point = path[index];
    if (bucketAt(image, point.x, point.y) === bucket) {
      index++;
      continue;
    }
    layers[bucket].push([toMm(start), toMm(point)]);
    // Skipping ahead after a run is what thins out busy regions; a gap of 1
    // keeps every run, which is the faithful "draw everything" setting.
    index += Math.max(1, colinearGap);
    if (index >= path.length) return;
    start = path[index];
    bucket = bucketAt(image, start.x, start.y);
  }
  // Close the final run against the end of the path.
  const last = path[path.length - 1];
  if (last !== start) layers[bucket].push([toMm(start), toMm(last)]);
};

const horizontalStrokes = (image: BucketedImage, params: StyleParams): LayerStrokes[] => {
  const layers = emptyLayers(image.layerCount);
  const step = Math.max(1, Math.floor(params.lineSpacing));
  for (let y = 0; y < image.height; y += step) {
    const path = Array.from({ length: image.width }, (_, x) => ({ x, y }));
    emitRuns(path, image, layers, params.colinearGap, (p) => ({ x: p.x, y: p.y }));
  }
  return layers;
};

/**
 * Diagonals running up-and-right, seeded down the left edge and then along the
 * bottom, so the whole image is covered exactly once.
 */
const diagonalStrokes = (image: BucketedImage, params: StyleParams): LayerStrokes[] => {
  const layers = emptyLayers(image.layerCount);
  const step = Math.max(1, Math.floor(params.lineSpacing));

  const buildPath = (startX: number, startY: number) => {
    const path: { x: number; y: number }[] = [];
    let x = startX;
    let y = startY;
    while (x >= 0 && x < image.width && y >= 0 && y < image.height) {
      path.push({ x, y });
      x++;
      y--;
    }
    return path;
  };

  let lastY = 0;
  for (let y = 0; y < image.height; y += step) {
    emitRuns(buildPath(0, y), image, layers, params.colinearGap, (p) => ({ x: p.x, y: p.y }));
    lastY = y;
  }
  // Pick up along the bottom edge where the left-edge sweep left off, so the
  // spacing stays even across the seam.
  const delta = Math.max(0, Math.abs(lastY - image.height) - 1);
  for (let x = delta; x < image.width; x += step) {
    emitRuns(buildPath(x, image.height - 1), image, layers, params.colinearGap, (p) => ({
      x: p.x,
      y: p.y,
    }));
  }
  return layers;
};

/**
 * Each source pixel becomes a `boxSide` mm cell; the darker the pixel, the
 * more sub-cells get a dot. Positions are shuffled so the fill reads as
 * stipple rather than a grid.
 */
const dotStrokes = (
  image: BucketedImage,
  params: StyleParams,
  random: () => number,
): LayerStrokes[] => {
  const layers = emptyLayers(image.layerCount);
  const side = Math.max(1, Math.floor(params.boxSide));
  const perCell = side * side;
  // A stroke needs two points, so a "dot" is the shortest segment that still
  // puts ink down — the equivalent of the Python API's add_point.
  const DOT_MM = 0.2;

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const bucket = bucketAt(image, x, y);
      // Bucket 0 is darkest and should be the most filled.
      const fill = Math.min(perCell, Math.round(perCell * (1 - bucket / (image.layerCount - 1))));
      if (fill <= 0) continue;

      const cells: Point[] = [];
      for (let r = 0; r < side; r++) {
        for (let c = 0; c < side; c++) cells.push({ x: x * side + c, y: y * side + r });
      }
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      for (const cell of cells.slice(0, fill)) {
        layers[bucket].push([cell, { x: cell.x + DOT_MM, y: cell.y }]);
      }
    }
  }
  return layers;
};

/**
 * Blocks of `sampleLength` pixels are averaged into one cell, drawn as
 * concentric rings — darker cells get a bigger outer radius, so tone reads as
 * ink density.
 */
const circleStrokes = (image: BucketedImage, params: StyleParams): LayerStrokes[] => {
  const layers = emptyLayers(image.layerCount);
  const sample = Math.max(1, Math.floor(params.sampleLength));
  const diameter = Math.max(0.1, params.circleDiameter);
  const ringGap = Math.max(0.05, params.lineWidth);
  const SEGMENTS = 24;

  for (let row = 0; row + sample <= image.height; row += sample) {
    for (let col = 0; col + sample <= image.width; col += sample) {
      let total = 0;
      for (let i = row; i < row + sample; i++) {
        for (let j = col; j < col + sample; j++) total += bucketAt(image, j, i);
      }
      const bucket = Math.round(total / (sample * sample));
      // Darkest bucket → widest circle.
      const scale = 1 - bucket / Math.max(1, image.layerCount - 1);
      const outer = (diameter / 2) * (0.1 + 0.8 * scale);
      if (outer <= 0) continue;

      // Centres are inset by one radius so the leftmost and topmost rings sit
      // inside the plot area. The original sketch centred on the boundary and
      // relied on the plotter clipping whatever fell outside.
      const cx = diameter / 2 + (col / sample) * diameter;
      const cy = diameter / 2 + (row / sample) * diameter;
      for (let r = outer; r > 0; r -= ringGap) {
        const ring: Point[] = [];
        for (let s = 0; s <= SEGMENTS; s++) {
          const angle = (s / SEGMENTS) * Math.PI * 2;
          ring.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        layers[bucket].push(ring);
      }
    }
  }
  return layers;
};

/**
 * Source-image resolution a style needs, given the target area in mm. The
 * styles differ in how many source pixels back one millimetre of output.
 */
export const targetResolution = (
  style: PhotoStyle,
  areaWidthMm: number,
  areaHeightMm: number,
  params: StyleParams,
): { width: number; height: number } => {
  if (style === 'dots') {
    const side = Math.max(1, Math.floor(params.boxSide));
    return {
      width: Math.max(1, Math.floor(areaWidthMm / side)),
      height: Math.max(1, Math.floor(areaHeightMm / side)),
    };
  }
  if (style === 'circles') {
    const sample = Math.max(1, Math.floor(params.sampleLength));
    const diameter = Math.max(0.1, params.circleDiameter);
    return {
      width: Math.max(1, Math.floor((areaWidthMm / diameter) * sample)),
      height: Math.max(1, Math.floor((areaHeightMm / diameter) * sample)),
    };
  }
  // One source pixel per millimetre.
  return {
    width: Math.max(1, Math.floor(areaWidthMm)),
    height: Math.max(1, Math.floor(areaHeightMm)),
  };
};

export const renderStyle = (
  style: PhotoStyle,
  image: BucketedImage,
  params: StyleParams,
  random: () => number = Math.random,
): LayerStrokes[] => {
  switch (style) {
    case 'horizontal':
      return horizontalStrokes(image, params);
    case 'diagonal':
      return diagonalStrokes(image, params);
    case 'dots':
      return dotStrokes(image, params, random);
    case 'circles':
      return circleStrokes(image, params);
  }
};

// ─── Presets ─────────────────────────────────────────────────────────────

export type PhotoPreset = {
  id: string;
  name: string;
  description: string;
  /** Which sketch in Plotter-Explorations/bought-a-3d-printer this came from. */
  source: string;
  style: PhotoStyle;
  grayscale: GrayscaleMethod;
  bucket: BucketMethod;
  layerCount: number;
  params: StyleParams;
  palette: string[];
};

/** Palettes lifted from the original sketches. */
const CMYK = ['#000000', '#00b7eb', '#ff00ff', '#ffff00'];
const CMYK_GREY = ['#a9a9a9', '#00b7eb', '#ff00ff', '#ffff00'];
const DOGS = ['#8e3392', '#e76500', '#e0c200'];
const RED = ['#dd3031'];

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: 'diagonal-cmyk',
    name: 'Diagonal lines (CMYK)',
    description:
      'Diagonal sweeps broken into runs of equal tone. Four pens, each covering about the same amount of paper.',
    source: 'diag_lines_attempt_2/process_photo_even_pixel_buckets.py',
    style: 'diagonal',
    grayscale: 'luminosity',
    bucket: 'even-pixels',
    layerCount: 4,
    params: { ...DEFAULT_STYLE_PARAMS, lineSpacing: 3, colinearGap: 1 },
    palette: CMYK_GREY,
  },
  {
    id: 'diagonal-original',
    name: 'Diagonal lines (sparse)',
    description: 'The original, thinner pass — wider gaps after each run leave more paper showing.',
    source: 'diag_lines_original/diag_lines.py',
    style: 'diagonal',
    grayscale: 'luminosity',
    bucket: 'even-histogram',
    layerCount: 4,
    params: { ...DEFAULT_STYLE_PARAMS, lineSpacing: 3, colinearGap: 3 },
    palette: CMYK,
  },
  {
    id: 'horizontal-dogs',
    name: 'Horizontal scan',
    description:
      'Every row scanned left to right, split wherever the tone changes. The simplest and fastest to plot.',
    source: 'dogs/main.py',
    style: 'horizontal',
    grayscale: 'average',
    bucket: 'even-histogram',
    layerCount: 3,
    params: { ...DEFAULT_STYLE_PARAMS, lineSpacing: 1, colinearGap: 1 },
    palette: DOGS,
  },
  {
    id: 'dots-stipple',
    name: 'Stipple dots',
    description:
      'Each pixel becomes a small cell filled with a random scatter of dots — more dots where the image is darker.',
    source: 'dots/main.py',
    style: 'dots',
    grayscale: 'average',
    bucket: 'even-histogram',
    layerCount: 5,
    params: { ...DEFAULT_STYLE_PARAMS, boxSide: 2 },
    palette: ['#000000'],
  },
  {
    id: 'circles-red',
    name: 'Concentric circles',
    description:
      'Blocks averaged into a grid of filled circles, sized by tone. One pen; slow but striking.',
    source: 'circles/main.py',
    style: 'circles',
    grayscale: 'average',
    bucket: 'even-histogram',
    layerCount: 5,
    params: { ...DEFAULT_STYLE_PARAMS, sampleLength: 10, circleDiameter: 2, lineWidth: 0.4 },
    palette: RED,
  },
];

/** Repeat the preset palette out to `count` pens when it is shorter. */
export const paletteFor = (palette: string[], count: number): string[] =>
  Array.from({ length: count }, (_, i) => palette[i % palette.length] ?? '#000000');
