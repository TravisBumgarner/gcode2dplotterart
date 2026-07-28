import type { Point } from './types';

/**
 * Port of `gcode2dplotterart/experimental_photo_utils` plus the buckets→strokes
 * step the Python side never had (it lived inline in each sketch under
 * Plotter-Explorations/bought-a-3d-printer).
 *
 * The pipeline is: decode → resize to fit → adjust → reduce to N inks →
 * render strokes. Everything here is pure and works on plain arrays; decoding
 * and resizing need a canvas and live in `photoDecode.ts`.
 *
 * "Adjust" and "reduce" are about the image alone and know nothing about how
 * it will be shaded; the styles below only ever see ink indices.
 */

// ─── Adjustments ─────────────────────────────────────────────────────────

export type LevelsParams = {
  /** Input value that becomes pure black, 0..254. */
  blackPoint: number;
  /** Input value that becomes pure white, 1..255. */
  whitePoint: number;
  /** Midtone bias. 1 is neutral; below 1 darkens, above 1 lightens. */
  gamma: number;
};

export type AdjustParams = LevelsParams & {
  /** -100 (flat) .. 100 (harsh). 0 leaves the image alone. */
  contrast: number;
};

export const DEFAULT_ADJUST: AdjustParams = {
  blackPoint: 0,
  whitePoint: 255,
  gamma: 1,
  contrast: 0,
};

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * Build a 256-entry lookup table for levels + contrast, so the per-pixel work
 * is a single array read no matter how many pixels there are.
 */
export const buildAdjustLut = (params: AdjustParams): Uint8ClampedArray => {
  const lut = new Uint8ClampedArray(256);
  const black = Math.min(params.blackPoint, 254);
  const white = Math.max(params.whitePoint, black + 1);
  const gamma = Math.max(0.01, params.gamma);
  // Standard contrast factor: maps -100..100 onto a slope through mid-grey.
  const c = Math.max(-255, Math.min(255, (params.contrast / 100) * 255));
  const factor = (259 * (c + 255)) / (255 * (259 - c));

  for (let v = 0; v < 256; v++) {
    let t = (v - black) / (white - black);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    let out = 255 * t ** (1 / gamma);
    out = factor * (out - 128) + 128;
    lut[v] = clamp255(out);
  }
  return lut;
};

/** Apply a channel LUT to RGB, leaving alpha alone. */
export const applyLut = (rgba: Uint8ClampedArray, lut: Uint8ClampedArray): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    out[i] = lut[rgba[i]];
    out[i + 1] = lut[rgba[i + 1]];
    out[i + 2] = lut[rgba[i + 2]];
    out[i + 3] = rgba[i + 3];
  }
  return out;
};

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

// ─── Colour reduction ────────────────────────────────────────────────────

/** Deterministic RNG so a re-render never reshuffles the palette. */
const seededRandom = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

