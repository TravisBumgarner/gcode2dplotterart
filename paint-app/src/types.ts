import { z } from 'zod';

export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Point = z.infer<typeof PointSchema>;

export const StrokeSchema = z.object({
  id: z.string(),
  points: z.array(PointSchema).min(2),
  // Per-stroke draw color. When absent the stroke inherits its layer's
  // color (legacy strokes / layer-colored projects). Set from the active
  // draw color at creation time so changing color only affects new strokes.
  color: z.string().optional(),
});
export type Stroke = z.infer<typeof StrokeSchema>;

export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  thickness: z.number().positive(),
  visible: z.boolean(),
  strokes: z.array(StrokeSchema),
});
export type Layer = z.infer<typeof LayerSchema>;

export const PageSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type Page = z.infer<typeof PageSchema>;

export const PlotterSchema = z.object({
  id: z.string(),
  name: z.string(),
  bedWidth: z.number().positive(),
  bedHeight: z.number().positive(),
  travelFeed: z.number().positive(),
  drawFeed: z.number().positive(),
  penUpZ: z.number(),
  penDownZ: z.number(),
  // Orientation anchor captured during calibration. Maps drawing-local mm
  // (origin = page top-left, +y is down) onto machine coordinates:
  //   machineX = originX + dirX * localX
  //   machineY = originY + dirY * localY
  // dirX/dirY are ±1 and absorb a plotter whose X and/or Y runs backwards.
  // Absent on legacy plotters → treated as originX/Y 0, dirX/Y +1 (the
  // pre-calibration behavior of emitting local coords verbatim).
  originX: z.number().optional(),
  originY: z.number().optional(),
  dirX: z.union([z.literal(1), z.literal(-1)]).optional(),
  dirY: z.union([z.literal(1), z.literal(-1)]).optional(),
  createdAt: z.number(),
});
export type Plotter = z.infer<typeof PlotterSchema>;

/**
 * A document is plotter-independent: it owns its page geometry and nothing
 * else. The plotter is a print target chosen at output time (see
 * `plotters.tsx`), the way a printer is picked when printing a document.
 *
 * Two older shapes parse into this one for free, because zod strips unknown
 * keys: v1 embedded plotter params inline as `settings`, and v2 referenced a
 * plotter by `plotterId`. Both carry the page dimensions we actually need, so
 * both are read as-is and simply lose the stale field on the next save.
 */
export const AppStateSchema = z.object({
  pages: z.array(PageSchema).min(1),
  layers: z.array(LayerSchema).min(1),
  activePageId: z.string(),
  activeLayerId: z.string(),
});
export type AppState = z.infer<typeof AppStateSchema>;
