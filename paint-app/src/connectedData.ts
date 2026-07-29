import type { PageSize } from './pageSizes';
import type { Point } from './types';

// ─── Discovery ───────────────────────────────────────────────────────────
// A probe fetch is walked once to produce a flat list of plottable fields.
// Only two things can be plotted: a scalar number (sampled repeatedly over
// time) and an array (drawn all at once as a series).

export type ScalarKind = 'number' | 'string' | 'boolean' | 'null';

export type ItemField = { path: string; kind: ScalarKind; sample: string };

export type DiscoveredField = {
  /** Dot path from the response root. Empty string means the root itself. */
  path: string;
  label: string;
  sample: string;
} & (
  | { kind: 'scalar'; valueKind: ScalarKind }
  | { kind: 'numberArray'; length: number }
  | { kind: 'objectArray'; length: number; itemFields: ItemField[] }
);

/** Guards against pathological payloads turning discovery into a hang. */
const MAX_DEPTH = 6;
const MAX_FIELDS = 400;
/** How many array entries to union when working out an array's item shape. */
const ITEM_SHAPE_SAMPLE = 20;

const scalarKind = (v: unknown): ScalarKind | null => {
  if (v === null) return 'null';
  if (typeof v === 'number' && Number.isFinite(v)) return 'number';
  if (typeof v === 'string') return 'string';
  if (typeof v === 'boolean') return 'boolean';
  return null;
};

export const sampleText = (v: unknown): string => {
  if (v === null) return 'null';
  if (typeof v === 'string') return v.length > 40 ? `"${v.slice(0, 40)}…"` : `"${v}"`;
  if (Array.isArray(v)) return `${v.length} items`;
  if (typeof v === 'object') return '{…}';
  return String(v);
};

const joinPath = (base: string, key: string) => (base ? `${base}.${key}` : key);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Union of the scalar keys across the first N entries — entries are often ragged. */
const itemShape = (items: unknown[]): ItemField[] => {
  const byPath = new Map<string, ItemField>();
  for (const item of items.slice(0, ITEM_SHAPE_SAMPLE)) {
    if (!isPlainObject(item)) continue;
    for (const [key, value] of Object.entries(item)) {
      if (byPath.has(key)) continue;
      const kind = scalarKind(value);
      // A key that is null in this entry may be a number in the next, so keep
      // looking rather than recording it as null.
      if (!kind || kind === 'null') continue;
      byPath.set(key, { path: key, kind, sample: sampleText(value) });
    }
  }
  return [...byPath.values()];
};

const describeArray = (path: string, label: string, arr: unknown[]): DiscoveredField | null => {
  if (arr.length === 0) return null;
  if (arr.every((v) => typeof v === 'number' && Number.isFinite(v))) {
    return {
      path,
      label,
      kind: 'numberArray',
      length: arr.length,
      sample: `[${arr.slice(0, 4).join(', ')}${arr.length > 4 ? ', …' : ''}]`,
    };
  }
  if (arr.some(isPlainObject)) {
    const itemFields = itemShape(arr);
    if (itemFields.length === 0) return null;
    return {
      path,
      label,
      kind: 'objectArray',
      length: arr.length,
      itemFields,
      sample: `${arr.length} objects · ${itemFields.map((f) => f.path).join(', ')}`,
    };
  }
  return null;
};

/**
 * Flatten a parsed JSON response into every field worth plotting. Nested
 * objects are walked; arrays terminate the walk and become a single field
 * describing the whole series.
 */
export const discoverFields = (root: unknown): DiscoveredField[] => {
  const out: DiscoveredField[] = [];

  const walk = (value: unknown, path: string, label: string, depth: number) => {
    if (out.length >= MAX_FIELDS || depth > MAX_DEPTH) return;

    if (Array.isArray(value)) {
      const field = describeArray(path, label || '(root)', value);
      if (field) out.push(field);
      return;
    }

    if (isPlainObject(value)) {
      for (const [key, child] of Object.entries(value)) {
        walk(child, joinPath(path, key), joinPath(label, key), depth + 1);
      }
      return;
    }

    const kind = scalarKind(value);
    // `null` carries no type information: it can't be configured (there's no
    // observed value to seed a range from) and might be a number on the next
    // poll, so listing it would only add unselectable noise.
    if (!kind || kind === 'null') return;
    out.push({
      path,
      label: label || '(root)',
      kind: 'scalar',
      valueKind: kind,
      sample: sampleText(value),
    });
  };

  walk(root, '', '', 0);
  return out;
};

/** Resolve a dot path produced by `discoverFields`. */
export const getByPath = (root: unknown, path: string): unknown => {
  if (!path) return root;
  let current: unknown = root;
  for (const key of path.split('.')) {
    if (!isPlainObject(current)) return undefined;
    current = current[key];
  }
  return current;
};

