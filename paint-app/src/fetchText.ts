export type FetchTextResult = {
  body: string;
  contentType: string;
};

/**
 * GET a URL as text.
 *
 * This used to prefer an Electron main-process bridge, because arbitrary data
 * feeds rarely send CORS headers and the desktop shell could ignore them. The
 * shell is gone, so a connected-data feed has to be one the browser is allowed
 * to read. `fetch` says only "Failed to fetch" when it isn't, which reads like
 * a dead link, so the reason is spelled out here.
 */
export const fetchText = async (url: string): Promise<FetchTextResult> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(
      `${(e as Error).message}. This is usually CORS — the endpoint has to allow cross-origin requests from a browser.`,
    );
  }
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
  return {
    body: await response.text(),
    contentType: response.headers.get('content-type') ?? '',
  };
};
