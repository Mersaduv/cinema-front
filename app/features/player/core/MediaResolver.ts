import { buildPlaybackSubtitleUrl, isProgressiveAudioUrl, isProgressiveVideoUrl } from "../utils/format";
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
    const rawSrc = input.src.trim();
    const rawProgressive = input.progressiveUrl?.trim() || null;

    // Safety: if src is actually an MP4, treat it as progressive — never HLS-proxy it.
    if (isProgressiveVideoUrl(rawSrc) && !rawProgressive) {
      return {
        ...input,
        src: "",
        dashUrl: input.dashUrl?.trim()
          ? rewriteCdnUrlForPlayback(input.dashUrl.trim())
          : null,
        progressiveUrl: rewriteCdnUrlForPlayback(rawSrc),
        drm: input.drm ?? null,
        subtitleUrl: this.resolveSubtitleUrl(input.subtitleUrl),
        dubbedAudioUrl:
          input.dubbedAudioUrl?.trim() && isProgressiveAudioUrl(input.dubbedAudioUrl)
            ? input.dubbedAudioUrl.trim()
            : null,
      };
    }

    const src = this.resolveHlsMasterUrl(rawSrc);
    const dashUrl = input.dashUrl?.trim()
      ? rewriteCdnUrlForPlayback(input.dashUrl.trim())
      : null;
    const progressiveUrl = rawProgressive
      ? rewriteCdnUrlForPlayback(rawProgressive)
      : null;

    return {
      ...input,
      src,
      dashUrl,
      progressiveUrl,
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

    if (isProgressiveVideoUrl(url)) {
      return rewriteCdnUrlForPlayback(url);
    }

    if (pageOriginDiffersFromCdn() && isHlsManifestUrl(url)) {
      return buildHlsManifestProxyUrl(url);
    }

    return rewriteCdnUrlForPlayback(url);
  }

  /** Build playback manifest bundle for the policy engine. */
  toPlaybackManifest(source: MediaSource): PlaybackManifest {
    const progressive = source.progressiveUrl?.trim() || null;
    const hls = source.src?.trim() || "";

    return {
      hls: isProgressiveVideoUrl(hls) ? "" : hls,
      dash: source.dashUrl ?? null,
      progressive: progressive || (isProgressiveVideoUrl(hls) ? hls : null),
      drm: source.drm ?? null,
    };
  }

  /** Prefetch HLS manifest (lightweight HEAD with GET fallback). */
  async prefetchManifest(url: string, signal?: AbortSignal): Promise<boolean> {
    if (isProgressiveVideoUrl(url)) {
      try {
        const response = await fetch(
          url,
          applyPlaybackFetchInit(url, {
            method: "HEAD",
            signal,
            headers: { Accept: "video/mp4, */*" },
          }),
        );
        return response.ok;
      } catch {
        return false;
      }
    }

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
