import { CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomBar } from './components/BottomBar';
import { Canvas } from './components/Canvas';
import { LayersPanel } from './components/LayersPanel';
import { PrintModal } from './components/PrintModal';
import { ProjectGate } from './components/ProjectGate';
import { Toolbar } from './components/Toolbar';
import { ConnectionProvider, useConnection } from './connection';
import { useInteractiveSync } from './interactive';
import { PlottersProvider } from './plotters';
import { INTERACTIVE_PROJECT_ID, ProjectProvider, useProject } from './project';
import { StoreProvider } from './store';
import { UIProvider } from './ui';

const theme = createTheme({
  palette: { mode: 'light' },
  shape: { borderRadius: 6 },
});

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConnectionProvider>
        <StoreProvider>
          <PlottersProvider>
            <ProjectProvider>
              <UIProvider>
                <Root />
              </UIProvider>
            </ProjectProvider>
          </PlottersProvider>
        </StoreProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
};

const Root = () => {
  const { project } = useProject();
  const { log, showLog } = useConnection();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0 }}>{project ? <Shell /> : <ProjectGate />}</div>
      {showLog && <LogPanel lines={log} />}
    </div>
  );
};

const Shell = () => {
  const [printing, setPrinting] = useState(false);
  const { project } = useProject();
  const isInteractive = project?.id === INTERACTIVE_PROJECT_ID;
  useInteractiveSync();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar onPrint={() => setPrinting(true)} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {!isInteractive && <LayersPanel />}
        <Canvas />
      </div>
      <BottomBar />
      {printing && <PrintModal onClose={() => setPrinting(false)} />}
    </div>
  );
};

const LOG_HEIGHT_LS_KEY = 'paint-app:logHeight';
const MIN_LOG_HEIGHT = 60;

const LogPanel = ({ lines }: { lines: string[] }) => {
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
        borderTop: '1px solid #e0e0e0',
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
