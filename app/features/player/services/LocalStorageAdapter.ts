import {
  buildHistoryIndexKey,
  buildProgressKey,
  buildWatchContentKey,
  isCanonicalMediaId,
  PROGRESS_PREFIX,
} from "./progressKeys";
import { PROGRESS_CONSTANTS, type WatchProgressRecord } from "./progress.types";

type IndexEntry = {
  mediaId: string;
  episodeId?: string;
  lastWatchedAt: string;
  isCompleted: boolean;
};

export class LocalStorageAdapter {
  private cache = new Map<string, WatchProgressRecord>();
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
    this.cache.clear();
  }

  write(record: WatchProgressRecord): void {
    this.purgeDuplicateContent(record);

    const key = buildProgressKey(this.userId, record.mediaId, record.episodeId);

    try {
      const serialized = JSON.stringify(record);
      window.localStorage.setItem(key, serialized);
      this.cache.set(key, record);
      this.updateIndex(record);
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        this.evictOldEntries();
        try {
          window.localStorage.setItem(key, JSON.stringify(record));
          this.cache.set(key, record);
          this.updateIndex(record);
        } catch {
          // Graceful degradation — never surface to user.
        }
      }
    }
  }

  findBySlug(slug: string, episodeId?: string): WatchProgressRecord | null {
    for (const record of this.readAll()) {
      const slugMatch = record.slug === slug || record.seriesSlug === slug;
      if (!slugMatch) {
        continue;
      }

      if (episodeId !== undefined) {
        if (record.episodeId === episodeId) {
          return record;
        }
        continue;
      }

      if (record.mediaType === "movie" || !record.episodeId) {
        return record;
      }
    }

    return null;
  }

  read(mediaId: string, episodeId?: string): WatchProgressRecord | null {
    const key = buildProgressKey(this.userId, mediaId, episodeId);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as WatchProgressRecord;
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  readAll(): WatchProgressRecord[] {
    const records = this.collectAllRecords();

    return this.dedupeRecords(records).sort(
      (a, b) =>
        new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime(),
    );
  }

  purgeDuplicateContent(
    identity: Pick<
      WatchProgressRecord,
      | "mediaType"
      | "mediaId"
      | "slug"
      | "seriesSlug"
      | "episodeId"
      | "seasonNumber"
      | "episodeNumber"
    >,
  ): void {
    const contentKey = buildWatchContentKey(identity);
    if (!contentKey || contentKey === "movie:" || contentKey === "series::ep:") {
      return;
    }

    for (const existing of this.collectAllRecords()) {
      if (buildWatchContentKey(existing) !== contentKey) {
        continue;
      }

      if (
        existing.mediaId === identity.mediaId &&
        (existing.episodeId ?? "movie") === (identity.episodeId ?? "movie")
      ) {
        continue;
      }

      this.remove(existing.mediaId, existing.episodeId);
    }
  }

  remove(mediaId: string, episodeId?: string): void {
    const key = buildProgressKey(this.userId, mediaId, episodeId);
    window.localStorage.removeItem(key);
    this.cache.delete(key);
    this.removeFromIndex(mediaId, episodeId);
  }

  /** One-time cleanup for duplicate slug vs numeric mediaId keys. */
  reconcileStoredDuplicates(): void {
    const records = this.collectAllRecords();
    const groups = new Map<string, WatchProgressRecord[]>();

    records.forEach((record) => {
      const contentKey = buildWatchContentKey(record);
      const bucket = groups.get(contentKey) ?? [];
      bucket.push(record);
      groups.set(contentKey, bucket);
    });

    groups.forEach((group) => {
      if (group.length <= 1) {
        return;
      }

      const winner = this.pickCanonicalRecord(group);
      group.forEach((record) => {
        if (
          record.mediaId === winner.mediaId &&
          (record.episodeId ?? "movie") === (winner.episodeId ?? "movie")
        ) {
          return;
        }

        this.remove(record.mediaId, record.episodeId);
      });

      this.write(winner);
    });
  }

  private collectAllRecords(): WatchProgressRecord[] {
    const records: WatchProgressRecord[] = [];

    try {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key?.startsWith(`${PROGRESS_PREFIX}${this.userId}:`)) {
          continue;
        }

        const record = this.readFromKey(key);
        if (record) {
          records.push(record);
        }
      }
    } catch {
      return [];
    }

    return records;
  }

  private dedupeRecords(records: WatchProgressRecord[]): WatchProgressRecord[] {
    const deduped = new Map<string, WatchProgressRecord>();

    records.forEach((record) => {
      const contentKey = buildWatchContentKey(record);
      const existing = deduped.get(contentKey);

      if (!existing) {
        deduped.set(contentKey, record);
        return;
      }

      deduped.set(contentKey, this.pickCanonicalRecord([existing, record]));
    });

    return [...deduped.values()];
  }

  private pickCanonicalRecord(records: WatchProgressRecord[]): WatchProgressRecord {
    return records.reduce((best, current) => {
      const bestTime = new Date(best.lastWatchedAt).getTime();
      const currentTime = new Date(current.lastWatchedAt).getTime();

      if (currentTime > bestTime) {
        return current;
      }

      if (currentTime < bestTime) {
        return best;
      }

      if (isCanonicalMediaId(current.mediaId) && !isCanonicalMediaId(best.mediaId)) {
        return current;
      }

      return best;
    });
  }

  clearAll(): void {
    const keys: string[] = [];

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(`${PROGRESS_PREFIX}${this.userId}:`)) {
        keys.push(key);
      }
    }

    keys.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.removeItem(buildHistoryIndexKey(this.userId));
    this.cache.clear();
  }

  evictOldEntries(): void {
    const cutoff = Date.now() - PROGRESS_CONSTANTS.EVICT_COMPLETED_DAYS * 86400000;
    const all = this.readAll();
    const completedOld = all.filter(
      (row) =>
        row.isCompleted && new Date(row.lastWatchedAt).getTime() < cutoff,
    );

    completedOld.forEach((row) => this.remove(row.mediaId, row.episodeId));

    if (completedOld.length === 0 && all.length > PROGRESS_CONSTANTS.MAX_HISTORY_INDEX) {
      const overflow = all
        .filter((row) => row.isCompleted)
        .slice(PROGRESS_CONSTANTS.MAX_HISTORY_INDEX);

      overflow.forEach((row) => this.remove(row.mediaId, row.episodeId));
    }
  }

  private readFromKey(key: string): WatchProgressRecord | null {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as WatchProgressRecord;
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  private updateIndex(record: WatchProgressRecord): void {
    const indexKey = buildHistoryIndexKey(this.userId);
    const current = this.readIndex();
    const entry: IndexEntry = {
      mediaId: record.mediaId,
      episodeId: record.episodeId,
      lastWatchedAt: record.lastWatchedAt,
      isCompleted: record.isCompleted,
    };

    const filtered = current.filter(
      (item) =>
        !(
          item.mediaId === entry.mediaId &&
          (item.episodeId ?? "movie") === (entry.episodeId ?? "movie")
        ),
    );

    const next = [entry, ...filtered].sort(
      (a, b) =>
        new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime(),
    );

    const capped = next.slice(0, PROGRESS_CONSTANTS.MAX_HISTORY_INDEX);

    while (capped.length > PROGRESS_CONSTANTS.MAX_HISTORY_INDEX) {
      const oldestCompleted = [...capped]
        .reverse()
        .find((item) => item.isCompleted);
      if (!oldestCompleted) {
        break;
      }
      const idx = capped.findIndex(
        (item) =>
          item.mediaId === oldestCompleted.mediaId &&
          item.episodeId === oldestCompleted.episodeId,
      );
      if (idx >= 0) {
        capped.splice(idx, 1);
      } else {
        break;
      }
    }

    window.localStorage.setItem(indexKey, JSON.stringify(capped));
  }

  private removeFromIndex(mediaId: string, episodeId?: string): void {
    const indexKey = buildHistoryIndexKey(this.userId);
    const current = this.readIndex();
    const next = current.filter(
      (item) =>
        !(
          item.mediaId === mediaId &&
          (item.episodeId ?? "movie") === (episodeId ?? "movie")
        ),
    );
    window.localStorage.setItem(indexKey, JSON.stringify(next));
  }

  private readIndex(): IndexEntry[] {
    try {
      const raw = window.localStorage.getItem(buildHistoryIndexKey(this.userId));
      const parsed = raw ? (JSON.parse(raw) as IndexEntry[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
