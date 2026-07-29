import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  IconButton,
  InputBase,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Reorder } from 'framer-motion';
import { useStore } from '../store';
import type { Layer } from '../types';

export const LayersPanel = () => {
  const theme = useTheme();
  const { state, addLayer, removeLayer, setActiveLayer, updateLayer, reorderLayers } = useStore();
  const { layers, activeLayerId } = state;

  // Reorder renders top-to-bottom; we display top of stack first (last in array reversed).
  const orderedTopFirst = [...layers].reverse();

  const onReorder = (next: Layer[]) => {
    reorderLayers(
      next
        .slice()
        .reverse()
        .map((l) => l.id),
    );
  };

  return (
    <Box
      sx={{
        width: 240,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="overline" color="text.secondary">
          Layers
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addLayer}>
          Add
        </Button>
      </Box>
      <Reorder.Group
        axis="y"
        values={orderedTopFirst}
        onReorder={onReorder}
        style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, overflowY: 'auto' }}
      >
        {orderedTopFirst.map((layer) => {
          const isActive = layer.id === activeLayerId;
          return (
            <Reorder.Item
              key={layer.id}
              value={layer}
              style={{
                padding: 10,
                borderBottom: `1px solid ${theme.palette.divider}`,
                background: isActive
                  ? theme.palette.action.selected
                  : theme.palette.background.paper,
                cursor: 'grab',
              }}
              onPointerDown={() => setActiveLayer(layer.id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <input
                  type="color"
                  value={layer.color}
                  onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    width: 22,
                    height: 22,
                    border: 'none',
                    padding: 0,
                    background: 'none',
                    cursor: 'pointer',
                  }}
                />
                <InputBase
                  value={layer.name}
                  onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  sx={{ flex: 1, fontWeight: 600, fontSize: 14 }}
                />
                <Tooltip title={layer.visible ? 'Hide' : 'Show'}>
                  <IconButton
                    size="small"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                  >
                    {layer.visible ? (
                      <VisibilityIcon fontSize="small" />
                    ) : (
                      <VisibilityOffIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  thickness
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={layer.thickness}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    updateLayer(layer.id, { thickness: Number.parseFloat(e.target.value) || 0.1 })
                  }
                  slotProps={{
                    htmlInput: { step: 0.1, min: 0.1, style: { padding: 4, width: 50 } },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  mm
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton
                  size="small"
                  color="error"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${layer.name}?`)) removeLayer(layer.id);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </Box>
  );
};
