import type { DrmConfig } from "../types/playback.types";

export type PlaybackSessionResponse = {
  hls_url: string | null;
  dash_url: string | null;
  progressive_url: string | null;
  drm: DrmConfig | null;
  expires_at: string;
};

type SessionCache = {
  key: string;
  payload: PlaybackSessionResponse;
};

let cachedSession: SessionCache | null = null;

function isExpired(expiresAt: string): boolean {
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) {
    return true;
  }

  return Date.now() >= expiresMs - 30_000;
}

/**
 * Fetches short-lived signed playback URLs from the Cinema API (Phase 4).
 */
export async function fetchPlaybackSession(input: {
  movieSlug?: string;
  seriesSlug?: string;
  season?: number;
  episode?: number;
}): Promise<PlaybackSessionResponse | null> {
  const params = new URLSearchParams();
  if (input.movieSlug) {
    params.set("movie_slug", input.movieSlug);
  }
  if (input.seriesSlug) {
    params.set("series_slug", input.seriesSlug);
  }
  if (input.season != null) {
    params.set("season", String(input.season));
  }
  if (input.episode != null) {
    params.set("episode", String(input.episode));
  }

  const cacheKey = params.toString();
  if (cachedSession && cachedSession.key === cacheKey && !isExpired(cachedSession.payload.expires_at)) {
    return cachedSession.payload;
  }

  try {
    const response = await fetch(`/api/playback/session?${cacheKey}`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      success?: boolean;
      data?: PlaybackSessionResponse;
    };

    if (!json.success || !json.data) {
      return null;
    }

    cachedSession = { key: cacheKey, payload: json.data };
    return json.data;
  } catch {
    return null;
  }
}

export function clearPlaybackSessionCache(): void {
  cachedSession = null;
}
