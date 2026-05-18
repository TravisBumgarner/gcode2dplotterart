import type { Point } from './types';

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Liang-Barsky line clipping. Returns the portion of segment [p1, p2]
 * that lies inside `rect`, or null if the segment is fully outside.
 */
const clipSegment = (p1: Point, p2: Point, rect: Rect): [Point, Point] | null => {
  const xmin = rect.x;
  const ymin = rect.y;
  const xmax = rect.x + rect.width;
  const ymax = rect.y + rect.height;
  let t0 = 0;
  let t1 = 1;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const tests: { p: number; q: number }[] = [
    { p: -dx, q: p1.x - xmin },
    { p: dx, q: xmax - p1.x },
    { p: -dy, q: p1.y - ymin },
    { p: dy, q: ymax - p1.y },
  ];
  for (const { p, q } of tests) {
    if (p === 0) {
      if (q < 0) return null;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  return [
    { x: p1.x + t0 * dx, y: p1.y + t0 * dy },
    { x: p1.x + t1 * dx, y: p1.y + t1 * dy },
  ];
};

/**
 * Clip a polyline (sequence of connected points) against a rectangle,
 * returning zero or more sub-polylines (each of length ≥ 2) that lie inside.
 *
 * Each consecutive segment is clipped independently; runs of consecutive
 * inside-segments are merged into a single sub-polyline.
 */
export const clipPolyline = (points: Point[], rect: Rect): Point[][] => {
  const out: Point[][] = [];
  let current: Point[] = [];

  const flush = () => {
    if (current.length >= 2) out.push(current);
    current = [];
  };

  for (let i = 0; i < points.length - 1; i++) {
    const seg = clipSegment(points[i], points[i + 1], rect);
    if (!seg) {
      flush();
      continue;
    }
    if (current.length === 0) {
      current.push(seg[0]);
    } else {
      const last = current[current.length - 1];
      if (last.x !== seg[0].x || last.y !== seg[0].y) {
        flush();
        current.push(seg[0]);
      }
    }
    current.push(seg[1]);
  }
  flush();
  return out;
};
