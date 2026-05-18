import type { Point } from './types';

const ELLIPSE_SAMPLES = 64;

export const buildLine = (a: Point, b: Point): Point[] => [a, b];

export const buildRect = (a: Point, b: Point): Point[] => {
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x, b.x);
  const y2 = Math.max(a.y, b.y);
  return [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
    { x: x1, y: y1 },
  ];
};

/** Drag defines the bounding box; we sample the inscribed ellipse as a polyline. */
export const buildEllipse = (a: Point, b: Point, samples = ELLIPSE_SAMPLES): Point[] => {
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  const rx = Math.abs(b.x - a.x) / 2;
  const ry = Math.abs(b.y - a.y) / 2;
  const points: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * 2 * Math.PI;
    points.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
  }
  return points;
};

/** Drag goes from the polygon center to one of its vertices. */
export const buildPolygon = (center: Point, edge: Point, sides: number): Point[] => {
  const dx = edge.x - center.x;
  const dy = edge.y - center.y;
  const r = Math.sqrt(dx * dx + dy * dy);
  const baseAngle = Math.atan2(dy, dx);
  const n = Math.max(3, Math.floor(sides));
  const points: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = baseAngle + (i / n) * 2 * Math.PI;
    points.push({ x: center.x + r * Math.cos(t), y: center.y + r * Math.sin(t) });
  }
  return points;
};

/** Drag goes from the star center to one of its outer points. Inner radius = outer/2. */
export const buildStar = (center: Point, edge: Point, pointCount: number): Point[] => {
  const dx = edge.x - center.x;
  const dy = edge.y - center.y;
  const rOuter = Math.sqrt(dx * dx + dy * dy);
  const rInner = rOuter / 2;
  const baseAngle = Math.atan2(dy, dx);
  const n = Math.max(3, Math.floor(pointCount));
  const total = n * 2;
  const points: Point[] = [];
  for (let i = 0; i <= total; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const t = baseAngle + (i / total) * 2 * Math.PI;
    points.push({ x: center.x + r * Math.cos(t), y: center.y + r * Math.sin(t) });
  }
  return points;
};
