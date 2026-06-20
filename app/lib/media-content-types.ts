/** MIME map for streamed and static media files served by Cinema. */
export const MEDIA_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".m3u8": "application/vnd.apple.mpegurl; charset=utf-8",
  ".mpd": "application/dash+xml; charset=utf-8",
  ".vtt": "text/vtt; charset=utf-8",
  ".ts": "video/mp2t",
  ".m4s": "video/iso.segment",
  ".cmfv": "video/mp4",
  ".cmfa": "audio/mp4",
  ".aac": "audio/aac",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const STREAMING_EXTENSIONS = new Set([
  ".m3u8",
  ".mpd",
  ".ts",
  ".m4s",
  ".cmfv",
  ".cmfa",
  ".aac",
  ".m4a",
  ".mp3",
  ".mp4",
  ".webm",
]);

export function resolveMediaContentType(extension: string): string {
  const normalized = extension.toLowerCase();
  return MEDIA_CONTENT_TYPES[normalized] ?? "application/octet-stream";
}

export function isStreamingMediaExtension(extension: string): boolean {
  return STREAMING_EXTENSIONS.has(extension.toLowerCase());
}
