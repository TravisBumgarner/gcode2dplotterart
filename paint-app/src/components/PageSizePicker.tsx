import {
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { formatSize, type PageSize, plotterPageSize, STANDARD_SIZES } from '../pageSizes';
import { usePlotters } from '../plotters';

const CUSTOM_KEY = 'custom';

type Props = {
  value: PageSize;
  onChange: (size: PageSize) => void;
  label?: string;
  minWidth?: number;
};

/**
 * Page size as a single dropdown over plotter beds and standard papers, with
 * hand-entered dimensions as the fallback. The selected key is derived from
 * the value rather than stored, so the control has no state to get out of sync
 * — except the deliberate choice to sit on Custom while typing a size that
 * happens to coincide with a preset.
 */
export const PageSizePicker = ({ value, onChange, label = 'Page size', minWidth = 200 }: Props) => {
  const { plotters } = usePlotters();
  const [forceCustom, setForceCustom] = useState(false);

  const options = useMemo(() => {
    const fromPlotters = plotters.map((p) => ({
      key: `plotter:${p.id}`,
      group: 'From a plotter',
      label: `${p.name} (bed)`,
      size: plotterPageSize(p),
    }));
    const standard = STANDARD_SIZES.map((s) => ({
      key: `std:${s.label}`,
      group: 'Standard',
      label: s.label,
      size: s.size,
    }));
    return [...fromPlotters, ...standard];
  }, [plotters]);

  const matched = options.find(
    (o) => o.size.width === value.width && o.size.height === value.height,
  );
  const sizeKey = forceCustom || !matched ? CUSTOM_KEY : matched.key;

  const fromPlotters = options.filter((o) => o.group === 'From a plotter');
  const standard = options.filter((o) => o.group === 'Standard');

  return (
    <Stack spacing={1.5}>
      <FormControl size="small" sx={{ minWidth }}>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={sizeKey}
          onChange={(e) => {
            const key = e.target.value;
            if (key === CUSTOM_KEY) {
              setForceCustom(true);
              return;
            }
            setForceCustom(false);
            const option = options.find((o) => o.key === key);
            if (option) onChange(option.size);
          }}
        >
          {fromPlotters.length > 0 && <ListSubheader>From a plotter</ListSubheader>}
          {fromPlotters.map((o) => (
            <MenuItem key={o.key} value={o.key}>
              {o.label} — {formatSize(o.size)}
            </MenuItem>
          ))}
          <ListSubheader>Standard</ListSubheader>
          {standard.map((o) => (
            <MenuItem key={o.key} value={o.key}>
              {o.label} — {formatSize(o.size)}
            </MenuItem>
          ))}
          <ListSubheader>Other</ListSubheader>
          <MenuItem value={CUSTOM_KEY}>Custom…</MenuItem>
        </Select>
      </FormControl>

      {sizeKey === CUSTOM_KEY && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            type="number"
            label="Width (mm)"
            value={value.width}
            onChange={(e) => onChange({ ...value, width: Number.parseFloat(e.target.value) || 0 })}
            sx={{ width: 130 }}
          />
          <Typography color="text.secondary">×</Typography>
          <TextField
            size="small"
            type="number"
            label="Height (mm)"
            value={value.height}
            onChange={(e) => onChange({ ...value, height: Number.parseFloat(e.target.value) || 0 })}
            sx={{ width: 130 }}
          />
        </Stack>
      )}
    </Stack>
  );
};
