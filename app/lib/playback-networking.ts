/** Marks in-player segment/manifest traffic so download extensions can ignore it. */
export const PLAYBACK_REQUEST_HEADER = "X-Cinema-Playback";
export const PLAYBACK_REQUEST_VALUE = "1";

export const PLAYBACK_REQUEST_HEADERS: Readonly<Record<string, string>> = {
  [PLAYBACK_REQUEST_HEADER]: PLAYBACK_REQUEST_VALUE,
  "X-Requested-With": "XMLHttpRequest",
};

export const STREAMING_RESPONSE_HEADERS: Readonly<Record<string, string>> = {
  "Content-Disposition": "inline",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "Range, Origin, Accept-Encoding, Content-Type, X-Cinema-Playback, X-Requested-With",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};

const DEFAULT_CDN_ORIGIN = "http://cinema.af";

export function resolveCdnOrigin(): string {
  return process.env.NEXT_PUBLIC_CDN_ORIGIN?.trim() || DEFAULT_CDN_ORIGIN;
}

/** True when the page and CDN are different origins (host or port). */
export function pageOriginDiffersFromCdn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.location.origin !== new URL(resolveCdnOrigin()).origin;
  } catch {
    return false;
  }
}

/** HLS/DASH packages served from cinema.af/content2 (IIS static files). */
export function isCdnMediaUrl(url: string): boolean {
  try {
    const base =
      typeof window !== "undefined" ? window.location.href : resolveCdnOrigin();
    const parsed = new URL(url, base);

    if (parsed.pathname.startsWith("/content2/")) {
      return true;
    }

    const cdn = new URL(resolveCdnOrigin());
    return (
      parsed.hostname === cdn.hostname && parsed.pathname.startsWith("/content2/")
    );
  } catch {
    return false;
  }
}

/**
 * Route CDN media through the Next.js /content2 rewrite when the app is on another origin
 * (e.g. http://cinema.af:3000 or http://172.27.86.14:3000) so playback never hits the wrong port.
 */
export function rewriteCdnUrlForPlayback(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, typeof window !== "undefined" ? window.location.href : resolveCdnOrigin());
    const cdn = new URL(resolveCdnOrigin());

    if (
      parsed.hostname !== cdn.hostname ||
      !parsed.pathname.startsWith("/content2/")
    ) {
      return trimmed;
    }

    if (pageOriginDiffersFromCdn()) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export function isSameOriginMediaRequest(url: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Same-origin playback traffic can carry anti-download-manager markers safely. */
export function shouldAttachPlaybackHeaders(url: string): boolean {
  return isSameOriginMediaRequest(url);
}

export function applyPlaybackRequestHeaders(
  url: string,
  headers: Record<string, string> = {},
): Record<string, string> {
  if (!shouldAttachPlaybackHeaders(url)) {
    return headers;
  }

  return {
    ...headers,
    ...PLAYBACK_REQUEST_HEADERS,
  };
}

export function applyPlaybackFetchInit(
  url: string,
  init: RequestInit = {},
): RequestInit {
  const headers = new Headers(init.headers ?? undefined);

  for (const [key, value] of Object.entries(applyPlaybackRequestHeaders(url))) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  };
}

export function createHlsNetworkingConfig(): {
  xhrSetup: (xhr: XMLHttpRequest, url: string) => void;
  fetchSetup: (context: { url: string }, initParams: RequestInit) => Request;
} {
  return {
    xhrSetup(xhr, url) {
      const rewritten = rewriteCdnUrlForPlayback(url);
      for (const [key, value] of Object.entries(applyPlaybackRequestHeaders(rewritten))) {
        xhr.setRequestHeader(key, value);
      }
    },
    fetchSetup(context, initParams) {
      const rewritten = rewriteCdnUrlForPlayback(context.url);
      return new Request(rewritten, applyPlaybackFetchInit(rewritten, initParams));
    },
  };
}

export function registerShakaPlaybackNetworking(player: {
  getNetworkingEngine: () => {
    registerRequestFilter: (
      filter: (type: unknown, request: { uris: string[]; headers: Record<string, string> }) => void,
    ) => void;
  } | null;
}): void {
  const networking = player.getNetworkingEngine();
  if (!networking) {
    return;
  }

  networking.registerRequestFilter((_type, request) => {
    const uri = request.uris[0];
    if (!uri || !shouldAttachPlaybackHeaders(uri)) {
      return;
    }

    request.headers[PLAYBACK_REQUEST_HEADER] = PLAYBACK_REQUEST_VALUE;
    request.headers["X-Requested-With"] = "XMLHttpRequest";
  });
}
