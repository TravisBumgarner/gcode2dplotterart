import CheckIcon from '@mui/icons-material/Check';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { createDrawAPI, runScript } from '../script-api';
import { useStore } from '../store';
import type { Point } from '../types';
import { useUI } from '../ui';

const STORAGE_KEY = 'paint-app:script';
const PREVIEW_DEBOUNCE_MS = 250;

const SAMPLE = `// page-local mm; (0,0) is top-left of the active page.
// loops, math, variables — all standard JS.

repeat(8, (i) => {
  const r = 10 + i * 8;
  circle(80, 80, r);
});

for (let i = 0; i < 5; i++) {
  square(10 + i * 12, 10, 10);
}

// rect(x, y, w, h)        // square(x, y, size)
// line(x1, y1, x2, y2)
// ellipse(cx, cy, rx, ry)  // circle(cx, cy, r)
// polygon(cx, cy, r, sides, rotation?)
// star(cx, cy, r, points)
// path([{x, y}, ...])      // repeat(n, fn)
`;

const REFERENCE = [
  'rect(x, y, w, h)',
  'square(x, y, size)',
  'line(x1, y1, x2, y2)',
  'ellipse(cx, cy, rx, ry)',
  'circle(cx, cy, r)',
  'polygon(cx, cy, r, sides, rotation?)',
  'star(cx, cy, r, points)',
  'path([{x, y}, ...])',
  'repeat(n, fn)',
  '— Math, for, while, etc. all available',
];

type Props = { open: boolean; onClose: () => void };

export const ScriptDialog = ({ open, onClose }: Props) => {
  const { state, addStroke } = useStore();
  const { drawColor, scriptPreview, setScriptPreview } = useUI();
  const [code, setCode] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? SAMPLE);
  const [error, setError] = useState<string | null>(null);

  const activeLayer = state.layers.find((l) => l.id === state.activeLayerId);
  const activePage = state.pages.find((p) => p.id === state.activePageId);

  // Recompute the preview after the user stops typing (debounced). On error
  // we keep the previous preview so the canvas doesn't flicker mid-typo.
  useEffect(() => {
    if (!open || !activePage) return;
    const handle = setTimeout(() => {
      const collected: Point[][] = [];
      const api = createDrawAPI(activePage, (points) => {
        collected.push(points);
      });
      try {
        runScript(code, api);
        setScriptPreview(collected);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [code, open, activePage, setScriptPreview]);

  // Drop the preview when the dialog closes via any path.
  useEffect(() => {
    if (!open) setScriptPreview(null);
  }, [open, setScriptPreview]);

  const onCancel = () => {
    setScriptPreview(null);
    onClose();
  };

  const onCommit = () => {
    if (!activeLayer) {
      setError('No active layer.');
      return;
    }
    if (!scriptPreview) return;
    for (const points of scriptPreview) {
      addStroke(activeLayer.id, points, drawColor);
    }
    localStorage.setItem(STORAGE_KEY, code);
    setScriptPreview(null);
    onClose();
  };

  const liveCount = scriptPreview?.length ?? 0;

  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="md">
      <DialogTitle>Script</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              multiline
              minRows={14}
              maxRows={24}
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value)}
              slotProps={{
                input: {
                  sx: {
                    fontFamily: 'ui-monospace, Menlo, monospace',
                    fontSize: 13,
                    lineHeight: 1.5,
                  },
                },
              }}
            />
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Alert severity="info">
                Preview: <strong>{liveCount}</strong> stroke{liveCount === 1 ? '' : 's'} (dashed
                ghost on the canvas). Click OK to commit to{' '}
                <strong>{activeLayer?.name ?? 'layer'}</strong>.
              </Alert>
            )}
          </Box>
          <Box sx={{ width: 220 }}>
            <Typography variant="overline" color="text.secondary">
              API
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 11,
                lineHeight: 1.6,
                color: 'text.secondary',
                whiteSpace: 'pre-wrap',
              }}
            >
              {REFERENCE.join('\n')}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Coordinates are mm, with (0, 0) at the top-left of the active page. The preview
              re-renders ~{PREVIEW_DEBOUNCE_MS}ms after each keystroke.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<CheckIcon />}
          onClick={onCommit}
          disabled={!!error || liveCount === 0}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
