"use client";

import type { ComponentProps } from "react";
import type { WatchMediaInfo } from "../../features/player/types/player.types";
import PlayerShell from "../../features/player/components/PlayerShell";

export type HlsVideoPlayerProps = {
  src: string;
  dashUrl?: string | null;
  progressiveUrl?: string | null;
  drm?: import("../../features/player/types/playback.types").DrmConfig | null;
  poster?: string | null;
  title?: string;
  backHref?: string;
  immersive?: boolean;
  availableVariants?: Array<{
    profile_key: string;
    resolution: string;
    bandwidth: number;
  }>;
  availableAudioTracks?: Array<{
    key: string;
    label: string;
    language: string;
    is_default: boolean;
  }>;
  subtitleUrl?: string | null;
  dubbedAudioUrl?: string | null;
  seriesContext?: ComponentProps<typeof PlayerShell>["seriesContext"];
  onEpisodeSelect?: ComponentProps<typeof PlayerShell>["onEpisodeSelect"];
  skipRanges?: ComponentProps<typeof PlayerShell>["media"]["skipRanges"];
  watchMedia?: WatchMediaInfo | null;
};

/**
 * Backward-compatible wrapper around PlayerShell (single dynamic import boundary in WatchPageClient).
 */
export default function HlsVideoPlayer({
  src,
  dashUrl,
  progressiveUrl,
  drm,
  poster,
  title,
  backHref,
  immersive = false,
  availableVariants = [],
  availableAudioTracks = [],
  subtitleUrl,
  dubbedAudioUrl,
  seriesContext,
  onEpisodeSelect,
  skipRanges,
  watchMedia,
}: HlsVideoPlayerProps) {
  return (
    <PlayerShell
      watchMedia={watchMedia}
      media={{
        src,
        dashUrl,
        progressiveUrl,
        drm,
        poster,
        title,
        subtitleUrl,
        dubbedAudioUrl,
        variants: availableVariants,
        audioTracks: availableAudioTracks,
        skipRanges,
      }}
      backHref={backHref}
      immersive={immersive}
      seriesContext={seriesContext}
      onEpisodeSelect={onEpisodeSelect}
    />
  );
}
