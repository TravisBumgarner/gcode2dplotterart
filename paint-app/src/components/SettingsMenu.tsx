import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import PrintIcon from '@mui/icons-material/Print';
import RemoveIcon from '@mui/icons-material/Remove';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import TerminalIcon from '@mui/icons-material/Terminal';
import UploadIcon from '@mui/icons-material/Upload';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import { type FC, useRef, useState } from 'react';
import { useConnection } from '../connection';
import { db, type Project } from '../db';
import { usePlotters } from '../plotters';
import { INTERACTIVE_PROJECT_ID, useProject } from '../project';
import { useStore } from '../store';
import { AppStateSchema, PlotterSchema } from '../types';
import { GRID_SIZE_MAX, GRID_SIZE_MIN, useUI } from '../ui';
import { PlottersModal } from './PlottersModal';

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Everything a menu item might need. The container builds one of these and
 * passes it to every item; items pick what they use. Keeps item components
 * pure and the MENUS config a plain list of component references.
 */
type MenuCtx = {
  close: () => void;
  isInteractive: boolean;
  // view toggles
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  gridSize: number;
  setGridSize: (n: number) => void;
  showLog: boolean;
  setShowLog: (v: boolean) => void;
  // project file ops
  autosave: boolean;
  setAutosave: (v: boolean) => void;
  isDirty: boolean;
  isSaving: boolean;
  statusHint: string | null;
  saveNow: () => Promise<void>;
  onExport: () => void;
  openImport: () => void;
  startRename: () => void;
  onDelete: () => void;
  onSwitch: () => void;
  openPlotters: () => void;
};

type MenuItemComponent = FC<{ ctx: MenuCtx }>;

// ─── Menu items ──────────────────────────────────────────────────────────
// One functional component per item. Add a new item here, then list it in
// MENUS below for whichever menus should render it.

const AutosaveItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={() => ctx.setAutosave(!ctx.autosave)}>
    <ListItemIcon>
      <Checkbox edge="start" checked={ctx.autosave} disableRipple sx={{ p: 0 }} />
    </ListItemIcon>
    <ListItemText primary="Autosave" />
  </MenuItem>
);

const ShowGridItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={() => ctx.setShowGrid(!ctx.showGrid)}>
    <ListItemIcon>
      <Checkbox edge="start" checked={ctx.showGrid} disableRipple sx={{ p: 0 }} />
    </ListItemIcon>
    <ListItemText primary="Show grid" />
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
      <Tooltip title="Smaller grid">
        <span>
          <IconButton
            size="small"
            disabled={ctx.gridSize <= GRID_SIZE_MIN}
            onClick={(e) => {
              e.stopPropagation();
              ctx.setGridSize(ctx.gridSize - 1);
            }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <span style={{ minWidth: 36, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
        {ctx.gridSize}mm
      </span>
      <Tooltip title="Larger grid">
        <span>
          <IconButton
            size="small"
            disabled={ctx.gridSize >= GRID_SIZE_MAX}
            onClick={(e) => {
              e.stopPropagation();
              ctx.setGridSize(ctx.gridSize + 1);
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </span>
  </MenuItem>
);

const ShowLogItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={() => ctx.setShowLog(!ctx.showLog)}>
    <ListItemIcon>
      <Checkbox edge="start" checked={ctx.showLog} disableRipple sx={{ p: 0 }} />
    </ListItemIcon>
    <ListItemText primary="Show logs" />
    <TerminalIcon fontSize="small" sx={{ ml: 1, color: 'text.disabled' }} />
  </MenuItem>
);

const SaveNowItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem
    onClick={async () => {
      await ctx.saveNow();
      ctx.close();
    }}
    disabled={!ctx.isDirty || ctx.isSaving}
  >
    <ListItemIcon>
      <SaveIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary="Save now" secondary={ctx.statusHint ?? undefined} />
  </MenuItem>
);

const PlottersItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={ctx.openPlotters}>
    <ListItemIcon>
      <PrintIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary="Plotters…" />
  </MenuItem>
);

const ExportItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={ctx.onExport}>
    <ListItemIcon>
      <DownloadIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary="Export project to file…" />
  </MenuItem>
);

const ImportItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={ctx.openImport}>
    <ListItemIcon>
      <UploadIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary="Import project from file…" />
  </MenuItem>
);

const RenameItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={ctx.startRename}>
    <ListItemIcon>
      <EditIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary="Rename project" />
  </MenuItem>
);

const DeleteItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={ctx.onDelete}>
    <ListItemIcon>
      <DeleteOutlineIcon fontSize="small" color="error" />
    </ListItemIcon>
    <ListItemText primary="Delete project" />
  </MenuItem>
);

