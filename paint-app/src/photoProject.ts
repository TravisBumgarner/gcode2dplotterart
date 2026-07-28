import type { PhotoResult } from './components/PhotoStudio';
import { db, type Project } from './db';
import { saveLastPageSize } from './pageSizes';
import type { AppState } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Persist a photo render as a project. A photo plot is a multi-pen print job
 * rather than a live session, so each ink becomes its own layer and the print
 * flow can pause for a pen swap between them.
 */
export const createPhotoProject = async (
  result: PhotoResult,
): Promise<{ project: Project; state: AppState }> => {
  const now = Date.now();
  const pageId = uid();

  const layers = result.layers.map((layer, index) => ({
    id: uid(),
    name: `Pen ${index + 1}${index === 0 ? ' (darkest)' : ''}`,
    color: layer.color,
    thickness: 0.5,
    visible: true,
    strokes: layer.strokes.map((points) => ({
      id: uid(),
      // Strokes arrive page-local; the margin is applied here so the
      // renderer's world space stays the single source of truth.
      points: points.map((p) => ({ x: p.x + result.marginMm, y: p.y + result.marginMm })),
      color: layer.color,
    })),
  }));

  const state: AppState = {
    pages: [
      { id: pageId, x: 0, y: 0, width: result.pageSize.width, height: result.pageSize.height },
    ],
    layers,
    activePageId: pageId,
    activeLayerId: layers[0].id,
  };

  const project: Project = {
    id: uid(),
    name: result.name,
    state,
    createdAt: now,
    updatedAt: now,
  };

  await db.projects.put(project);
  saveLastPageSize(result.pageSize);
  return { project, state };
};
