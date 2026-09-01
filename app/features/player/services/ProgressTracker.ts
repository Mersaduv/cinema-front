import { detectWatchPlatform } from "../services/capability";
import { getDeviceId } from "./deviceId";
import { LocalStorageAdapter } from "./LocalStorageAdapter";
import { resolveUserId } from "./progressKeys";
import {
  computePercentWatched,
  isCompletedPercent,
  reconcileResumeTime,
  type ResumeDecision,
} from "./progressReconcile";
import { PROGRESS_CONSTANTS, type TrackerConfig, type WatchMediaInfo, type WatchProgressRecord } from "./progress.types";
import { RemoteSync } from "./RemoteSync";
import { SessionGuard } from "./SessionGuard";

export class ProgressTracker {
  private static instance: ProgressTracker | null = null;

  private config: TrackerConfig | null = null;
  private storageUserId = "anonymous";
  private localAdapter = new LocalStorageAdapter("anonymous");
  private remoteSync = new RemoteSync();
  private sessionGuard = new SessionGuard();

  private activeMedia: WatchMediaInfo | null = null;
  private currentTime = 0;
  private duration = 0;
  private syncVersion = 0;
  private lastLocalWrite = 0;
  private lastRemoteSync = 0;
  private destroyed = false;

  private beforeUnloadHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;

  static getInstance(): ProgressTracker {
    if (!ProgressTracker.instance) {
      ProgressTracker.instance = new ProgressTracker();
    }
    return ProgressTracker.instance;
  }

  /** Reset singleton — for tests only. */
  static resetInstance(): void {
    ProgressTracker.instance?.destroy();
    ProgressTracker.instance = null;
  }

  init(config: TrackerConfig): void {
    this.config = config;
    this.storageUserId = resolveUserId(config.userId);
    this.localAdapter.setUserId(this.storageUserId);
    this.localAdapter.reconcileStoredDuplicates();

    this.remoteSync.configure(config, (record, syncedAt) => {
      const updated: WatchProgressRecord = {
        ...record,
        syncedAt,
        isDirty: false,
      };
      this.localAdapter.write(updated);
    });

    this.bindLifecycleHandlers();
  }

  /** Read resume position from localStorage only — safe before player mount. */
  static peekLocalResumeTime(
    media: WatchMediaInfo,
    userId: string | null,
  ): number {
    return ProgressTracker.peekResumeDecision(media, userId).resumeTime;
  }

  /** Local resume decision without network — safe before player mount. */
  static peekResumeDecision(
    media: WatchMediaInfo,
    userId: string | null,
  ): ResumeDecision {
    const adapter = new LocalStorageAdapter(resolveUserId(userId));
    const record = ProgressTracker.resolveStoredRecord(adapter, media);
    return reconcileResumeTime(record, null);
  }

  /** Bind active media without any network I/O — safe on the critical path. */
  attachMedia(media: WatchMediaInfo): void {
    const stored = ProgressTracker.resolveStoredRecord(
      this.localAdapter,
      media,
    );
    const resolvedMedia =
      stored && stored.slug === media.slug
        ? {
            ...media,
            mediaId: ProgressTracker.preferCanonicalMediaId(
              media.mediaId,
              stored.mediaId,
            ),
          }
        : {
            ...media,
            mediaId: ProgressTracker.preferCanonicalMediaId(media.mediaId, ""),
          };

    if (resolvedMedia.slug) {
      this.localAdapter.purgeDuplicateContent(resolvedMedia);
    }

    const sameSession = ProgressTracker.isSameMediaSession(
      this.activeMedia,
      resolvedMedia,
    );

    this.activeMedia = resolvedMedia;

    if (!sameSession) {
      this.currentTime = 0;
      this.duration = media.duration ?? 0;
      const now = performance.now();
      this.lastLocalWrite = now;
      this.lastRemoteSync = now;
      return;
    }

    if ((media.duration ?? 0) > 0) {
      this.duration = media.duration ?? this.duration;
    }
  }

  updateDuration(duration: number): void {
    if (duration > 0) {
      this.duration = Math.round(duration);
    }
  }