const CloseItem: MenuItemComponent = ({ ctx }) => (
  <MenuItem onClick={ctx.onSwitch}>
    <ListItemIcon>
      <LogoutIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary={ctx.isInteractive ? 'Close' : 'Close / switch project'} />
  </MenuItem>
);

// ─── Which items each menu renders ───────────────────────────────────────
// Inner arrays are visual groups; a divider is drawn between groups. Edit
// this table to change what shows up where.

type MenuKind = 'home' | 'project' | 'interactive';

const MENUS: Record<MenuKind, MenuItemComponent[][]> = {
  home: [[ShowLogItem], [ImportItem]],
  project: [
    [AutosaveItem, ShowGridItem, ShowLogItem, SaveNowItem],
    [PlottersItem],
    [ExportItem, ImportItem],
    [RenameItem, DeleteItem],
    [CloseItem],
  ],
  interactive: [[ShowGridItem, ShowLogItem], [PlottersItem], [CloseItem]],
};

const itemKey = (Comp: MenuItemComponent) => Comp.displayName ?? Comp.name;

// ─── Container ───────────────────────────────────────────────────────────

export const SettingsMenu = () => {
  const { state } = useStore();
  const { ingestPlotter, getPlotter } = usePlotters();
  const { showLog, setShowLog } = useConnection();
  const { showGrid, setShowGrid, gridSize, setGridSize } = useUI();
  const {
    project,
    autosave,
    setAutosave,
    saveNow,
    isDirty,
    isSaving,
    closeProject,
    renameProject,
    deleteProject,
    setProject,
  } = useProject();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [plottersOpen, setPlottersOpen] = useState(false);
  const importRef = useRef<HTMLInputElement | null>(null);

  const open = Boolean(anchor);
  const close = () => setAnchor(null);
  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;
  const menuKind: MenuKind = !project ? 'home' : isInteractive ? 'interactive' : 'project';

  const onExport = () => {
    if (!project) return;
    const plotter = getPlotter(state.plotterId);
    const payload = {
      version: 2,
      name: project.name,
      state,
      plotter: plotter ?? null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9-_ ]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    close();
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const importedState = AppStateSchema.parse(parsed?.state);

      // If the export bundled a plotter snapshot, ingest it so the imported
      // project's plotterId resolves locally.
      const rawPlotter = parsed?.plotter;
      if (rawPlotter) {
        const plotterParsed = PlotterSchema.safeParse(rawPlotter);
        if (plotterParsed.success) {
          await ingestPlotter(plotterParsed.data);
        }
      }

      const importedName: string =
        typeof parsed?.name === 'string' && parsed.name.trim() ? parsed.name : file.name;
      const now = Date.now();
      const next: Project = {
        id: uid(),
        name: importedName,
        state: importedState,
        createdAt: now,
        updatedAt: now,
      };
      await db.projects.put(next);
      setProject({ id: next.id, name: next.name }, next.state);
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
    close();
  };

  const startRename = () => {
    if (!project) return;
    setNewName(project.name);
    setRenaming(true);
    close();
  };

  const submitRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await renameProject(trimmed);
    setRenaming(false);
  };

  const onDelete = async () => {
    if (!project) return;
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await deleteProject();
    close();
  };

  const onSwitch = async () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Switch projects anyway?')) {
        close();
        return;
      }
    }
    closeProject();
    close();
  };

  const statusHint = !project
    ? null
    : isSaving
      ? 'Saving…'
      : isDirty
        ? autosave
          ? 'Saving soon'
          : 'Unsaved changes'
        : 'Saved';

  const ctx: MenuCtx = {
    close,
    isInteractive,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    showLog,
    setShowLog,
    autosave,
    setAutosave,
    isDirty,
    isSaving,
    statusHint,
    saveNow,
    onExport,
    openImport: () => importRef.current?.click(),
    startRename,
    onDelete,
    onSwitch,
    openPlotters: () => {
      setPlottersOpen(true);
      close();
    },
  };

  const groups = MENUS[menuKind];

  return (
    <>
      <Tooltip title={statusHint ?? 'Settings'}>
        <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)} edge="start">
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={open} onClose={close}>
        {groups.flatMap((group, i) => {
          const items = group.map((Comp) => <Comp key={itemKey(Comp)} ctx={ctx} />);
          return i === 0
            ? items
            : [
                // biome-ignore lint/suspicious/noArrayIndexKey: groups are a fixed, ordered list
                <Divider key={`divider-${i}`} />,
                ...items,
              ];
        })}
      </Menu>

      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImportFile(f);
          e.target.value = '';
        }}
      />

      <Dialog open={renaming} onClose={() => setRenaming(false)}>
        <DialogTitle>Rename project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitRename()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenaming(false)}>Cancel</Button>
          <Button onClick={submitRename} variant="contained" disabled={!newName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <PlottersModal open={plottersOpen} onClose={() => setPlottersOpen(false)} />
    </>
  );
};
