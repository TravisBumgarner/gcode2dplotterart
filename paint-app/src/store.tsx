import { createContext, type ReactNode, useCallback, useContext, useMemo, useReducer } from 'react';
import type { PageSize } from './pageSizes';
import type { AppState, Layer, Page, Point, Stroke } from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

const HISTORY_LIMIT = 100;

/**
 * Create a fresh AppState at the given page size. Documents are
 * plotter-independent — the size is picked when the document is created, and
 * which plotter it eventually prints to is decided separately.
 */
export const createInitialState = (size: PageSize): AppState => {
  const pageId = uid();
  const layerId = uid();
  return {
    pages: [{ id: pageId, x: 0, y: 0, width: size.width, height: size.height }],
    layers: [
      {
        id: layerId,
        name: 'Layer 1',
        color: '#1a1a1a',
        thickness: 0.5,
        visible: true,
        strokes: [],
      },
    ],
    activePageId: pageId,
    activeLayerId: layerId,
  };
};

const PLACEHOLDER_STATE: AppState = {
  pages: [{ id: 'placeholder', x: 0, y: 0, width: 210, height: 297 }],
  layers: [
    {
      id: 'placeholder-layer',
      name: 'Layer 1',
      color: '#1a1a1a',
      thickness: 0.5,
      visible: true,
      strokes: [],
    },
  ],
  activePageId: 'placeholder',
  activeLayerId: 'placeholder-layer',
};

export type AddDirection = 'top' | 'right' | 'bottom' | 'left';

type Action =
  | { type: 'add-page'; direction: AddDirection }
  | { type: 'remove-page'; pageId: string }
  | { type: 'set-active-page'; pageId: string }
  | { type: 'update-page'; pageId: string; patch: Partial<Page> }
  | { type: 'add-layer' }
  | { type: 'remove-layer'; layerId: string }
  | { type: 'set-active-layer'; layerId: string }
  | { type: 'update-layer'; layerId: string; patch: Partial<Layer> }
  | { type: 'reorder-layers'; ids: string[] }
  | { type: 'add-stroke'; layerId: string; stroke: Stroke }
  | { type: 'clear-strokes' }
  | { type: 'load-state'; state: AppState }
  | { type: 'undo' };

/**
 * Action types whose effect is reversible — these get pushed onto the
 * history stack before being applied. Pure-selection actions (set-active-*)
 * and `load-state` are excluded.
 */
const UNDOABLE: Set<Action['type']> = new Set([
  'add-page',
  'remove-page',
  'update-page',
  'add-layer',
  'remove-layer',
  'update-layer',
  'reorder-layers',
  'add-stroke',
  'clear-strokes',
]);

type ReducerState = { present: AppState; past: AppState[] };

const presentReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'load-state':
    case 'undo':
      return state; // handled at the wrapper level
    case 'add-page': {
      const src =
        state.pages.find((p) => p.id === state.activePageId) ?? state.pages[state.pages.length - 1];
      const page: Page = (() => {
        const base = { id: uid(), width: src.width, height: src.height };
        switch (action.direction) {
          case 'right':
            return { ...base, x: src.x + src.width, y: src.y };
          case 'left':
            return { ...base, x: src.x - src.width, y: src.y };
          case 'bottom':
            return { ...base, x: src.x, y: src.y + src.height };
          case 'top':
            return { ...base, x: src.x, y: src.y - src.height };
        }
      })();
      return { ...state, pages: [...state.pages, page], activePageId: page.id };
    }
    case 'remove-page': {
      if (state.pages.length === 1) return state;
      const pages = state.pages.filter((p) => p.id !== action.pageId);
      const activePageId = state.activePageId === action.pageId ? pages[0].id : state.activePageId;
      return { ...state, pages, activePageId };
    }
    case 'set-active-page':
      return { ...state, activePageId: action.pageId };
    case 'update-page':
      return {
        ...state,
        pages: state.pages.map((p) => (p.id === action.pageId ? { ...p, ...action.patch } : p)),
      };
    case 'add-layer': {
      const layer: Layer = {
        id: uid(),
        name: `Layer ${state.layers.length + 1}`,
        color: '#1a1a1a',
        thickness: 0.5,
        visible: true,
        strokes: [],
      };
      return { ...state, layers: [...state.layers, layer], activeLayerId: layer.id };
    }
    case 'remove-layer': {
      if (state.layers.length === 1) return state;
      const layers = state.layers.filter((l) => l.id !== action.layerId);
      const activeLayerId =
        state.activeLayerId === action.layerId ? layers[0].id : state.activeLayerId;
      return { ...state, layers, activeLayerId };
    }
    case 'set-active-layer':
      return { ...state, activeLayerId: action.layerId };
    case 'update-layer':
      return {
        ...state,
        layers: state.layers.map((l) => (l.id === action.layerId ? { ...l, ...action.patch } : l)),
      };
    case 'reorder-layers': {
      const map = new Map(state.layers.map((l) => [l.id, l]));
      const layers = action.ids.map((id) => map.get(id)).filter((l): l is Layer => l !== undefined);
      return layers.length === state.layers.length ? { ...state, layers } : state;
    }
    case 'add-stroke':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId ? { ...l, strokes: [...l.strokes, action.stroke] } : l,
        ),
      };
    case 'clear-strokes': {
      if (state.layers.every((l) => l.strokes.length === 0)) return state;
      return {
        ...state,
        layers: state.layers.map((l) => (l.strokes.length === 0 ? l : { ...l, strokes: [] })),
      };
    }
  }
};

const reducer = (state: ReducerState, action: Action): ReducerState => {
  if (action.type === 'load-state') {
    return { present: action.state, past: [] };
  }
  if (action.type === 'undo') {
    if (state.past.length === 0) return state;
    const present = state.past[state.past.length - 1];
    const past = state.past.slice(0, -1);
    return { present, past };
  }
  const next = presentReducer(state.present, action);
  if (next === state.present) return state;
  if (UNDOABLE.has(action.type)) {
    const past = [...state.past, state.present];
    return { present: next, past: past.slice(-HISTORY_LIMIT) };
  }
  return { ...state, present: next };
};

type Store = {
  state: AppState;
  loadState: (state: AppState) => void;
  addPage: (direction: AddDirection) => void;
  removePage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  updatePage: (pageId: string, patch: Partial<Page>) => void;
  addLayer: () => void;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  updateLayer: (layerId: string, patch: Partial<Layer>) => void;
  reorderLayers: (ids: string[]) => void;
  addStroke: (layerId: string, points: Point[], color?: string) => void;
  clearStrokes: () => void;
  undo: () => void;
  canUndo: boolean;
};

const StoreContext = createContext<Store | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [reducerState, dispatch] = useReducer(reducer, {
    present: PLACEHOLDER_STATE,
    past: [],
  });

  const addStroke = useCallback((layerId: string, points: Point[], color?: string) => {
    dispatch({
      type: 'add-stroke',
      layerId,
      stroke: { id: uid(), points, ...(color ? { color } : {}) },
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      state: reducerState.present,
      canUndo: reducerState.past.length > 0,
      loadState: (next) => dispatch({ type: 'load-state', state: next }),
      addPage: (direction) => dispatch({ type: 'add-page', direction }),
      removePage: (pageId) => dispatch({ type: 'remove-page', pageId }),
      setActivePage: (pageId) => dispatch({ type: 'set-active-page', pageId }),
      updatePage: (pageId, patch) => dispatch({ type: 'update-page', pageId, patch }),
      addLayer: () => dispatch({ type: 'add-layer' }),
      removeLayer: (layerId) => dispatch({ type: 'remove-layer', layerId }),
      setActiveLayer: (layerId) => dispatch({ type: 'set-active-layer', layerId }),
      updateLayer: (layerId, patch) => dispatch({ type: 'update-layer', layerId, patch }),
      reorderLayers: (ids) => dispatch({ type: 'reorder-layers', ids }),
      addStroke,
      clearStrokes: () => dispatch({ type: 'clear-strokes' }),
      undo: () => dispatch({ type: 'undo' }),
    }),
    [reducerState, addStroke],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
