import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type ConnectPhase, PlotterConnection } from './serial';

/** Exposed by electron/preload.cts; absent when running in a plain browser. */
declare global {
  interface Window {
    desktop?: { onMainLog: (handler: (line: string) => void) => () => void };
  }
}

const SHOW_LOG_LS_KEY = 'paint-app:showLog';

type ConnectionCtx = {
  connection: PlotterConnection;
  connected: boolean;
  connecting: boolean;
  connectPhase: ConnectPhase | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Last connect failure message, surfaced as a modal. Null when none. */
  connectError: string | null;
  dismissConnectError: () => void;
  /** Global pause: gates all G-code output (print + interactive). */
  paused: boolean;
  pause: () => void;
  resume: () => void;
  /** Fire M112 and tear down the (now-killed) connection. */
  emergencyStop: () => Promise<void>;
  /** True after an emergency stop until acknowledged; the board needs a
   * power cycle before it will respond again. */
  emergencyStopped: boolean;
  acknowledgeEmergencyStop: () => void;
  log: string[];
  showLog: boolean;
  setShowLog: (v: boolean) => void;
};

const ConnectionContext = createContext<ConnectionCtx | null>(null);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [connectPhase, setConnectPhase] = useState<ConnectPhase | null>(null);
  const [emergencyStopped, setEmergencyStopped] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [showLog, setShowLogState] = useState<boolean>(() => {
    const raw = localStorage.getItem(SHOW_LOG_LS_KEY);
    return raw === '1';
  });

  const setShowLog = useCallback((v: boolean) => {
    setShowLogState(v);
    localStorage.setItem(SHOW_LOG_LS_KEY, v ? '1' : '0');
  }, []);

  const connection = useMemo(
    () =>
      new PlotterConnection(
        (line, kind) => {
          const prefix = kind === 'tx' ? '> ' : kind === 'rx' ? '  ' : kind === 'err' ? '! ' : '· ';
          const ts = (performance.now() / 1000).toFixed(3).padStart(8, ' ');
          setLog((prev) => [...prev.slice(-200), `${ts}  ${prefix}${line}`]);
        },
        (phase) => setConnectPhase(phase),
        () => {
          // Device lost / board killed outside an intentional disconnect.
          setConnected(false);
          setConnectPhase(null);
        },
        (p) => setPaused(p),
      ),
    [],
  );

  // Port enumeration and picking happen in Electron's main process, so those
  // lines never reach this log on their own — the desktop bridge feeds them in.
  useEffect(() => {
    if (!window.desktop) return;
    return window.desktop.onMainLog((line) => {
      const ts = (performance.now() / 1000).toFixed(3).padStart(8, ' ');
      setLog((prev) => [...prev.slice(-200), `${ts}  · ${line}`]);
    });
  }, []);

  const connect = useCallback(async () => {
    setConnectPhase('connecting');
    setConnectError(null);
    try {
      await connection.connect();
      setConnected(true);
    } catch (e) {
      setConnectError((e as Error).message);
    } finally {
      setConnectPhase(null);
    }
  }, [connection]);

  const disconnect = useCallback(async () => {
    await connection.disconnect();
    setConnected(false);
  }, [connection]);

  const emergencyStop = useCallback(async () => {
    setEmergencyStopped(true);
    try {
      await connection.emergencyStop();
    } finally {
      // M112 kills the firmware; the port is dead until the board is
      // reconnected. Tear down so the UI shows disconnected immediately.
      await connection.disconnect().catch(() => {});
      setConnected(false);
      setConnectPhase(null);
    }
  }, [connection]);

  const value = useMemo<ConnectionCtx>(
    () => ({
      connection,
      connected,
      connecting: connectPhase !== null,
      connectPhase,
      connect,
      disconnect,
      connectError,
      dismissConnectError: () => setConnectError(null),
      paused,
      pause: () => connection.pause(),
      resume: () => connection.resume(),
      emergencyStop,
      emergencyStopped,
      acknowledgeEmergencyStop: () => setEmergencyStopped(false),
      log,
      showLog,
      setShowLog,
    }),
    [
      connection,
      connected,
      connectPhase,
      connect,
      disconnect,
      connectError,
      paused,
      emergencyStop,
      emergencyStopped,
      log,
      showLog,
      setShowLog,
    ],
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
};

export const useConnection = () => {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider');
  return ctx;
};
