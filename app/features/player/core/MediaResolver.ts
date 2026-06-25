import { buildPlaybackSubtitleUrl, isProgressiveAudioUrl } from "../utils/format";
import {
  applyPlaybackFetchInit,
  pageOriginDiffersFromCdn,
  rewriteCdnUrlForPlayback,
} from "../../../lib/playback-networking";
import {
  buildHlsManifestProxyUrl,
  isHlsManifestUrl,
} from "../../../lib/hls-playlist";
import type { MediaSource } from "../types/player.types";
import type { PlaybackManifest } from "../types/playback.types";

/**
 * Resolves media URLs and normalizes playback source configuration.
 */
export class MediaResolver {
  /** Resolve subtitle URL with CORS proxy when needed. */
  resolveSubtitleUrl(url?: string | null): string | null {
    return buildPlaybackSubtitleUrl(url);
  }

  /** Build normalized media source from raw props. */
  resolveSource(input: MediaSource): MediaSource {
    const src = this.resolveHlsMasterUrl(input.src.trim());
    const dashUrl = input.dashUrl?.trim()
      ? rewriteCdnUrlForPlayback(input.dashUrl.trim())
      : null;

    return {
      ...input,
      src,
      dashUrl,
      progressiveUrl: input.progressiveUrl?.trim() || null,
      drm: input.drm ?? null,
      subtitleUrl: this.resolveSubtitleUrl(input.subtitleUrl),
      dubbedAudioUrl:
        input.dubbedAudioUrl?.trim() && isProgressiveAudioUrl(input.dubbedAudioUrl)
          ? input.dubbedAudioUrl.trim()
          : null,
    };
  }

  /**
   * When the app runs on a non-CDN origin (e.g. cinema.af:3000), route the master
   * playlist through a same-origin proxy that rewrites nested CDN URLs.
   */
  resolveHlsMasterUrl(url: string): string {
    if (!url) {
      return url;
    }

    if (pageOriginDiffersFromCdn() && isHlsManifestUrl(url)) {
      return buildHlsManifestProxyUrl(url);
    }

    return rewriteCdnUrlForPlayback(url);
  }

  /** Build playback manifest bundle for the policy engine. */
  toPlaybackManifest(source: MediaSource): PlaybackManifest {
    return {
      hls: source.src,
      dash: source.dashUrl ?? null,
      progressive: source.progressiveUrl ?? null,
      drm: source.drm ?? null,
    };
  }

  /** Prefetch HLS manifest (lightweight HEAD with GET fallback). */
  async prefetchManifest(url: string, signal?: AbortSignal): Promise<boolean> {
    const acceptHeader = { Accept: "application/vnd.apple.mpegurl, */*" };

    try {
      const headResponse = await fetch(
        url,
        applyPlaybackFetchInit(url, {
          method: "HEAD",
          signal,
          headers: acceptHeader,
        }),
      );

      if (headResponse.ok) {
        return true;
      }
    } catch {
      // Fall through to GET when HEAD is unsupported.
    }

    try {
      const response = await fetch(
        url,
        applyPlaybackFetchInit(url, {
          method: "GET",
          signal,
          headers: acceptHeader,
        }),
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const mediaResolver = new MediaResolver();
