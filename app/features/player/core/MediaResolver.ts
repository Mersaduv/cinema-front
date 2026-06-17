import { buildPlaybackSubtitleUrl, isProgressiveAudioUrl } from "../utils/format";
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
    return {
      ...input,
      src: input.src.trim(),
      dashUrl: input.dashUrl?.trim() || null,
      progressiveUrl: input.progressiveUrl?.trim() || null,
      drm: input.drm ?? null,
      subtitleUrl: this.resolveSubtitleUrl(input.subtitleUrl),
      dubbedAudioUrl:
        input.dubbedAudioUrl?.trim() && isProgressiveAudioUrl(input.dubbedAudioUrl)
          ? input.dubbedAudioUrl.trim()
          : null,
    };
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

  /** Prefetch HLS manifest (lightweight HEAD/GET). */
  async prefetchManifest(url: string, signal?: AbortSignal): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: "GET",
        signal,
        cache: "force-cache",
        headers: { Accept: "application/vnd.apple.mpegurl, */*" },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const mediaResolver = new MediaResolver();
