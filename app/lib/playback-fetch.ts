/**
 * Patient playback network timeout for weak viewer connections.
 * Prefer long waits + engine retries over surfacing a player error.
 */
export const PLAYBACK_FETCH_TIMEOUT_MS = 120_000;

export function playbackFetchSignal(
  parent?: AbortSignal | null,
  timeoutMs = PLAYBACK_FETCH_TIMEOUT_MS,
): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    if (parent) {
      return AbortSignal.any([parent, timeoutSignal]);
    }
    return timeoutSignal;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (parent) {
    parent.addEventListener("abort", () => controller.abort(), { once: true });
  }

  controller.signal.addEventListener(
    "abort",
    () => clearTimeout(timer),
    { once: true },
  );

  return controller.signal;
}

export async function fetchWithPlaybackTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = PLAYBACK_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const signal = playbackFetchSignal(init.signal ?? null, timeoutMs);
  return fetch(url, { ...init, signal });
}
