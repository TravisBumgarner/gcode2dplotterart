import type { Plotter } from './types';

/** Page dimensions in mm. Origin/position is decided by the store. */
export type PageSize = { width: number; height: number };

const LAST_SIZE_LS_KEY = 'paint-app:lastPageSize';

export const DEFAULT_PAGE_SIZE: PageSize = { width: 210, height: 297 };

export const STANDARD_SIZES: { label: string; size: PageSize }[] = [
  { label: 'A4', size: { width: 210, height: 297 } },
  { label: 'A5', size: { width: 148, height: 210 } },
  { label: 'Letter', size: { width: 216, height: 279 } },
  { label: 'Square 200mm', size: { width: 200, height: 200 } },
];

export const formatSize = (size: PageSize) => `${size.width}×${size.height}mm`;

/** A plotter's bed, offered as a page size so "fill the machine" stays one click. */
export const plotterPageSize = (plotter: Plotter): PageSize => ({
  width: plotter.bedWidth,
  height: plotter.bedHeight,
});

/**
 * The size a new document defaults to — whatever was used last, so the common
 * case (same paper every time) needs no interaction. Interactive sessions use
 * this directly instead of prompting.
 */
export const loadLastPageSize = (): PageSize => {
  try {
    const raw = localStorage.getItem(LAST_SIZE_LS_KEY);
    if (!raw) return DEFAULT_PAGE_SIZE;
    const parsed = JSON.parse(raw);
    const width = Number(parsed?.width);
    const height = Number(parsed?.height);
    if (width > 0 && height > 0) return { width, height };
  } catch {}
  return DEFAULT_PAGE_SIZE;
};

export const saveLastPageSize = (size: PageSize) => {
  localStorage.setItem(LAST_SIZE_LS_KEY, JSON.stringify(size));
};
