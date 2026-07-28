import { contextBridge, ipcRenderer } from 'electron';

/**
 * The main process owns everything the renderer can't see — port enumeration,
 * permission checks, the picker. Those steps used to be visible only on the
 * terminal's stdout, which is invisible in a packaged app and easy to miss in
 * dev, so they're forwarded here into the app's own connection log.
 */
contextBridge.exposeInMainWorld('desktop', {
  onMainLog: (handler: (line: string) => void) => {
    const listener = (_event: unknown, line: string) => handler(line);
    ipcRenderer.on('main-log', listener);
    return () => ipcRenderer.removeListener('main-log', listener);
  },
  /** CORS-free HTTP GET, for Connected Data. See `registerHttpBridge` in main. */
  fetchUrl: (url: string) => ipcRenderer.invoke('http-fetch', url),
});
