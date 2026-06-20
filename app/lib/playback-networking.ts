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

export function applyPlaybackRequestHeaders(
  url: string,
  headers: Record<string, string> = {},
): Record<string, string> {
  if (!isSameOriginMediaRequest(url)) {
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
      for (const [key, value] of Object.entries(applyPlaybackRequestHeaders(url))) {
        xhr.setRequestHeader(key, value);
      }
    },
    fetchSetup(context, initParams) {
      return new Request(context.url, applyPlaybackFetchInit(context.url, initParams));
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
    if (!uri || !isSameOriginMediaRequest(uri)) {
      return;
    }

    request.headers[PLAYBACK_REQUEST_HEADER] = PLAYBACK_REQUEST_VALUE;
    request.headers["X-Requested-With"] = "XMLHttpRequest";
  });
}
