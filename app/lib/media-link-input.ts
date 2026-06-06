const DIRECT_MEDIA_FILE_PATTERN =
  /\.(mkv|mp4|webm|avi|mov|m4v|wmv|flv|mpg|mpeg|ts)(\?.*)?$/i;

const HLS_PLAYLIST_PATTERN = /\.m3u8(\?.*)?$/i;

const QUALITY_IN_PATH_PATTERN =
  /(?:^|[/_.-])((?:2160|1440|1080|720|480|360)p?)(?:[p._/-]|$)/i;

const DOWNLOAD_QUALITY_VALUES = [
  "2160p",
  "1440p",
  "1080p",
  "720p",
  "480p",
  "360p",
] as const;

export function normalizeMediaLinkInput(raw: string): string {
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

/**
 * Trims input; adds http:// only when no scheme is present.
 * If the user already entered http:// or https://, the value is kept as-is.
 */
export function normalizeDownloadLinkInput(raw: string): string {
  const value = normalizeMediaLinkInput(raw);

  if (!value) {
    return value;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("/")) {
    return value;
  }

  return `http://${value}`;
}

export function isDirectMediaFilePath(raw: string): boolean {
  const value = normalizeMediaLinkInput(raw).toLowerCase();

  if (!value) {
    return false;
  }

  if (HLS_PLAYLIST_PATTERN.test(value) && !value.includes("master.m3u8")) {
    return false;
  }

  return DIRECT_MEDIA_FILE_PATTERN.test(value);
}

export function looksLikeHlsPackagePath(raw: string): boolean {
  if (isDirectMediaFilePath(raw)) {
    return false;
  }

  const value = normalizeMediaLinkInput(raw).toLowerCase();

  if (!value) {
    return false;
  }

  if (value.includes("master.m3u8")) {
    return true;
  }

  if (value.endsWith(".m3u8")) {
    return true;
  }

  if (value.includes("/audio/") && !isDirectMediaFilePath(raw)) {
    return true;
  }

  if (/\/movies\/[^/]+\/?$/.test(value)) {
    return true;
  }

  return false;
}

export function inferDownloadQualityFromPath(raw: string): string | null {
  const value = normalizeMediaLinkInput(raw);
  const match = value.match(QUALITY_IN_PATH_PATTERN);

  if (!match?.[1]) {
    return null;
  }

  const digits = match[1].toLowerCase().replace(/p$/, "");
  const withSuffix = `${digits}p`;

  if (
    DOWNLOAD_QUALITY_VALUES.includes(
      withSuffix as (typeof DOWNLOAD_QUALITY_VALUES)[number],
    )
  ) {
    return withSuffix;
  }

  return null;
}
