/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Format seconds as MM:SS or H:MM:SS. */
export function formatSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "00:00";
  }

  const safeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Exponential backoff with jitter. */
export function backoffDelayMs(attempt: number, baseMs = 1000, maxMs = 10000): number {
  const exp = Math.min(baseMs * 2 ** attempt, maxMs);
  const jitter = Math.random() * exp * 0.25;
  return Math.floor(exp + jitter);
}

/** Parse resolution string to height in pixels. */
export function parseResolutionHeight(resolution?: string): number | null {
  if (!resolution) {
    return null;
  }

  const match = resolution.match(/(\d{3,4})$/);
  return match ? Number(match[1]) : null;
}

/** Whether a URL points at an HLS master/media playlist (not playable via HTMLAudioElement). */
export function isHlsPlaylistUrl(url?: string | null): boolean {
  if (!url) {
    return false;
  }

  const trimmed = url.trim();

  return /\.m3u8(\?.*)?$/i.test(trimmed) || trimmed.includes("/master.m3u8");
}

/** Progressive audio files suitable for the external dub <audio> element. */
export function isProgressiveAudioUrl(url?: string | null): boolean {
  if (!url || isHlsPlaylistUrl(url)) {
    return false;
  }

  return /\.(mp3|aac|m4a|wav|ogg|opus|flac)(\?.*)?$/i.test(url.trim());
}

/** Build proxied subtitle URL for external sources. */
export function buildPlaybackSubtitleUrl(subtitleUrl?: string | null): string | null {
  if (!subtitleUrl) {
    return null;
  }

  const trimmed = subtitleUrl.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return `/api/subtitles?src=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
