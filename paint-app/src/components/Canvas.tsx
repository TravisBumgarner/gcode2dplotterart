import { useEffect, useMemo, useRef, useState } from 'react';
import { INTERACTIVE_PROJECT_ID, useProject } from '../project';
import { buildEllipse, buildLine, buildPolygon, buildRect, buildStar } from '../shapes';
import { type AddDirection, useStore } from '../store';
import type { Page, Point } from '../types';
import { type Tool, useUI } from '../ui';

const PX_PER_MM = 3;
const PADDING_MM = 60;
const ADD_BUTTON_R = 5;
const ADD_BUTTON_GAP = 3;
const REMOVE_BUTTON_R = 3;
const REMOVE_BUTTON_INSET = 4;
export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 5;

type DrawingState =
  | { kind: 'pen'; points: Point[] }
  | { kind: 'shape'; tool: Exclude<Tool, 'pen'>; start: Point; current: Point };

export const Canvas = () => {
  const { state, addPage, addStroke, setActivePage, removePage } = useStore();
  const { project } = useProject();
  const {
    tool,
    polygonSides,
    starPoints,
    zoom,
    setZoom,
    showGrid,
    gridSize,
    drawColor,
    scriptPreview,
  } = useUI();
  const { pages, layers, activePageId, activeLayerId } = state;
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
  // Interactive sessions are single-page by definition — every stroke is
  // streamed to the plotter immediately, so multi-page layout would be
  // ambiguous. Hide the add/remove page UI entirely in that mode.
  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;
  const allowPageEdits = !isInteractive;

  // World bounds: bbox of pages + 4 add-buttons of the active page + padding.
  // Interactive sessions are single-page and fit-to-screen, so use a tight
  // margin around the active page rather than the generous scroll padding.
  const bounds = useMemo(() => {
    if (isInteractive) {
      const m = 8;
      return {
        x: activePage.x - m,
        y: activePage.y - m,
        width: activePage.width + m * 2,
        height: activePage.height + m * 2,
      };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of pages) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + p.width > maxX) maxX = p.x + p.width;
      if (p.y + p.height > maxY) maxY = p.y + p.height;
    }
    const pad = ADD_BUTTON_GAP + ADD_BUTTON_R * 2 + 2;
    minX = Math.min(minX, activePage.x - pad);
    minY = Math.min(minY, activePage.y - pad);
    maxX = Math.max(maxX, activePage.x + activePage.width + pad);
    maxY = Math.max(maxY, activePage.y + activePage.height + pad);
    return {
      x: minX - PADDING_MM,
      y: minY - PADDING_MM,
      width: maxX - minX + PADDING_MM * 2,
      height: maxY - minY + PADDING_MM * 2,
    };
  }, [pages, activePage, isInteractive]);

  // Map screen → world via the SVG's own transform matrix. This stays correct
  // regardless of how the viewBox is fitted (scroll-sized 1:1 or
  // preserveAspectRatio letterboxing in interactive fit-to-screen mode).
  const clientToWorld = (clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const sp = pt.matrixTransform(ctm.inverse());
    return { x: sp.x, y: sp.y };
  };

  const findPageAt = (pt: Point): Page | null => {
    for (let i = pages.length - 1; i >= 0; i--) {
      const p = pages[i];
      if (pt.x >= p.x && pt.x <= p.x + p.width && pt.y >= p.y && pt.y <= p.y + p.height) {
        return p;
      }
    }
    return null;
  };

  const buildShapePoints = (start: Point, current: Point, t: Exclude<Tool, 'pen'>): Point[] => {
    switch (t) {
      case 'line':
        return buildLine(start, current);
      case 'rect':
        return buildRect(start, current);
      case 'ellipse':
        return buildEllipse(start, current);
      case 'polygon':
        return buildPolygon(start, current, polygonSides);
      case 'star':
        return buildStar(start, current, starPoints);
    }
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeLayer) return;
    if (e.button !== 0) return;
    const pt = clientToWorld(e.clientX, e.clientY);
    if (!pt) return;
    // Drawing must start on a page. Off-page starts would produce strokes that
    // get fully clipped at print time — confusing UX.
    const page = findPageAt(pt);
    if (!page) return;
    setActivePage(page.id);
    svgRef.current?.setPointerCapture(e.pointerId);
    if (tool === 'pen') {
      setDrawing({ kind: 'pen', points: [pt] });
    } else {
      setDrawing({ kind: 'shape', tool, start: pt, current: pt });
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    const pt = clientToWorld(e.clientX, e.clientY);
    if (!pt) return;
    const onPage = findPageAt(pt) !== null;

    if (drawing.kind === 'pen') {
      // Confine freehand to the union of pages. When the cursor leaves the
      // page collection, commit the in-progress points as a stroke and clear
      // the buffer; dragging back onto a page begins a new sub-stroke without
      // lifting the pointer.
      if (!onPage) {
        if (drawing.points.length >= 2 && activeLayer) {
          addStroke(activeLayer.id, drawing.points, drawColor);
        }
        setDrawing({ kind: 'pen', points: [] });
        return;
      }
      if (drawing.points.length === 0) {
        setDrawing({ kind: 'pen', points: [pt] });
        return;
      }
      setDrawing({ kind: 'pen', points: [...drawing.points, pt] });
      return;
    }

    // Shape tools: only update the live "current" point while the cursor is
    // on a page; off-page movement freezes the preview at the last on-page
    // position so the committed shape stays inside the document.
    if (!onPage) return;
    setDrawing({ ...drawing, current: pt });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    svgRef.current?.releasePointerCapture(e.pointerId);
    if (drawing.kind === 'pen') {
      if (drawing.points.length >= 2 && activeLayer) {
        addStroke(activeLayer.id, drawing.points, drawColor);
      }
    } else if (activeLayer) {
      const points = buildShapePoints(drawing.start, drawing.current, drawing.tool);
      // Skip degenerate shapes (zero-radius, etc.).
      if (points.length >= 2) {
        const dx = drawing.current.x - drawing.start.x;
        const dy = drawing.current.y - drawing.start.y;
        if (Math.hypot(dx, dy) > 0.5) {
          addStroke(activeLayer.id, points, drawColor);
        }
      }
    }
    setDrawing(null);
  };

  const previewPoints: Point[] | null = !drawing
    ? null
    : drawing.kind === 'pen'
      ? drawing.points
      : buildShapePoints(drawing.start, drawing.current, drawing.tool);

  // Cmd/Ctrl + Wheel zooms (centered on cursor); otherwise the browser
  // scrolls the overflow container natively.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
      const before = el.getBoundingClientRect();
      const cursorX = e.clientX - before.left + el.scrollLeft;
      const cursorY = e.clientY - before.top + el.scrollTop;
      setZoom((z) => {
        const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z * factor));
        const ratio = next / z;
        requestAnimationFrame(() => {
          el.scrollLeft = cursorX * ratio - (e.clientX - before.left);
          el.scrollTop = cursorY * ratio - (e.clientY - before.top);
        });
        return next;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setZoom]);

  const wPx = bounds.width * PX_PER_MM * zoom;
  const hPx = bounds.height * PX_PER_MM * zoom;

  const addButtons: { dir: AddDirection; cx: number; cy: number }[] = [
    {
      dir: 'top',
      cx: activePage.x + activePage.width / 2,
      cy: activePage.y - ADD_BUTTON_GAP - ADD_BUTTON_R,
    },
    {
      dir: 'right',
      cx: activePage.x + activePage.width + ADD_BUTTON_GAP + ADD_BUTTON_R,
      cy: activePage.y + activePage.height / 2,
    },
    {
      dir: 'bottom',
      cx: activePage.x + activePage.width / 2,
      cy: activePage.y + activePage.height + ADD_BUTTON_GAP + ADD_BUTTON_R,
    },
    {
      dir: 'left',
      cx: activePage.x - ADD_BUTTON_GAP - ADD_BUTTON_R,
      cy: activePage.y + activePage.height / 2,
    },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: isInteractive ? 'hidden' : 'auto',
        background: '#f0f0f0',
        position: 'relative',
      }}
    >
      <svg
        ref={svgRef}
        role="img"
        aria-label="Canvas"
        width={isInteractive ? '100%' : wPx}
        height={isInteractive ? '100%' : hPx}
        viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {showGrid && (
          <defs>
            {/* userSpaceOnUse keeps grid lines aligned to world (mm)
                coordinates, so they stay continuous across adjacent pages. */}
            <pattern
              id="page-grid"
              patternUnits="userSpaceOnUse"
              width={gridSize}
              height={gridSize}
            >
              <path
                d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                fill="none"
                stroke="#c8d4e0"
                strokeWidth={0.2}
              />
            </pattern>
          </defs>
        )}

        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <g key={page.id}>
              <rect
                x={page.x}
                y={page.y}
                width={page.width}
                height={page.height}
                fill="#fff"
                stroke={isActive ? '#4a90e2' : '#bbb'}
                strokeWidth={isActive ? 1.2 : 0.4}
              />
              {showGrid && (
                <rect
                  x={page.x}
                  y={page.y}
                  width={page.width}
                  height={page.height}
                  fill="url(#page-grid)"
                  pointerEvents="none"
                />
              )}
              {allowPageEdits && pages.length > 1 && (
                <RemoveButton
                  cx={page.x + page.width - REMOVE_BUTTON_INSET - REMOVE_BUTTON_R}
                  cy={page.y + REMOVE_BUTTON_INSET + REMOVE_BUTTON_R}
                  onConfirm={() => removePage(page.id)}
                />
              )}
            </g>
          );
        })}

        {layers.map(
          (layer) =>
            layer.visible && (
              <g key={layer.id}>
                {layer.strokes.map((stroke) => (
                  <polyline
                    key={stroke.id}
                    points={stroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={stroke.color ?? layer.color}
                    strokeWidth={layer.thickness}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            ),
        )}

        {previewPoints && previewPoints.length >= 2 && activeLayer && (
          <polyline
            points={previewPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={drawColor}
            strokeWidth={activeLayer.thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {scriptPreview && activeLayer && (
          <g opacity={0.45}>
            {scriptPreview.map((points, i) =>
              points.length < 2 ? null : (
                <polyline
                  // biome-ignore lint/suspicious/noArrayIndexKey: preview list is regenerated whole each tick
                  key={i}
                  points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={drawColor}
                  strokeWidth={activeLayer.thickness}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 2"
                />
              ),
            )}
          </g>
        )}

        {allowPageEdits &&
          addButtons.map((b) => (
            <AddButton key={b.dir} cx={b.cx} cy={b.cy} onClick={() => addPage(b.dir)} />
          ))}
      </svg>
    </div>
  );
};

const AddButton = ({ cx, cy, onClick }: { cx: number; cy: number; onClick: () => void }) => (
  // biome-ignore lint/a11y/useSemanticElements: SVG <g> can't be a <button>; behaves like one.
  <g
    role="button"
    aria-label="Add page"
    tabIndex={0}
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    style={{ cursor: 'pointer' }}
  >
    <circle
      cx={cx}
      cy={cy}
      r={ADD_BUTTON_R}
      fill="#fff"
      stroke="#aaa"
      strokeWidth={0.4}
      strokeDasharray="1.5 1"
    />
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={ADD_BUTTON_R * 1.4}
      fill="#888"
      style={{ userSelect: 'none', pointerEvents: 'none' }}
    >
      +
    </text>
  </g>
);

const RemoveButton = ({ cx, cy, onConfirm }: { cx: number; cy: number; onConfirm: () => void }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG <g> can't be a <button>; behaves like one.
    <g
      role="button"
      aria-label={armed ? 'Confirm remove page' : 'Remove page'}
      tabIndex={0}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (armed) {
            setArmed(false);
            onConfirm();
          } else {
            setArmed(true);
          }
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={REMOVE_BUTTON_R}
        fill={armed ? '#c33' : '#fff'}
        stroke={armed ? '#c33' : '#bbb'}
        strokeWidth={0.4}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={REMOVE_BUTTON_R * 1.6}
        fill={armed ? '#fff' : '#888'}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {armed ? '?' : '×'}
      </text>
    </g>
  );
};
