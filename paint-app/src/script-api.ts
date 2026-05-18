import { buildEllipse, buildLine, buildPolygon, buildRect, buildStar } from './shapes';
import type { Page, Point } from './types';

/**
 * Drawing API exposed to user-written scripts. All coordinates are page-local
 * (origin at the active page's top-left, in mm) — the runtime translates them
 * into world space before adding strokes to the layer.
 */
export type DrawAPI = {
  rect: (x: number, y: number, w: number, h: number) => void;
  square: (x: number, y: number, size: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  ellipse: (cx: number, cy: number, rx: number, ry: number) => void;
  circle: (cx: number, cy: number, r: number) => void;
  polygon: (cx: number, cy: number, r: number, sides: number, rotation?: number) => void;
  star: (cx: number, cy: number, r: number, points: number) => void;
  path: (points: Point[]) => void;
  repeat: (n: number, fn: (i: number) => void) => void;
};

export const createDrawAPI = (page: Page, emit: (points: Point[]) => void): DrawAPI => {
  const emitLocal = (points: Point[]) => {
    if (points.length < 2) return;
    emit(points.map((p) => ({ x: p.x + page.x, y: p.y + page.y })));
  };

  return {
    rect: (x, y, w, h) => emitLocal(buildRect({ x, y }, { x: x + w, y: y + h })),
    square: (x, y, size) => emitLocal(buildRect({ x, y }, { x: x + size, y: y + size })),
    line: (x1, y1, x2, y2) => emitLocal(buildLine({ x: x1, y: y1 }, { x: x2, y: y2 })),
    ellipse: (cx, cy, rx, ry) =>
      emitLocal(buildEllipse({ x: cx - rx, y: cy - ry }, { x: cx + rx, y: cy + ry })),
    circle: (cx, cy, r) =>
      emitLocal(buildEllipse({ x: cx - r, y: cy - r }, { x: cx + r, y: cy + r })),
    polygon: (cx, cy, r, sides, rotation = 0) =>
      emitLocal(
        buildPolygon(
          { x: cx, y: cy },
          { x: cx + Math.cos(rotation) * r, y: cy + Math.sin(rotation) * r },
          sides,
        ),
      ),
    star: (cx, cy, r, points) =>
      emitLocal(buildStar({ x: cx, y: cy }, { x: cx + r, y: cy }, points)),
    path: (pts) => emitLocal(pts),
    repeat: (n, fn) => {
      for (let i = 0; i < n; i++) fn(i);
    },
  };
};

/**
 * Execute user-supplied JavaScript with the API surface destructured into
 * scope, so users can write `rect(0,0,10,10)` rather than `api.rect(...)`.
 */
export const runScript = (code: string, api: DrawAPI): void => {
  const keys = Object.keys(api);
  const values = Object.values(api);
  const fn = new Function(...keys, code);
  fn(...values);
};
