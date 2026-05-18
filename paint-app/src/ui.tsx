import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { Point } from './types';

export type Tool = 'pen' | 'line' | 'rect' | 'ellipse' | 'polygon' | 'star';

const GRID_SIZE_LS_KEY = 'paint-app:gridSize';
export const GRID_SIZE_MIN = 1;
export const GRID_SIZE_MAX = 100;
const GRID_SIZE_DEFAULT = 10;

type UICtx = {
  tool: Tool;
  setTool: (t: Tool) => void;
  polygonSides: number;
  setPolygonSides: (n: number) => void;
  starPoints: number;
  setStarPoints: (n: number) => void;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  /** Whether a measurement grid is overlaid on each page. Display-only —
   * never affects exported geometry. */
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  /** Grid spacing in mm. Persisted to localStorage; clamped to
   * [GRID_SIZE_MIN, GRID_SIZE_MAX]. */
  gridSize: number;
  setGridSize: (v: number) => void;
  /** Color applied to newly drawn strokes. Changing it never recolors
   * existing strokes — each stroke captures this value when committed. */
  drawColor: string;
  setDrawColor: (c: string) => void;
  /** World-space polylines rendered as a ghost overlay while the script
   * dialog is editing — strokes only commit when the user clicks OK. */
  scriptPreview: Point[][] | null;
  setScriptPreview: (preview: Point[][] | null) => void;
};

const UIContext = createContext<UICtx | null>(null);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [tool, setTool] = useState<Tool>('pen');
  const [polygonSides, setPolygonSides] = useState(6);
  const [starPoints, setStarPoints] = useState(5);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSizeState] = useState<number>(() => {
    const raw = Number(localStorage.getItem(GRID_SIZE_LS_KEY));
    return Number.isFinite(raw) && raw >= GRID_SIZE_MIN && raw <= GRID_SIZE_MAX
      ? raw
      : GRID_SIZE_DEFAULT;
  });
  const [drawColor, setDrawColor] = useState('#1a1a1a');

  const setGridSize = useCallback((v: number) => {
    const clamped = Math.max(GRID_SIZE_MIN, Math.min(GRID_SIZE_MAX, Math.round(v)));
    setGridSizeState(clamped);
    localStorage.setItem(GRID_SIZE_LS_KEY, String(clamped));
  }, []);
  const [scriptPreview, setScriptPreview] = useState<Point[][] | null>(null);

  const value = useMemo<UICtx>(
    () => ({
      tool,
      setTool,
      polygonSides,
      setPolygonSides,
      starPoints,
      setStarPoints,
      zoom,
      setZoom,
      showGrid,
      setShowGrid,
      gridSize,
      setGridSize,
      drawColor,
      setDrawColor,
      scriptPreview,
      setScriptPreview,
    }),
    [
      tool,
      polygonSides,
      starPoints,
      zoom,
      showGrid,
      gridSize,
      setGridSize,
      drawColor,
      scriptPreview,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
