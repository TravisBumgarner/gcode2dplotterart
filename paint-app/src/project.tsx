import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { db } from './db';
import { useStore } from './store';
import type { AppState } from './types';

const AUTOSAVE_LS_KEY = 'paint-app:autosave';
const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Reserved id for the singleton "Interactive" project. There can only be one
 * interactive session, so we key it by a fixed id rather than a fresh uid.
 */
export const INTERACTIVE_PROJECT_ID = '__interactive__';

export type ProjectMeta = { id: string; name: string };

type ProjectCtx = {
  project: ProjectMeta | null;
  setProject: (meta: ProjectMeta, initialState: AppState) => void;
  closeProject: () => void;
  renameProject: (name: string) => Promise<void>;
  deleteProject: () => Promise<void>;
  autosave: boolean;
  setAutosave: (v: boolean) => void;
  isDirty: boolean;
  isSaving: boolean;
  saveNow: () => Promise<void>;
};

const ProjectContext = createContext<ProjectCtx | null>(null);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { state, loadState } = useStore();
  const [project, setProjectState] = useState<ProjectMeta | null>(null);
  const [autosave, setAutosaveState] = useState<boolean>(() => {
    const raw = localStorage.getItem(AUTOSAVE_LS_KEY);
    return raw === null ? true : raw === '1';
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // After loadState, the next state-change effect would mark the project dirty
  // even though nothing user-visible changed. Suppress that one tick.
  const skipNextDirty = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we depend on state changing, not its contents
  useEffect(() => {
    if (!project) return;
    // Interactive sessions are ephemeral; never mark them dirty so we don't
    // autosave them or trip the beforeunload guard.
    if (project.id === INTERACTIVE_PROJECT_ID) return;
    if (skipNextDirty.current) {
      skipNextDirty.current = false;
      return;
    }
    setIsDirty(true);
  }, [state, project]);

  const setAutosave = useCallback((v: boolean) => {
    setAutosaveState(v);
    localStorage.setItem(AUTOSAVE_LS_KEY, v ? '1' : '0');
  }, []);

  const setProject = useCallback(
    (meta: ProjectMeta, initialState: AppState) => {
      skipNextDirty.current = true;
      loadState(initialState);
      setProjectState(meta);
      setIsDirty(false);
    },
    [loadState],
  );

  const closeProject = useCallback(() => {
    setProjectState(null);
    setIsDirty(false);
  }, []);

  const saveNow = useCallback(async () => {
    if (!project || project.id === INTERACTIVE_PROJECT_ID) return;
    setIsSaving(true);
    try {
      await db.projects.update(project.id, {
        state,
        updatedAt: Date.now(),
      });
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [project, state]);

  const renameProject = useCallback(
    async (name: string) => {
      if (!project || project.id === INTERACTIVE_PROJECT_ID) return;
      await db.projects.update(project.id, { name, updatedAt: Date.now() });
      setProjectState({ ...project, name });
    },
    [project],
  );

  const deleteProject = useCallback(async () => {
    if (!project || project.id === INTERACTIVE_PROJECT_ID) return;
    await db.projects.delete(project.id);
    setProjectState(null);
    setIsDirty(false);
  }, [project]);

  // Debounced autosave.
  useEffect(() => {
    if (!autosave || !isDirty || !project) return;
    if (project.id === INTERACTIVE_PROJECT_ID) return;
    const t = setTimeout(() => {
      saveNow();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [autosave, isDirty, project, saveNow]);

  // beforeunload guard while there are unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty || isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, isSaving]);

  const value = useMemo<ProjectCtx>(
    () => ({
      project,
      setProject,
      closeProject,
      renameProject,
      deleteProject,
      autosave,
      setAutosave,
      isDirty,
      isSaving,
      saveNow,
    }),
    [
      project,
      setProject,
      closeProject,
      renameProject,
      deleteProject,
      autosave,
      setAutosave,
      isDirty,
      isSaving,
      saveNow,
    ],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};
