import type { WatchProgressRecord } from "./progress.types";

const PROGRESS_PREFIX = "watch_progress:";
const INDEX_PREFIX = "watch_history_index:";
const DEVICE_ID_KEY = "device_id";

export function buildProgressKey(
  userId: string,
  mediaId: string,
  episodeId?: string,
): string {
  const episodeKey = episodeId ? `ep_${episodeId}` : "movie";
  return `${PROGRESS_PREFIX}${userId}:${mediaId}:${episodeKey}`;
}

export function buildHistoryIndexKey(userId: string): string {
  return `${INDEX_PREFIX}${userId}`;
}

export function buildRecordKey(record: WatchProgressRecord, userId: string): string {
  return buildProgressKey(userId, record.mediaId, record.episodeId);
}

export function resolveUserId(userId: string | null): string {
  return userId ? `usr_${userId}` : "anonymous";
}

/** Stable identity for deduplicating progress across slug vs numeric mediaId keys. */
export function buildWatchContentKey(
  record: Pick<
    WatchProgressRecord,
    | "mediaType"
    | "slug"
    | "seriesSlug"
    | "episodeId"
    | "seasonNumber"
    | "episodeNumber"
  >,
): string {
  if (record.mediaType === "series") {
    const seriesSlug = record.seriesSlug || record.slug || "";
    const episodePart =
      record.episodeId ??
      `${record.seasonNumber ?? 0}:${record.episodeNumber ?? 0}`;

    return `series:${seriesSlug}:ep:${episodePart}`;
  }

  return `movie:${record.slug ?? ""}`;
}

export function isCanonicalMediaId(mediaId: string): boolean {
  return /^\d+$/.test(mediaId) && Number(mediaId) > 0;
}

export { DEVICE_ID_KEY, PROGRESS_PREFIX, INDEX_PREFIX };
