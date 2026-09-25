const NO_CONNECTION_ERROR = "No connection. Try again.";

type FetchJsonResult<T> = {
  ok: boolean;
  result: T;
};

// Returns our own error messages instead of the browser's when the request never reaches the server
// ("Failed to fetch", "Load failed") or the response isn't JSON (e.g. a hosting timeout page).
export async function fetchJson<T extends { error?: string }>(
  url: string,
  fallbackError: string,
  init?: RequestInit
): Promise<FetchJsonResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    return { ok: false, result: { error: NO_CONNECTION_ERROR } as T };
  }

  try {
    const result = (await response.json()) as T;
    return { ok: response.ok, result };
  } catch {
    return { ok: false, result: { error: fallbackError } as T };
  }
}
