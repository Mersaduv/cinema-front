import { apiClient } from "./api";

export type WatchPlaybackBootstrap = {
  id?: string;
  slug?: string;
  hls_url?: string | null;
  progressive_url?: string | null;
  video_url?: string | null;
  dash_url?: string | null;
  subtitle_url?: string | null;
  dubbed_audio_url?: string | null;
  drm?: {
    scheme?: string | null;
    licenseUrl?: string | null;
  } | null;
  audio_tracks?: Array<{
    name: string;
    language: string;
    type: string;
  }>;
};

export async function fetchMoviePlaybackBootstrap(slug: string) {
  const response = await apiClient.get<{ playback: WatchPlaybackBootstrap }>(
    `/movies/${encodeURIComponent(slug)}/playback`,
  );

  if (!response.success || !response.data?.playback) {
    throw new Error(response.message || "دریافت اطلاعات پخش انجام نشد.");
  }

  return response.data.playback;
}

export async function fetchSeriesPlaybackBootstrap(
  slug: string,
  season: number,
  episode: number,
) {
  const query = new URLSearchParams({
    season: String(season),
    episode: String(episode),
  });

  const response = await apiClient.get<{ playback: WatchPlaybackBootstrap }>(
    `/series/${encodeURIComponent(slug)}/playback?${query.toString()}`,
  );

  if (!response.success || !response.data?.playback) {
    throw new Error(response.message || "دریافت اطلاعات پخش انجام نشد.");
  }

  return response.data.playback;
}

export function prefetchPlaybackManifest(url: string | null | undefined) {
  const trimmed = url?.trim();
  if (!trimmed || typeof document === "undefined") {
    return;
  }

  const existing = document.head.querySelector(
    `link[data-cinema-manifest-prefetch="${CSS.escape(trimmed)}"]`,
  );
  if (existing) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "fetch";
  link.href = trimmed;
  link.crossOrigin = "anonymous";
  link.setAttribute("data-cinema-manifest-prefetch", trimmed);
  document.head.appendChild(link);
}
