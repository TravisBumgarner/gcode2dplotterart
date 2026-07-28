import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Session } from 'electron';
import { app, BrowserWindow, dialog, net, protocol, shell } from 'electron';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** Set by scripts/dev-electron.mjs; absent in a packaged build. */
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

/** Built renderer output (`vite build`), sibling of this file's dist-electron. */
const RENDERER_DIR = path.join(dirname, '..', 'dist');

// The renderer is served from a custom scheme rather than file:// for two
// reasons: file:// pages are an opaque origin, so localStorage and IndexedDB
// (Dexie — every project and plotter lives there) are unreliable or outright
// blocked, and Web Serial requires a secure context. A registered standard +
// secure scheme gives a stable origin that persists across app updates.
const APP_SCHEME = 'paint-app';
const APP_HOST = 'app';
const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
const APP_URL = `${APP_ORIGIN}/index.html`;

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

function registerAppProtocol() {
  protocol.handle(APP_SCHEME, async (request) => {
    const url = new URL(request.url);
    if (url.host !== APP_HOST) return new Response('Not found', { status: 404 });

    const relative = decodeURIComponent(url.pathname);
    const resolved = path.normalize(path.join(RENDERER_DIR, relative));
    // Reject anything that escapes the bundle (../ traversal).
    const inBundle = resolved === RENDERER_DIR || resolved.startsWith(RENDERER_DIR + path.sep);

    // SPA fallback: unknown paths serve index.html so client-side routing and
    // a bare `paint-app://app/` both work.
    const filePath =
      inBundle && existsSync(resolved) && !resolved.endsWith(path.sep)
        ? resolved
        : path.join(RENDERER_DIR, 'index.html');

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

/**
 * Main-process progress (port enumeration, permission checks, picker choices)
 * is invisible to the renderer's DevTools and to stdout in a packaged app, so
 * it goes both to the terminal and, via the preload bridge, to the app's own
 * connection log.
 */
function mainLog(line: string) {
  console.log(line);
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send('main-log', line);
  }
}

/**
 * USB vendor IDs (decimal, as Chromium reports them) of the chips that show up
 * on Marlin/GRBL boards: Arduino, FTDI, CH340, CP210x, STM32, Teensy, Atmel,
 * RP2040, SparkFun. A port from one of these outranks anything else, which is
 * what lets a single plotter be picked without asking.
 */
const PLOTTER_VENDOR_IDS = new Set([
  0x2341, 0x2a03, 0x0403, 0x1a86, 0x10c4, 0x0483, 0x16c0, 0x03eb, 0x2e8a, 0x1b4f, 0x1d50,
]);

/** How long to keep waiting for a device that isn't enumerated yet. */
const PORT_WAIT_MS = 2500;

/**
 * One physical board can surface as several device nodes (a CH340 is both
 * /dev/cu.usbserial-N and /dev/cu.wchusbserial-N), which would otherwise turn
 * a single plotter into a two-button prompt. Same VID/PID/serial → same board.
 */
function dedupe(ports: Electron.SerialPort[]) {
  const byDevice = new Map<string, Electron.SerialPort>();
  for (const p of ports) {
    const key = `${p.vendorId}:${p.productId}:${p.serialNumber ?? ''}`;
    const existing = byDevice.get(key);
    // Prefer the vendor-driver node (wchusbserial) over the generic alias;
    // both work, but it's the one the board's own driver publishes.
    if (!existing || /wch|usbmodem/i.test(p.portName ?? '')) byDevice.set(key, p);
  }
  return [...byDevice.values()];
}

/**
 * Best-first grouping: known plotter chips, then any other USB device, then
 * everything else (macOS's Bluetooth-Incoming-Port and friends). Only the best
 * non-empty group is offered, so the noise never reaches the user.
 */
function rankPorts(ports: Electron.SerialPort[]) {
  const known = dedupe(ports.filter((p) => PLOTTER_VENDOR_IDS.has(Number(p.vendorId))));
  if (known.length > 0) return known;
  const usb = ports.filter((p) => p.vendorId && Number(p.vendorId) !== 0);
  if (usb.length > 0) return usb;
  return ports;
}

/** `dialog.showMessageBoxSync` has no overload taking an optional parent. */
function showBox(parent: BrowserWindow | null, options: Electron.MessageBoxSyncOptions) {
  return parent ? dialog.showMessageBoxSync(parent, options) : dialog.showMessageBoxSync(options);
}

function portLabel(p: Electron.SerialPort) {
  const name = p.displayName || p.portName || p.portId;
  return p.displayName && p.portName && p.displayName !== p.portName
    ? `${p.displayName} (${p.portName})`
    : name;
}

/**
 * Web Serial in Chromium hands port selection to the browser's own chooser;
 * in Electron the main process must pick instead. `navigator.serial` also
 * stays dark unless the session grants the `serial` permission, so both are
 * wired here.
 */
function configureSerial(session: Session, getWindow: () => BrowserWindow | null) {
  const allowedOrigins = new Set([APP_ORIGIN]);
  if (DEV_SERVER_URL) allowedOrigins.add(new URL(DEV_SERVER_URL).origin);

  session.setPermissionCheckHandler((_wc, permission, requestingOrigin, details) => {
    if (permission !== 'serial') return false;
    // For `serial` the origin arrives on `details.securityOrigin`;
    // `requestingOrigin` is empty, and treating that as a mismatch denies the
    // request before `select-serial-port` ever fires — surfacing in the
    // renderer as the misleading "No port selected by the user".
    const origin =
      requestingOrigin ||
      (details as { securityOrigin?: string }).securityOrigin ||
      (details as { origin?: string }).origin ||
      '';
    const allowed = allowedOrigins.has(origin.replace(/\/$/, ''));
    if (!allowed) mainLog(`[serial] permission denied for origin: ${JSON.stringify(origin)}`);
    return allowed;
  });

  session.setDevicePermissionHandler((details) => details.deviceType === 'serial');

  session.on('select-serial-port', (event, portList, _webContents, callback) => {
    event.preventDefault();

    // Chromium's initial list is whatever it happens to have enumerated when
    // requestPort() ran — frequently empty on the first call of a session, or
    // when the board was plugged in moments ago. Keep the request open and
    // fold in `serial-port-added` events instead of failing straight away.
    const seen = new Map<string, Electron.SerialPort>();
    for (const p of portList) seen.set(p.portId, p);
    mainLog(`[serial] request; ${portList.length} port(s) enumerated`);
    for (const p of portList)
      mainLog(`[serial]   ${portLabel(p)} vid=${p.vendorId} pid=${p.productId}`);

    let settled = false;
    const timer = setTimeout(() => decide(true), PORT_WAIT_MS);

    const onAdded = (_e: unknown, port: Electron.SerialPort) => {
      mainLog(`[serial] port appeared: ${portLabel(port)} vid=${port.vendorId}`);
      seen.set(port.portId, port);
      decide(false);
    };
    const onRemoved = (_e: unknown, port: Electron.SerialPort) => {
      seen.delete(port.portId);
    };

    const finish = (portId: string) => {
      if (settled) return;
      const chosen = portId ? seen.get(portId) : undefined;
      mainLog(`[serial] selected: ${chosen ? portLabel(chosen) : 'none'}`);
      settled = true;
      clearTimeout(timer);
      session.removeListener('serial-port-added', onAdded);
      session.removeListener('serial-port-removed', onRemoved);
      callback(portId);
    };

    /**
     * `expired` is the difference between "nothing plausible yet, keep
     * waiting" and "nothing plausible is coming, tell the user".
     */
    function decide(expired: boolean) {
      if (settled) return;
      const candidates = rankPorts([...seen.values()]);

      if (candidates.length === 0) {
        if (!expired) return;
        showBox(getWindow(), {
          type: 'warning',
          title: 'No plotter found',
          message: 'No serial devices were detected.',
          detail:
            'Plug the plotter into USB and switch it on, then try connecting again. If it is already connected, close any other program using it (Arduino IDE, a serial monitor) and replug the cable.',
          buttons: ['OK'],
        });
        finish('');
        return;
      }

      // Exactly one plausible device: connect to it without a prompt. A
      // still-open hotplug window can't add a *better* candidate than a
      // known plotter chip, so this is safe to take immediately.
      if (candidates.length === 1) {
        finish(candidates[0].portId);
        return;
      }

      // Several plausible devices — the one case that genuinely needs a human.
      const labels = candidates.map(portLabel);
      const picked = showBox(getWindow(), {
        type: 'question',
        title: 'Select plotter',
        message: 'Which serial port is the plotter on?',
        buttons: [...labels, 'Cancel'],
        cancelId: labels.length,
        defaultId: 0,
      });
      finish(picked >= 0 && picked < candidates.length ? candidates[picked].portId : '');
    }

    session.on('serial-port-added', onAdded);
    session.on('serial-port-removed', onRemoved);
    decide(false);
  });
}

/**
 * The renderer guards unsaved work with `beforeunload`. Electron cancels the
 * close silently in that case instead of showing Chromium's leave-site prompt,
 * which would make the close button look broken — so ask here and force the
 * close through when the user confirms.
 */
function confirmUnload(window: BrowserWindow) {
  window.webContents.on('will-prevent-unload', (event) => {
    const choice = dialog.showMessageBoxSync(window, {
      type: 'warning',
      title: 'Unsaved changes',
      message: 'This project has unsaved changes.',
      detail: 'Closing now will discard them.',
      buttons: ['Cancel', 'Discard and close'],
      cancelId: 0,
      defaultId: 0,
    });
    if (choice === 1) event.preventDefault();
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#121212',
    show: false,
    webPreferences: {
      preload: path.join(dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  confirmUnload(window);

  // Anything that tries to open a new window (docs links, etc.) goes to the
  // real browser rather than a chrome-less Electron window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) {
    window.loadURL(DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    window.loadURL(APP_URL);
  }

  return window;
}

// A second instance would fight the first over the serial port and the
// IndexedDB lock, so hand off to the running window instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let mainWindow: BrowserWindow | null = null;

  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    registerAppProtocol();
    mainWindow = createWindow();
    configureSerial(mainWindow.webContents.session, () => mainWindow);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