  /** Instant resume decision from localStorage only. */
  getLocalResumeDecision(): ResumeDecision {
    if (!this.activeMedia) {
      return { resumeTime: 0, showPrompt: false, source: "none" };
    }

    const local = this.resolveStoredRecord();
    return reconcileResumeTime(local, null);
  }

  /** Background reconcile with server — call after first paint / idle. */
  async reconcileResume(): Promise<ResumeDecision> {
    if (!this.activeMedia) {
      return { resumeTime: 0, showPrompt: false, source: "none" };
    }

    const local = this.resolveStoredRecord();
    const mediaIdForFetch = local?.mediaId ?? this.activeMedia.mediaId;
    const serverTime = await this.remoteSync.fetchServerProgress(
      mediaIdForFetch,
      this.activeMedia.episodeId,
    );

    return reconcileResumeTime(local, serverTime);
  }

  async start(media: WatchMediaInfo): Promise<ResumeDecision> {
    this.attachMedia(media);
    return this.reconcileResume();
  }

  tick(currentTime: number, duration?: number): void {
    if (!this.activeMedia || this.destroyed) {
      return;
    }

    this.currentTime = currentTime;
    if (typeof duration === "number" && duration > 0) {
      this.duration = duration;
    }

    const now = performance.now();

    if (now - this.lastLocalWrite >= PROGRESS_CONSTANTS.LOCAL_WRITE_INTERVAL_MS) {
      this.writeToLocalStorage(currentTime);
      this.lastLocalWrite = now;
    }

    if (now - this.lastRemoteSync >= PROGRESS_CONSTANTS.REMOTE_SYNC_INTERVAL_MS) {
      this.enqueueRemoteSync(currentTime);
      this.lastRemoteSync = now;
    }
  }

  pause(): void {
    if (!this.hasPersistableSession()) {
      return;
    }

    this.flushNow();
  }

  seek(currentTime: number): void {
    this.currentTime = currentTime;

    if (!this.hasPersistableSession()) {
      return;
    }

    this.flushNow();
  }

  end(): void {
    this.flushNow();
    this.activeMedia = null;
  }

  destroy(): void {
    this.end();
    this.destroyed = true;
    this.remoteSync.destroy();
    this.unbindLifecycleHandlers();
  }

  getProgress(mediaId: string, episodeId?: string): WatchProgressRecord | null {
    return this.localAdapter.read(mediaId, episodeId);
  }

  getAllHistory(includeCompleted = false): WatchProgressRecord[] {
    const all = this.localAdapter.readAll();
    return includeCompleted
      ? all
      : all.filter((row) => !row.isCompleted);
  }

  clearHistory(): void {
    this.localAdapter.clearAll();
  }

  clearItem(mediaId: string, episodeId?: string): void {
    const direct = this.localAdapter.read(mediaId, episodeId);
    if (direct) {
      this.localAdapter.purgeDuplicateContent(direct);
    }

    this.localAdapter.remove(mediaId, episodeId);
  }

  /**
   * Drop stale local rows after admin delete/edit; refresh metadata from server.
   * When mediaType is set, only rows of that catalog kind are reconciled.
   */
  reconcileWithServerRecords(
    remoteItems: WatchProgressRecord[],
    options?: { mediaType?: "movie" | "series" },
  ): void {
    if (!this.config?.isAuthenticated) {
      return;
    }

    const mediaType = options?.mediaType;
    const remoteByKey = new Map<string, WatchProgressRecord>();
    remoteItems.forEach((row) => {
      remoteByKey.set(this.buildRecordStorageKey(row.mediaId, row.episodeId), row);
    });

    for (const local of this.localAdapter.readAll()) {
      if (mediaType && local.mediaType !== mediaType) {
        continue;
      }

      const key = this.buildRecordStorageKey(local.mediaId, local.episodeId);
      const remote = remoteByKey.get(key);

      if (!remote) {
        if (local.syncedAt || !local.isDirty) {
          this.localAdapter.purgeDuplicateContent(local);
          this.localAdapter.remove(local.mediaId, local.episodeId);
        }
        continue;
      }

      this.localAdapter.write({
        ...local,
        ...remote,
        slug: remote.slug ?? local.slug,
        seriesSlug: remote.seriesSlug ?? local.seriesSlug,
        title: remote.title ?? local.title,
        posterUrl: remote.posterUrl ?? local.posterUrl,
        backdropUrl: remote.backdropUrl ?? local.backdropUrl,
        stillUrl: remote.stillUrl ?? local.stillUrl,
        seasonNumber: remote.seasonNumber ?? local.seasonNumber,
        episodeNumber: remote.episodeNumber ?? local.episodeNumber,
        syncedAt: remote.syncedAt ?? local.syncedAt,
        isDirty: false,
      });
    }

    remoteItems.forEach((remote) => {
      if (!this.localAdapter.read(remote.mediaId, remote.episodeId)) {
        this.localAdapter.write({
          ...remote,
          profileId: this.config?.profileId ?? remote.profileId,
          isDirty: false,
        });
      }
    });
  }

