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
import type {
  ConnectionStatus,
  ConnectPhase,
  JobStatus,
  LogLine,
  PortInfo,
  SessionStatus,
  SocketState,
} from './plotterClient';
import { PlotterClient } from './plotterClient';

const SHOW_LOG_LS_KEY = 'paint-app:showLog';
const PORT_LS_KEY = 'paint-app:portPath';
const NAME_LS_KEY = 'paint-app:clientName';
const MAX_LOG_LINES = 400;

/**
 * The server serves this page, so same-origin is the answer in production and
 * in the container. `VITE_PLOTTER_URL` exists for pointing a `vite dev` session
 * straight at a Pi; the dev proxy in `vite.config.ts` covers the usual case.
 */
const plotterBaseUrl = () =>
  (import.meta.env.VITE_PLOTTER_URL as string | undefined) || window.location.origin;

const IDLE_CONNECTION: ConnectionStatus = {
  connected: false,
  connecting: false,
  phase: null,
  portPath: null,
  paused: false,
  emergencyStopped: false,
};

/**
 * Something readable in the session list, so "someone else has control" can
 * name a someone. Sticky per browser; nobody is asked to type it.
 */
const defaultClientName = () => {
  const existing = localStorage.getItem(NAME_LS_KEY);
  if (existing) return existing;
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Mac OS X/.test(ua)
        ? 'Mac'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'browser';
  const name = `${os}-${Math.random().toString(36).slice(2, 6)}`;
  localStorage.setItem(NAME_LS_KEY, name);
  return name;
};

