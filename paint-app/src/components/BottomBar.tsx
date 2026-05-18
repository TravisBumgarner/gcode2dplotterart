import AddIcon from '@mui/icons-material/Add';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import CodeIcon from '@mui/icons-material/Code';
import CreateIcon from '@mui/icons-material/Create';
import HexagonOutlinedIcon from '@mui/icons-material/HexagonOutlined';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ClearIcon from '@mui/icons-material/LayersClear';
import RectangleOutlinedIcon from '@mui/icons-material/RectangleOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import UndoIcon from '@mui/icons-material/Undo';
import { Box, Divider, IconButton, Paper, Popover, TextField, Tooltip } from '@mui/material';
import { type ReactNode, useEffect, useState } from 'react';
import { INTERACTIVE_PROJECT_ID, useProject } from '../project';
import { useStore } from '../store';
import { type Tool, useUI } from '../ui';
import { ZOOM_MAX, ZOOM_MIN } from './Canvas';
import { ScriptDialog } from './ScriptDialog';

const TOOLS: { key: Tool; label: string; icon: ReactNode; hint: string }[] = [
  { key: 'pen', label: 'Pen', icon: <CreateIcon />, hint: 'Freehand drawing' },
  {
    key: 'line',
    label: 'Line',
    icon: <HorizontalRuleIcon />,
    hint: 'Drag to draw a straight line',
  },
  {
    key: 'rect',
    label: 'Rectangle',
    icon: <RectangleOutlinedIcon />,
    hint: 'Drag a bounding box',
  },
  {
    key: 'ellipse',
    label: 'Ellipse',
    icon: <CircleOutlinedIcon />,
    hint: 'Drag a bounding box',
  },
  {
    key: 'polygon',
    label: 'Polygon',
    icon: <HexagonOutlinedIcon />,
    hint: 'Drag from center to a vertex',
  },
  {
    key: 'star',
    label: 'Star',
    icon: <StarBorderIcon />,
    hint: 'Drag from center to an outer point',
  },
];

const PRESET_COLORS = [
  '#000000',
  '#e53935',
  '#fb8c00',
  '#fdd835',
  '#43a047',
  '#00897b',
  '#1e88e5',
  '#3949ab',
  '#8e24aa',
  '#d81b60',
  '#6d4c41',
  '#757575',
];

export const BottomBar = () => {
  const {
    tool,
    setTool,
    polygonSides,
    setPolygonSides,
    starPoints,
    setStarPoints,
    zoom,
    setZoom,
    drawColor,
    setDrawColor,
  } = useUI();
  const { clearStrokes, undo, canUndo } = useStore();
  const { project } = useProject();
  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;
  const undoDisabled = isInteractive || !canUndo;
  const [scriptOpen, setScriptOpen] = useState(false);
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);

  const activeColor = drawColor;
  const setColor = (c: string) => setDrawColor(c);

  const onClear = () => {
    if (confirm('Clear all strokes? This cannot be undone in an interactive session.')) {
      clearStrokes();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== 'z') return;
      // Don't hijack while typing in inputs.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if (undoDisabled) return;
      e.preventDefault();
      undo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, undoDisabled]);

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 2,
        zIndex: 20,
      }}
    >
      {TOOLS.map((t) => (
        <Tooltip key={t.key} title={`${t.label} — ${t.hint}`}>
          <IconButton
            size="small"
            onClick={() => setTool(t.key)}
            sx={{
              border: '1px solid',
              borderColor: tool === t.key ? 'primary.main' : 'transparent',
              color: tool === t.key ? 'primary.main' : 'text.primary',
              borderRadius: 1,
            }}
          >
            {t.icon}
          </IconButton>
        </Tooltip>
      ))}

      {tool === 'polygon' && (
        <TextField
          label="sides"
          size="small"
          type="number"
          value={polygonSides}
          onChange={(e) => setPolygonSides(Math.max(3, Number.parseInt(e.target.value, 10) || 3))}
          slotProps={{ htmlInput: { min: 3, max: 32, style: { padding: 4, fontSize: 12 } } }}
          sx={{ width: 64, ml: 0.5 }}
        />
      )}
      {tool === 'star' && (
        <TextField
          label="pts"
          size="small"
          type="number"
          value={starPoints}
          onChange={(e) => setStarPoints(Math.max(3, Number.parseInt(e.target.value, 10) || 3))}
          slotProps={{ htmlInput: { min: 3, max: 32, style: { padding: 4, fontSize: 12 } } }}
          sx={{ width: 64, ml: 0.5 }}
        />
      )}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Color">
        <IconButton size="small" onClick={(e) => setColorAnchor(e.currentTarget)}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: activeColor,
              border: '1px solid rgba(0,0,0,0.3)',
            }}
          />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={() => setColorAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ p: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 0.5,
              mb: 1,
            }}
          >
            {PRESET_COLORS.map((c) => (
              <Box
                key={c}
                component="button"
                type="button"
                aria-label={c}
                onClick={() => {
                  setColor(c);
                  setColorAnchor(null);
                }}
                sx={{
                  width: 24,
                  height: 24,
                  p: 0,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  background: c,
                  border:
                    c.toLowerCase() === activeColor.toLowerCase()
                      ? '2px solid #1976d2'
                      : '1px solid rgba(0,0,0,0.3)',
                }}
              />
            ))}
          </Box>
          <Box
            component="label"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, cursor: 'pointer' }}
          >
            Custom
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 32, height: 24, border: 'none', background: 'none', padding: 0 }}
            />
          </Box>
        </Box>
      </Popover>

      {isInteractive && (
        <Tooltip title="Clear all strokes">
          <IconButton size="small" onClick={onClear}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Script — generate strokes from JS">
        <IconButton size="small" onClick={() => setScriptOpen(true)}>
          <CodeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip
        title={
          isInteractive
            ? 'Undo is disabled in interactive sessions'
            : canUndo
              ? 'Undo (⌘Z)'
              : 'Nothing to undo'
        }
      >
        <span>
          <IconButton size="small" onClick={undo} disabled={undoDisabled}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Zoom out">
        <IconButton
          size="small"
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z / 1.2))}
          disabled={zoom <= ZOOM_MIN + 1e-6}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset zoom">
        <Box
          component="button"
          type="button"
          onClick={() => setZoom(1)}
          sx={{
            minWidth: 52,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            color: 'text.secondary',
            px: 0.5,
          }}
        >
          {Math.round(zoom * 100)}%
        </Box>
      </Tooltip>
      <Tooltip title="Zoom in">
        <IconButton
          size="small"
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.2))}
          disabled={zoom >= ZOOM_MAX - 1e-6}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <ScriptDialog open={scriptOpen} onClose={() => setScriptOpen(false)} />
    </Paper>
  );
};