  async migrateAnonymousHistory(userId: string): Promise<void> {
    const anonymousAdapter = new LocalStorageAdapter("anonymous");
    const records = anonymousAdapter.readAll();

    if (records.length === 0) {
      return;
    }

    const migrated = records.map((record) => ({
      ...record,
      profileId: `usr_${userId}`,
      isDirty: true,
    }));

    await this.remoteSync.migrateBatch(migrated);

    migrated.forEach((record) => {
      const userAdapter = new LocalStorageAdapter(resolveUserId(userId));
      userAdapter.write(record);
      anonymousAdapter.remove(record.mediaId, record.episodeId);
    });
  }

  private hasPersistableSession(): boolean {
    if (!this.activeMedia) {
      return false;
    }

    const duration =
      this.duration > 0 ? this.duration : this.activeMedia.duration ?? 0;

    return duration > 0 || this.currentTime >= 1;
  }

  private flushNow(): void {
    if (!this.hasPersistableSession()) {
      return;
    }

    this.writeToLocalStorage(this.currentTime);
    this.enqueueRemoteSync(this.currentTime);
    this.lastLocalWrite = performance.now();
    this.lastRemoteSync = performance.now();
  }

  private writeToLocalStorage(currentTime: number): void {
    const record = this.buildRecord(currentTime, false);
    if (!record) {
      return;
    }

    this.syncVersion += 1;
    const withMeta: WatchProgressRecord = {
      ...record,
      syncVersion: this.syncVersion,
      isDirty: true,
      syncedAt: record.syncedAt,
    };

    this.localAdapter.write(withMeta);
  }

  private enqueueRemoteSync(currentTime: number): void {
    const record = this.buildRecord(currentTime, true);
    if (!record) {
      return;
    }

    this.remoteSync.enqueue(record, this.storageUserId);
  }

  private buildRecord(
    currentTime: number,
    markDirty: boolean,
  ): WatchProgressRecord | null {
    if (!this.activeMedia || !this.config) {
      return null;
    }

    const duration = Math.max(
      0,
      Math.round(
        this.duration > 0 ? this.duration : this.activeMedia.duration ?? 0,
      ),
    );
    const percentWatched = computePercentWatched(currentTime, duration);
    const existing = this.localAdapter.read(
      this.activeMedia.mediaId,
      this.activeMedia.episodeId,
    );

    return {
      mediaId: this.activeMedia.mediaId,
      mediaType: this.activeMedia.mediaType,
      episodeId: this.activeMedia.episodeId,
      seasonNumber: this.activeMedia.seasonNumber,
      episodeNumber: this.activeMedia.episodeNumber,
      currentTime,
      duration,
      percentWatched,
      isCompleted: isCompletedPercent(percentWatched),
      lastWatchedAt: new Date().toISOString(),
      profileId: this.config.profileId,
      platform: this.config.platform ?? "WEB",
      deviceId: this.config.deviceId,
      syncedAt: existing?.syncedAt ?? null,
      syncVersion: existing?.syncVersion ?? 0,
      isDirty: markDirty ? true : (existing?.isDirty ?? true),
      title: this.activeMedia.title || existing?.title,
      posterUrl: this.activeMedia.posterUrl ?? existing?.posterUrl ?? null,
      backdropUrl: existing?.backdropUrl ?? null,
      stillUrl: existing?.stillUrl ?? null,
      slug: this.activeMedia.slug || existing?.slug,
      seriesSlug: this.activeMedia.seriesSlug || existing?.seriesSlug,
    };
  }

