/**
 * Canvas-backed half of the photo pipeline: decoding a file and resampling it.
 * Kept apart from `photo.ts` so the arithmetic there stays pure and testable.
 */

export type DecodedImage = {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
};

export const decodeFile = async (file: File): Promise<ImageBitmap> => {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error(
      `Could not decode "${file.name}". Supported formats are whatever the browser can open — JPEG, PNG, WebP, GIF.`,
    );
  }
};

/** Largest size fitting inside the bounds without changing the aspect ratio. */
export const fitWithin = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } => {
  if (width <= 0 || height <= 0) throw new Error('Image dimensions cannot be zero');
  if (maxWidth <= 0 || maxHeight <= 0) throw new Error('Maximum dimensions must be positive');
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
};

/**
 * Resample to exactly the given size. Callers pass dimensions already derived
 * from `fitWithin`, so the aspect ratio is preserved by construction.
 */
export const resample = (source: ImageBitmap, width: number, height: number): DecodedImage => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get a 2D canvas context');
  ctx.drawImage(source, 0, 0, width, height);
  return { rgba: ctx.getImageData(0, 0, width, height).data, width, height };
};

/**
 * Resample at a reduced detail level. The style still receives an image at
 * exactly the resolution it expects (its geometry assumes one source pixel per
 * millimetre), but the content is sampled coarsely and re-expanded without
 * smoothing. The result is chunkier tonal regions: fewer, longer strokes and a
 * bolder plot, which is what the Python pipeline's aggressive `resize_image`
 * was really buying.
 */
export const resampleWithDetail = (
  source: ImageBitmap,
  width: number,
  height: number,
  detail: number,
): DecodedImage => {
  if (detail >= 1) return resample(source, width, height);

  const coarseWidth = Math.max(1, Math.round(width * detail));
  const coarseHeight = Math.max(1, Math.round(height * detail));

  const coarse = document.createElement('canvas');
  coarse.width = coarseWidth;
  coarse.height = coarseHeight;
  const coarseCtx = coarse.getContext('2d');
  if (!coarseCtx) throw new Error('Could not get a 2D canvas context');
  coarseCtx.drawImage(source, 0, 0, coarseWidth, coarseHeight);

  const full = document.createElement('canvas');
  full.width = width;
  full.height = height;
  const ctx = full.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get a 2D canvas context');
  // Nearest-neighbour on the way back up, so the blocks stay hard-edged
  // instead of being blurred back into a gradient.
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(coarse, 0, 0, width, height);

  return { rgba: ctx.getImageData(0, 0, width, height).data, width, height };
};

/** Data URL of a bucketed image, for the wizard's preview. */
export const bucketPreviewUrl = (
  data: Uint8Array,
  width: number,
  height: number,
  palette: string[],
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const image = ctx.createImageData(width, height);
  const rgb = palette.map(hexToRgb);
  for (let i = 0; i < data.length; i++) {
    const [r, g, b] = rgb[data[i]] ?? [0, 0, 0];
    image.data[i * 4] = r;
    image.data[i * 4 + 1] = g;
    image.data[i * 4 + 2] = b;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
};

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const int = Number.parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};