export const getNumber = (root: unknown, path: string): number | null => {
  const v = getByPath(root, path);
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};

// ─── Selection & config ──────────────────────────────────────────────────

export type SelectionMode = 'series' | 'snapshot';

export type Selection = {
  id: string;
  /** Path of the source field, as discovered. */
  path: string;
  label: string;
  mode: SelectionMode;
  color: string;
  /** objectArray only: which item key supplies X. Null means the item index. */
  xField: string | null;
  /** objectArray only: which item key supplies Y. Null means the item itself. */
  yField: string | null;
  /** Snapshots can range off their own data; live series cannot (see below). */
  autoRange: boolean;
  yMin: number;
  yMax: number;
};

export type ConnectedDataConfig = {
  url: string;
  format: 'json';
  intervalSeconds: number;
  pageSize: PageSize;
  marginMm: number;
  /** How much elapsed time the page width represents, for `series` selections. */
  windowMinutes: number;
  selections: Selection[];
};

export const DEFAULT_INTERVAL_SECONDS = 60;
export const DEFAULT_WINDOW_MINUTES = 60;
export const DEFAULT_MARGIN_MM = 10;

export const SERIES_COLORS = [
  '#1e88e5',
  '#e53935',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00897b',
  '#d81b60',
  '#3949ab',
];

// ─── Plot geometry ───────────────────────────────────────────────────────

export type PlotArea = { x: number; y: number; width: number; height: number };

export const plotArea = (page: PageSize, marginMm: number): PlotArea => {
  // A margin so wide it inverts the area would silently produce mirrored
  // geometry, so clamp it to a quarter of the shorter side.
  const limit = Math.min(page.width, page.height) / 4;
  const m = Math.max(0, Math.min(marginMm, limit));
  return { x: m, y: m, width: page.width - 2 * m, height: page.height - 2 * m };
};

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/**
 * Map a value onto a page-local Y. Page coordinates run +y down, so a larger
 * value sits closer to the top — the orientation a reader expects of a chart.
 */
export const valueToY = (value: number, min: number, max: number, area: PlotArea): number => {
  const span = max - min;
  const t = span === 0 ? 0.5 : clamp01((value - min) / span);
  return area.y + area.height * (1 - t);
};

/** Fraction of the time window elapsed → page-local X. */
export const elapsedToX = (elapsedMs: number, windowMinutes: number, area: PlotArea): number => {
  const windowMs = Math.max(1, windowMinutes * 60_000);
  return area.x + area.width * clamp01(elapsedMs / windowMs);
};

export const seriesWindowFull = (elapsedMs: number, windowMinutes: number): boolean =>
  elapsedMs >= windowMinutes * 60_000;

/**
 * Extract the (x, y) pairs a snapshot selection should draw, in page-local mm.
 * X comes from the chosen field or the item index; both axes are normalised
 * over the array's own extent, so a snapshot always fills the plot area.
 */
export const snapshotPoints = (root: unknown, selection: Selection, area: PlotArea): Point[] => {
  const raw = getByPath(root, selection.path);
  if (!Array.isArray(raw)) return [];

  const pairs: { x: number; y: number }[] = [];
  raw.forEach((item, index) => {
    const yRaw =
      selection.yField === null ? item : isPlainObject(item) ? item[selection.yField] : undefined;
    if (typeof yRaw !== 'number' || !Number.isFinite(yRaw)) return;

    let xRaw: number = index;
    if (selection.xField !== null) {
      const candidate = isPlainObject(item) ? item[selection.xField] : undefined;
      if (typeof candidate !== 'number' || !Number.isFinite(candidate)) return;
      xRaw = candidate;
    }
    pairs.push({ x: xRaw, y: yRaw });
  });

  if (pairs.length < 2) return [];

  const xs = pairs.map((p) => p.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const xSpan = xMax - xMin;

  const ys = pairs.map((p) => p.y);
  const yMin = selection.autoRange ? Math.min(...ys) : selection.yMin;
  const yMax = selection.autoRange ? Math.max(...ys) : selection.yMax;

  return pairs.map((p) => ({
    x: area.x + area.width * (xSpan === 0 ? 0.5 : clamp01((p.x - xMin) / xSpan)),
    y: valueToY(p.y, yMin, yMax, area),
  }));
};

/** A sensible starting range for a live series, given its first observed value. */
export const seedRange = (value: number): { yMin: number; yMax: number } => {
  if (value === 0) return { yMin: -1, yMax: 1 };
  const pad = Math.abs(value) * 0.5;
  const min = value - pad;
  const max = value + pad;
  // Round outward to something legible rather than 13.7419…
  const step = 10 ** Math.floor(Math.log10(Math.max(1e-9, max - min))) / 2;
  return {
    yMin: Math.floor(min / step) * step,
    yMax: Math.ceil(max / step) * step,
  };
};
