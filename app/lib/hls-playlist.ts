import { rewriteCdnUrlForPlayback } from "./playback-networking";

const DEFAULT_CDN_ORIGIN = "http://cinema.af";

export function resolveCdnOriginForPlaylist(): string {
  return process.env.NEXT_PUBLIC_CDN_ORIGIN?.trim() || DEFAULT_CDN_ORIGIN;
}

/** Always map CDN absolute URLs to same-origin /content2 paths (server + client). */
export function rewriteCdnUrlToRelativeContent2(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const cdn = new URL(resolveCdnOriginForPlaylist());

    if (
      parsed.hostname === cdn.hostname &&
      parsed.pathname.startsWith("/content2/")
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

/** Resolve a playlist line (relative or absolute) to a same-origin /content2 path when possible. */
export function resolveHlsPlaylistReference(
  reference: string,
  manifestUrl: string,
): string {
  const trimmed = reference.trim();

  if (!trimmed || trimmed.startsWith("data:")) {
    return trimmed;
  }

  let absolute: string;

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      absolute = trimmed;
    } else {
      absolute = new URL(trimmed, manifestUrl).toString();
    }
  } catch {
    return trimmed;
  }

  if (typeof window !== "undefined") {
    return rewriteCdnUrlForPlayback(absolute);
  }

  return rewriteCdnUrlToRelativeContent2(absolute);
}

/**
 * Rewrites HLS playlist bodies so segment/variant URLs stay on the page origin
 * (e.g. cinema.af:3000/content2/...) instead of the CDN default port (cinema.af:80).
 */
export function rewriteM3u8PlaylistBody(body: string, manifestUrl: string): string {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return line;
      }

      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
          return `URI="${resolveHlsPlaylistReference(uri, manifestUrl)}"`;
        });
      }

      return resolveHlsPlaylistReference(trimmed, manifestUrl);
    })
    .join("\n");
}

export function isHlsManifestUrl(url: string): boolean {
  return /\.m3u8(\?.*)?$/i.test(url.trim());
}

export function buildHlsManifestProxyUrl(sourceUrl: string): string {
  return `/api/playback/manifest?src=${encodeURIComponent(sourceUrl.trim())}`;
}
