import { clipPolyline, type Rect } from './clip';
import type { Layer, Page, Plotter, Point } from './types';

const fmt = (n: number) => n.toFixed(3);

/**
 * Map a drawing-local point (mm; origin = page top-left, +y down) into
 * machine coordinates using the plotter's calibrated orientation anchor.
 * Legacy plotters lack the anchor fields → identity (verbatim local coords).
 */
const toMachine = (p: Point, plotter: Plotter): Point => ({
  x: (plotter.originX ?? 0) + (plotter.dirX ?? 1) * p.x,
  y: (plotter.originY ?? 0) + (plotter.dirY ?? 1) * p.y,
});

const pointsToGcode = (points: Point[], plotter: Plotter): string[] => {
  const lines: string[] = [];
  const [first, ...rest] = points.map((p) => toMachine(p, plotter));
  lines.push(`G0 Z${fmt(plotter.penUpZ)} F${plotter.travelFeed}`);
  lines.push(`G0 X${fmt(first.x)} Y${fmt(first.y)} F${plotter.travelFeed}`);
  lines.push(`G1 Z${fmt(plotter.penDownZ)} F${plotter.travelFeed}`);
  for (const p of rest) {
    lines.push(`G1 X${fmt(p.x)} Y${fmt(p.y)} F${plotter.drawFeed}`);
  }
  lines.push(`G0 Z${fmt(plotter.penUpZ)} F${plotter.travelFeed}`);
  return lines;
};

export type LayerProgram = {
  layerId: string;
  layerName: string;
  color: string;
  lines: string[];
};

/**
 * Build G-code for a single freshly-drawn stroke, clipped to the page rect
 * and translated into machine coordinates. Used by interactive mode where we
 * stream individual strokes as the user finishes them.
 */
export const buildStrokeLines = (points: Point[], page: Page, plotter: Plotter): string[] => {
  const rect: Rect = { x: page.x, y: page.y, width: page.width, height: page.height };
  const subs = clipPolyline(points, rect);
  const lines: string[] = [];
  for (const sub of subs) {
    const local = sub.map((p) => ({ x: p.x - page.x, y: p.y - page.y }));
    lines.push(...pointsToGcode(local, plotter));
  }
  return lines;
};

export const buildLayerPrograms = (
  layers: Layer[],
  page: Page,
  plotter: Plotter,
): LayerProgram[] => {
  const rect: Rect = { x: page.x, y: page.y, width: page.width, height: page.height };
  return layers
    .filter((l) => l.visible)
    .map((layer) => {
      const lines: string[] = [`; layer ${layer.name} (${layer.color}, ${layer.thickness}mm)`];
      let drew = false;
      for (const stroke of layer.strokes) {
        const subs = clipPolyline(stroke.points, rect);
        for (const sub of subs) {
          const local = sub.map((p) => ({ x: p.x - page.x, y: p.y - page.y }));
          lines.push(...pointsToGcode(local, plotter));
          drew = true;
        }
      }
      return drew ? { layerId: layer.id, layerName: layer.name, color: layer.color, lines } : null;
    })
    .filter((p): p is LayerProgram => p !== null);
};

export const PROLOGUE = (plotter: Plotter): string[] => [
  `; plotter: ${plotter.name}`,
  'G21 ; mm',
  'G90 ; absolute',
  // No G28 here: the server homes once on connect and machine
  // position persists, so re-homing per print would just waste ~15s.
  `G0 Z${fmt(plotter.penUpZ)} F${plotter.travelFeed}`,
];

export const EPILOGUE = (plotter: Plotter): string[] => [
  `G0 Z${fmt(plotter.penUpZ)} F${plotter.travelFeed}`,
  'G0 X0 Y0',
  'M84 ; disable steppers',
];
