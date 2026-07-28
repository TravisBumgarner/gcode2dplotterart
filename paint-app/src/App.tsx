import { Alert, useTheme } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomBar } from './components/BottomBar';
import { Canvas } from './components/Canvas';
import { LayersPanel } from './components/LayersPanel';
import { type PhotoResult, PhotoStudio } from './components/PhotoStudio';
import { PrintModal } from './components/PrintModal';
import { ProjectGate } from './components/ProjectGate';
import { Toolbar } from './components/Toolbar';
import { ConnectedDataProvider, useConnectedDataSync } from './connectedDataSession';
import { ConnectionProvider, useConnection } from './connection';
import { useInteractiveSync } from './interactive';
import { createPhotoProject } from './photoProject';
import { PlottersProvider, usePlotters } from './plotters';
import { INTERACTIVE_PROJECT_ID, ProjectProvider, useProject } from './project';
import { StoreProvider } from './store';
import { AppThemeProvider } from './theme';
import { UIProvider } from './ui';

export const App = () => {
  return (
    <AppThemeProvider>
      <ConnectionProvider>
        <StoreProvider>
          <PlottersProvider>
            <ProjectProvider>
              <UIProvider>
                <ConnectedDataProvider>
                  <Root />
                </ConnectedDataProvider>
              </UIProvider>
            </ProjectProvider>
          </PlottersProvider>
        </StoreProvider>
      </ConnectionProvider>
    </AppThemeProvider>
  );
};

const Root = () => {
  const { project, setProject } = useProject();
  const { log, showLog } = useConnection();
  const [printing, setPrinting] = useState(false);
  // Which full-page util has taken over the view, if any. Root owns this so
  // the top bar can show its title and back button in the same row.
  const [util, setUtil] = useState<'photo' | null>(null);
  // Lives at Root, not in Shell: the poll loop has to keep running across
  // anything that remounts the document view.
  useConnectedDataSync();

  const onCreatePhoto = async (result: PhotoResult) => {
    const { project: created, state } = await createPhotoProject(result);
    setUtil(null);
    setProject({ id: created.id, name: created.name }, state);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* One bar for the whole app: plotter selection and the connection are
          global, so they must outlive the document being open or closed. */}
      <Toolbar
        onPrint={() => setPrinting(true)}
        utilTitle={util === 'photo' ? 'Photo processing' : null}
        onExitUtil={() => setUtil(null)}
      />
      <div style={{ flex: 1, minHeight: 0 }}>
        {util === 'photo' ? (
          <PhotoStudio onCreate={onCreatePhoto} />
        ) : project ? (
          <Shell />
        ) : (
          <ProjectGate onOpenPhoto={() => setUtil('photo')} />
        )}
      </div>
      {showLog && <LogPanel lines={log} />}
      {printing && project && <PrintModal onClose={() => setPrinting(false)} />}
    </div>
  );
};

const Shell = () => {
  const { project } = useProject();
  const { activePlotter } = usePlotters();
  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;
  useInteractiveSync();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!activePlotter && (
        <Alert severity="info" square>
          No plotter configured — drawing works, but nothing can be sent. Choose{' '}
          <strong>Add plotter</strong> in the top bar when you're ready to plot.
        </Alert>
      )}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {!isInteractive && <LayersPanel />}
        <Canvas />
      </div>
      <BottomBar />
    </div>
  );
};

const LOG_HEIGHT_LS_KEY = 'paint-app:logHeight';
const MIN_LOG_HEIGHT = 60;

const LogPanel = ({ lines }: { lines: string[] }) => {
  const theme = useTheme();
  const [height, setHeight] = useState(() => {
    const raw = Number(localStorage.getItem(LOG_HEIGHT_LS_KEY));
    return raw >= MIN_LOG_HEIGHT ? raw : 120;
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Always pin to the bottom so the newest line is in view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on each new line
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const onHandleDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = e.currentTarget.parentElement?.offsetHeight ?? 120;
    const onMove = (ev: MouseEvent) => {
      const max = window.innerHeight * 0.8;
      const next = Math.min(max, Math.max(MIN_LOG_HEIGHT, startHeight + (startY - ev.clientY)));
      setHeight(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setHeight((h) => {
        localStorage.setItem(LOG_HEIGHT_LS_KEY, String(Math.round(h)));
        return h;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div
      style={{
        height,
        borderTop: `1px solid ${theme.palette.divider}`,
        background: '#111',
        color: '#ddd',
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-resize handle */}
      <div
        onMouseDown={onHandleDown}
        title="Drag to resize log"
        style={{
          height: 8,
          cursor: 'ns-resize',
          background: '#222',
          borderBottom: '1px solid #333',
          flexShrink: 0,
        }}
      />
      <div ref={scrollRef} style={{ padding: 8, overflowY: 'auto', whiteSpace: 'pre', flex: 1 }}>
        {lines.length === 0 ? <span style={{ color: '#666' }}>log…</span> : lines.join('\n')}
      </div>
    </div>
  );
};
