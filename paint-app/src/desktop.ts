/** Exposed by electron/preload.cts; absent when running in a plain browser. */
declare global {
  interface Window {
    desktop?: {
      onMainLog: (handler: (line: string) => void) => () => void;
      fetchUrl?: (url: string) => Promise<DesktopFetchResult>;
    };
  }
}

export type DesktopFetchResult = {
  ok: boolean;
  status: number;
  contentType?: string;
  body?: string;
  error?: string;
};

export type FetchTextResult = {
  body: string;
  contentType: string;
  /** True when the request went through the main process (no CORS limits). */
  viaDesktop: boolean;
};

export const isDesktop = () => typeof window !== 'undefined' && Boolean(window.desktop?.fetchUrl);

/**
 * GET a URL as text, preferring the Electron main-process bridge because
 * arbitrary data feeds rarely send CORS headers. In a plain browser this falls
 * back to `fetch`, which works only for endpoints that opt in — the thrown
 * message says so, since "Failed to fetch" on its own reads like a dead link.
 */
export const fetchText = async (url: string): Promise<FetchTextResult> => {
  const bridge = window.desktop?.fetchUrl;
  if (bridge) {
    const result = await bridge(url);
    if (!result.ok) {
      throw new Error(
        result.error ?? `Request failed with HTTP ${result.status}`.replace(' 0', ' error'),
      );
    }
    return {
      body: result.body ?? '',
      contentType: result.contentType ?? '',
      viaDesktop: true,
    };
  }

  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(
      `${(e as Error).message}. In the browser build this is usually CORS — the endpoint has to allow cross-origin requests. The desktop app can fetch any URL.`,
    );
  }
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
  return {
    body: await response.text(),
    contentType: response.headers.get('content-type') ?? '',
    viaDesktop: false,
  };
};