/** Perceived brightness, used to order inks darkest-first. */
const luminance = (r: number, g: number, b: number) => 0.21 * r + 0.72 * g + 0.07 * b;

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(clamp255(v)).toString(16).padStart(2, '0')).join('')}`;

/** Above this, centroids are fitted on a sample — the result is the same. */
const KMEANS_SAMPLE = 20_000;
const KMEANS_ITERATIONS = 12;

/**
 * K-means colour quantization — the step the Python README listed but never
 * implemented. Returns one ink index per pixel plus the centroid colours,
 * ordered darkest to lightest so the styles' "index 0 is the heaviest ink"
 * assumption holds for colour images too.
 */
export const quantizeColors = (
  rgba: Uint8ClampedArray,
  colorCount: number,
): { data: Uint8Array; palette: string[] } => {
  const pixelCount = rgba.length / 4;
  const k = Math.max(2, Math.min(colorCount, pixelCount));
  const random = seededRandom(0x5eed);

  const stride = Math.max(1, Math.floor(pixelCount / KMEANS_SAMPLE));
  const sample: number[] = [];
  for (let p = 0; p < pixelCount; p += stride) sample.push(p * 4);

  // k-means++ seeding: spread the initial centroids out, which converges far
  // more reliably than picking at random.
  const centroids: number[][] = [];
  const firstIndex = sample[Math.floor(random() * sample.length)];
  centroids.push([rgba[firstIndex], rgba[firstIndex + 1], rgba[firstIndex + 2]]);
  while (centroids.length < k) {
    const distances = sample.map((i) => {
      let best = Number.POSITIVE_INFINITY;
      for (const c of centroids) {
        const d = (rgba[i] - c[0]) ** 2 + (rgba[i + 1] - c[1]) ** 2 + (rgba[i + 2] - c[2]) ** 2;
        if (d < best) best = d;
      }
      return best;
    });
    const total = distances.reduce((sum, d) => sum + d, 0);
    let target = random() * total;
    let chosen = sample[sample.length - 1];
    for (let s = 0; s < sample.length; s++) {
      target -= distances[s];
      if (target <= 0) {
        chosen = sample[s];
        break;
      }
    }
    centroids.push([rgba[chosen], rgba[chosen + 1], rgba[chosen + 2]]);
  }

  const nearest = (r: number, g: number, b: number) => {
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let c = 0; c < centroids.length; c++) {
      const d =
        (r - centroids[c][0]) ** 2 + (g - centroids[c][1]) ** 2 + (b - centroids[c][2]) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = c;
      }
    }
    return best;
  };

  for (let iteration = 0; iteration < KMEANS_ITERATIONS; iteration++) {
    const sums = centroids.map(() => [0, 0, 0, 0]);
    for (const i of sample) {
      const c = nearest(rgba[i], rgba[i + 1], rgba[i + 2]);
      sums[c][0] += rgba[i];
      sums[c][1] += rgba[i + 1];
      sums[c][2] += rgba[i + 2];
      sums[c][3]++;
    }
    let moved = false;
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c][3] === 0) continue; // Keep an empty cluster where it is.
      const next = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
      if (next.some((v, axis) => Math.abs(v - centroids[c][axis]) > 0.5)) moved = true;
      centroids[c] = next;
    }
    if (!moved) break;
  }

  // Darkest first, so ink 0 is the heaviest everywhere in the app.
  const order = centroids
    .map((c, index) => ({ index, lum: luminance(c[0], c[1], c[2]) }))
    .sort((a, b) => a.lum - b.lum);
  const remap = new Uint8Array(centroids.length);
  order.forEach((entry, position) => {
    remap[entry.index] = position;
  });

  const data = new Uint8Array(pixelCount);
  for (let p = 0; p < pixelCount; p++) {
    const i = p * 4;
    data[p] = remap[nearest(rgba[i], rgba[i + 1], rgba[i + 2])];
  }

  return {
    data,
    palette: order.map(({ index }) =>
      toHex(centroids[index][0], centroids[index][1], centroids[index][2]),
    ),
  };
};

// ─── Prepare ─────────────────────────────────────────────────────────────

export type PrepareParams = AdjustParams & {
  /** Off keeps the source colours and reduces them with k-means instead. */
  grayscale: boolean;
  grayscaleMethod: GrayscaleMethod;
  /** How many inks the image is reduced to. */
  colorCount: number;
  /** Grayscale only — colour images are split by k-means. */
  bucketMethod: BucketMethod;
};

export const DEFAULT_PREPARE: PrepareParams = {
  ...DEFAULT_ADJUST,
  grayscale: true,
  grayscaleMethod: 'luminosity',
  colorCount: 4,
  bucketMethod: 'even-pixels',
};

export type PreparedImage = BucketedImage & {
  /**
   * Colour per ink as the image itself suggests: a black-to-white ramp for
   * grayscale, the k-means centroids for colour. The UI may override these.
   */
  suggestedPalette: string[];
};

/** Evenly spaced greys, darkest first. */
const grayRamp = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => {
    const v = Math.round((i / Math.max(1, count - 1)) * 255);
    return toHex(v, v, v);
  });

/**
 * Everything between a decoded image and a set of ink indices: levels,
 * contrast, then reduction to `colorCount` inks.
 */
export const prepareImage = (
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  params: PrepareParams,
): PreparedImage => {
  const adjusted = applyLut(rgba, buildAdjustLut(params));
  const count = Math.max(2, Math.floor(params.colorCount));

  if (params.grayscale) {
    const gray = toGrayscale(adjusted, params.grayscaleMethod);
    const bucketed = bucketImage(gray, width, height, count, params.bucketMethod);
    return { ...bucketed, suggestedPalette: grayRamp(count) };
  }

  const { data, palette } = quantizeColors(adjusted, count);
  return { width, height, data, layerCount: count, suggestedPalette: palette };
};

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

/**
 * A shading preset — style and its parameters only. Presets deliberately say
 * nothing about tone, colour count, or pen colours: those belong to preparing
 * the image and are the user's to set once, independent of how it's shaded.
 */
export type PhotoPreset = {
  id: string;
  name: string;
  description: string;
  /** Which sketch in Plotter-Explorations/bought-a-3d-printer this came from. */
  source: string;
  style: PhotoStyle;
  params: StyleParams;
};

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: 'diagonal-dense',
    name: 'Diagonal lines (dense)',
    description:
      'Diagonal sweeps broken into runs of equal tone, keeping every run. The heaviest coverage.',
    source: 'diag_lines_attempt_2/process_photo_even_pixel_buckets.py',
    style: 'diagonal',
    params: { ...DEFAULT_STYLE_PARAMS, lineSpacing: 3, colinearGap: 1 },
  },
  {
    id: 'diagonal-sparse',
    name: 'Diagonal lines (sparse)',
    description: 'The original, thinner pass — wider gaps after each run leave more paper showing.',
    source: 'diag_lines_original/diag_lines.py',
    style: 'diagonal',
    params: { ...DEFAULT_STYLE_PARAMS, lineSpacing: 3, colinearGap: 3 },
  },
  {
    id: 'horizontal-scan',
    name: 'Horizontal scan',
    description:
      'Every row scanned left to right, split wherever the tone changes. The simplest and fastest to plot.',
    source: 'dogs/main.py',
    style: 'horizontal',
    params: { ...DEFAULT_STYLE_PARAMS, lineSpacing: 1, colinearGap: 1 },
  },
  {
    id: 'dots-stipple',
    name: 'Stipple dots',
    description:
      'Each pixel becomes a small cell filled with a random scatter of dots — more dots where the image is darker.',
    source: 'dots/main.py',
    style: 'dots',
    params: { ...DEFAULT_STYLE_PARAMS, boxSide: 2 },
  },
  {
    id: 'circles-concentric',
    name: 'Concentric circles',
    description: 'Blocks averaged into a grid of rings, sized by tone. Slow to plot but striking.',
    source: 'circles/main.py',
    style: 'circles',
    params: { ...DEFAULT_STYLE_PARAMS, sampleLength: 10, circleDiameter: 2, lineWidth: 0.4 },
  },
];

/** Pen sets lifted from the original sketches, offered when picking inks. */
export const PALETTE_PRESETS: { name: string; colors: string[] }[] = [
  { name: 'Black', colors: ['#000000'] },
  { name: 'CMYK', colors: ['#000000', '#00b7eb', '#ff00ff', '#ffff00'] },
  { name: 'CMY + grey', colors: ['#a9a9a9', '#00b7eb', '#ff00ff', '#ffff00'] },
  { name: 'Purple / orange / yellow', colors: ['#8e3392', '#e76500', '#e0c200'] },
  { name: 'Red', colors: ['#dd3031'] },
];

/** Repeat a palette out to `count` pens when it is shorter. */
export const paletteFor = (palette: string[], count: number): string[] =>
  Array.from({ length: count }, (_, i) => palette[i % palette.length] ?? '#000000');
