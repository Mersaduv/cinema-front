/**
 * sendBeacon with fetch keepalive fallback for TV WebViews lacking navigator.sendBeacon.
 */
export function postBeacon(url: string, body: string | Blob, contentType = "application/json"): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const payload =
        typeof body === "string" ? new Blob([body], { type: contentType }) : body;

      if (navigator.sendBeacon(url, payload)) {
        return true;
      }
    } catch {
      // Fall through to fetch.
    }
  }

  void fetch(url, {
    method: "POST",
    body,
    headers: typeof body === "string" ? { "Content-Type": contentType } : undefined,
    keepalive: true,
    credentials: "omit",
  }).catch(() => {
    // Best-effort delivery.
  });

  return true;
}