type ConnectionCtx = {
  client: PlotterClient;
  /** The page's link to the plotter server, not the server's link to the plotter. */
  socket: SocketState;
  serverReachable: boolean;

  connected: boolean;
  connecting: boolean;
  connectPhase: ConnectPhase | null;
  /** The port the *server* is holding open, if any. */
  portPath: string | null;
  /** Connect to `portPath`, or to the last-used port when omitted. */
  connect: (portPath?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  connectError: string | null;
  dismissConnectError: () => void;

  /** Ports the server can see. Replaces the browser's native port picker. */
  ports: PortInfo[];
  portsLoading: boolean;
  portsError: string | null;
  refreshPorts: () => Promise<void>;
  selectedPortPath: string | null;
  setSelectedPortPath: (path: string) => void;

  /** Global pause: gates job output and interactive strokes alike. */
  paused: boolean;
  pause: () => Promise<void>;
  resume: () => Promise<void>;

  emergencyStop: () => Promise<void>;
  /** Set by the server from an M112 until the next successful connect. */
  emergencyStopped: boolean;
  acknowledgeEmergencyStop: () => void;

  /** The job the server is running, whoever started it. */
  job: JobStatus | null;

  /** Who is in the session, and which one of them may move the machine. */
  session: SessionStatus | null;
  clientId: string | null;
  isController: boolean;
  controllerName: string | null;
  takeControl: () => Promise<void>;
  releaseControl: () => Promise<void>;

  log: string[];
  showLog: boolean;
  setShowLog: (v: boolean) => void;
};

const ConnectionContext = createContext<ConnectionCtx | null>(null);

const formatLog = (l: LogLine) => {
  const prefix = l.kind === 'tx' ? '> ' : l.kind === 'rx' ? '  ' : l.kind === 'err' ? '! ' : '· ';
  const ts = new Date(l.t).toLocaleTimeString([], { hour12: false });
  return `${ts}  ${prefix}${l.line}`;
};

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<SocketState>('connecting');
  const [connection, setConnection] = useState<ConnectionStatus>(IDLE_CONNECTION);
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [stopAcknowledged, setStopAcknowledged] = useState(true);
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [portsLoading, setPortsLoading] = useState(false);
  const [portsError, setPortsError] = useState<string | null>(null);
  const [selectedPortPath, setSelectedPortPathState] = useState<string | null>(() =>
    localStorage.getItem(PORT_LS_KEY),
  );
  const [log, setLog] = useState<string[]>([]);
  const [showLog, setShowLogState] = useState<boolean>(
    () => localStorage.getItem(SHOW_LOG_LS_KEY) === '1',
  );

  const setShowLog = useCallback((v: boolean) => {
    setShowLogState(v);
    localStorage.setItem(SHOW_LOG_LS_KEY, v ? '1' : '0');
  }, []);

  const setSelectedPortPath = useCallback((path: string) => {
    setSelectedPortPathState(path);
    localStorage.setItem(PORT_LS_KEY, path);
  }, []);

  const client = useMemo(
    () =>
      new PlotterClient({
        baseUrl: plotterBaseUrl(),
        name: defaultClientName(),
        onSocket: setSocket,
        onConnection: setConnection,
        onSession: (s, self) => {
          setSession(s);
          setClientId(self);
        },
        onJob: setJob,
        onLog: (lines) =>
          setLog((prev) => [...prev, ...lines.map(formatLog)].slice(-MAX_LOG_LINES)),
        onLost: () => setConnectError('The plotter dropped off the port.'),
      }),
    [],
  );

  useEffect(() => {
    client.start();
    return () => client.stop();
  }, [client]);

  // `tx`/`rx` is thousands of lines per print and every one of them crosses the
  // network, so it is only streamed while the log panel is actually open.
  useEffect(() => {
    client.setLogKinds(showLog ? ['tx', 'rx', 'info', 'err'] : ['info', 'err']);
  }, [client, showLog]);

  // A fresh M112 needs acknowledging; a stale one that the server already
  // cleared (a successful reconnect) does not.
  const emergencyStopped = connection.emergencyStopped;
  const prevStopped = useRef(emergencyStopped);
  useEffect(() => {
    if (emergencyStopped && !prevStopped.current) setStopAcknowledged(false);
    prevStopped.current = emergencyStopped;
  }, [emergencyStopped]);

  const refreshPorts = useCallback(async () => {
    setPortsLoading(true);
    setPortsError(null);
    try {
      const found = await client.listPorts();
      setPorts(found);
      // Default to the server's best guess so the common one-plotter case is
      // a single click, the way the native picker used to be.
      setSelectedPortPathState((current) => {
        if (current && found.some((p) => p.path === current)) return current;
        return found[0]?.path ?? current;
      });
    } catch (e) {
      setPortsError((e as Error).message);
    } finally {
      setPortsLoading(false);
    }
  }, [client]);

  // Enumerate as soon as the server is reachable, and again after a reconnect
  // — a replugged plotter is exactly when the list is wrong.
  useEffect(() => {
    if (socket === 'open') void refreshPorts();
  }, [socket, refreshPorts]);

  const connect = useCallback(
    async (portPath?: string) => {
      const target = portPath ?? selectedPortPath ?? ports[0]?.path;
      if (!target) {
        setConnectError(
          'No serial ports found. Check that the plotter is plugged into the server and powered on.',
        );
        return;
      }
      setConnectError(null);
      try {
        await client.connect(target);
        setSelectedPortPath(target);
      } catch (e) {
        setConnectError((e as Error).message);
      }
    },
    [client, ports, selectedPortPath, setSelectedPortPath],
  );

  const disconnect = useCallback(async () => {
    try {
      await client.disconnect();
    } catch (e) {
      setConnectError((e as Error).message);
    }
  }, [client]);

  /**
   * Every command can be refused — the server is the authority and this client
   * may be read-only. Surfacing the refusal beats an unhandled rejection and a
   * button that silently does nothing.
   */
  const attempt = useCallback(async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      setConnectError((e as Error).message);
    }
  }, []);

  const emergencyStop = useCallback(async () => {
    setStopAcknowledged(false);
    try {
      await client.emergencyStop();
    } catch (e) {
      setConnectError(`Emergency stop could not be delivered: ${(e as Error).message}`);
    }
  }, [client]);

  const controller = session?.clients.find((c) => c.id === session.controllerId) ?? null;
  const isController = Boolean(clientId && session?.controllerId === clientId);

  const value = useMemo<ConnectionCtx>(
    () => ({
      client,
      socket,
      serverReachable: socket === 'open',
      connected: connection.connected,
      connecting: connection.connecting,
      connectPhase: connection.phase,
      portPath: connection.portPath,
      connect,
      disconnect,
      connectError,
      dismissConnectError: () => setConnectError(null),
      ports,
      portsLoading,
      portsError,
      refreshPorts,
      selectedPortPath,
      setSelectedPortPath,
      paused: connection.paused,
      pause: () => attempt(() => client.pause()),
      resume: () => attempt(() => client.resume()),
      emergencyStop,
      emergencyStopped: emergencyStopped && !stopAcknowledged,
      acknowledgeEmergencyStop: () => setStopAcknowledged(true),
      job,
      session,
      clientId,
      isController,
      controllerName: controller?.name ?? null,
      takeControl: () => attempt(() => client.takeControl()),
      releaseControl: () => attempt(() => client.releaseControl()),
      log,
      showLog,
      setShowLog,
    }),
    [
      client,
      socket,
      connection,
      connect,
      disconnect,
      connectError,
      ports,
      portsLoading,
      portsError,
      refreshPorts,
      selectedPortPath,
      setSelectedPortPath,
      attempt,
      emergencyStop,
      emergencyStopped,
      stopAcknowledged,
      job,
      session,
      clientId,
      isController,
      controller,
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