  patchDisplayMetadata(
    mediaId: string,
    episodeId: string | undefined,
    patch: Pick<
      WatchProgressRecord,
      "title" | "posterUrl" | "backdropUrl" | "stillUrl" | "slug" | "seriesSlug"
    >,
  ): WatchProgressRecord | null {
    const existing = this.localAdapter.read(mediaId, episodeId);
    if (!existing) {
      return null;
    }

    const updated: WatchProgressRecord = {
      ...existing,
      title: patch.title || existing.title,
      posterUrl: patch.posterUrl ?? existing.posterUrl,
      backdropUrl: patch.backdropUrl ?? existing.backdropUrl,
      stillUrl: patch.stillUrl ?? existing.stillUrl,
      slug: patch.slug || existing.slug,
      seriesSlug: patch.seriesSlug || existing.seriesSlug,
    };

    this.localAdapter.write(updated);
    return updated;
  }

  private getCurrentRecord(): WatchProgressRecord | null {
    return this.buildRecord(this.currentTime, true);
  }

  private resolveStoredRecord(): WatchProgressRecord | null {
    if (!this.activeMedia) {
      return null;
    }

    return ProgressTracker.resolveStoredRecord(this.localAdapter, this.activeMedia);
  }

  private static resolveStoredRecord(
    adapter: LocalStorageAdapter,
    media: WatchMediaInfo,
  ): WatchProgressRecord | null {
    const byId = adapter.read(media.mediaId, media.episodeId);
    if (byId) {
      return byId;
    }

    if (media.slug) {
      return adapter.findBySlug(media.slug, media.episodeId);
    }

    return null;
  }

  private static preferCanonicalMediaId(
    incomingMediaId: string,
    storedMediaId: string,
  ): string {
    if (/^\d+$/.test(incomingMediaId)) {
      return incomingMediaId;
    }

    if (/^\d+$/.test(storedMediaId)) {
      return storedMediaId;
    }

    return incomingMediaId;
  }

  private buildRecordStorageKey(mediaId: string, episodeId?: string): string {
    return `${mediaId}:${episodeId ?? "movie"}`;
  }

  private static isSameMediaSession(
    previous: WatchMediaInfo | null,
    next: WatchMediaInfo,
  ): boolean {
    if (!previous) {
      return false;
    }

    const sameEpisode =
      (previous.episodeId ?? "movie") === (next.episodeId ?? "movie");
    if (!sameEpisode) {
      return false;
    }

    if (previous.mediaId === next.mediaId) {
      return true;
    }

    return Boolean(
      previous.slug && next.slug && previous.slug === next.slug,
    );
  }

  private bindLifecycleHandlers(): void {
    if (typeof window === "undefined") {
      return;
    }

    this.beforeUnloadHandler = () => {
      const record = this.getCurrentRecord();
      if (!record) {
        return;
      }

      this.localAdapter.write(record);

      if (this.config?.isAuthenticated && this.config.apiBaseUrl) {
        this.remoteSync.sendBeacon(record, this.config.apiBaseUrl);
      }
    };

    this.visibilityHandler = () => {
      if (document.visibilityState !== "hidden") {
        return;
      }

      const record = this.getCurrentRecord();
      if (!record) {
        return;
      }

      this.localAdapter.write(record);
      this.remoteSync.enqueue(record, this.storageUserId);
    };

    window.addEventListener("beforeunload", this.beforeUnloadHandler);
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  private unbindLifecycleHandlers(): void {
    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}

export function createDefaultTrackerConfig(options: {
  userId: string | null;
  isAuthenticated: boolean;
  getAuthToken: () => string | null;
}): TrackerConfig {
  const deviceId = getDeviceId();
  const profileId = options.userId ? `usr_${options.userId}` : "anonymous";

  return {
    userId: options.userId,
    profileId,
    platform: detectWatchPlatform(),
    deviceId,
    isAuthenticated: options.isAuthenticated,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api",
    getAuthToken: options.getAuthToken,
  };
}
