export type WatchPlatform = "WEB" | "MOBILE" | "TV";

export type WatchMediaType = "movie" | "series";

/** Identity passed from watch page into the tracker. */
export type WatchMediaInfo = {
  mediaId: string;
  mediaType: WatchMediaType;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  duration?: number;
  title?: string;
  posterUrl?: string | null;
  slug: string;
  seriesSlug?: string;
};

export type WatchProgressRecord = {
  mediaId: string;
  mediaType: WatchMediaType;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  currentTime: number;
  duration: number;
  percentWatched: number;
  isCompleted: boolean;
  lastWatchedAt: string;
  profileId: string;
  platform: WatchPlatform;
  deviceId: string;
  syncedAt: string | null;
  syncVersion: number;
  isDirty: boolean;
  title?: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  stillUrl?: string | null;
  slug?: string;
  seriesSlug?: string;
};

export type TrackerConfig = {
  userId: string | null;
  profileId: string;
  platform?: WatchPlatform;
  deviceId: string;
  isAuthenticated: boolean;
  apiBaseUrl: string;
  getAuthToken: () => string | null;
};

export type SyncJob = {
  key: string;
  record: WatchProgressRecord;
  retries: number;
};

export type RemoteProgressPayload = {
  mediaId: string;
  episodeId: string | null;
  currentTime: number;
  duration: number;
  percentWatched: number;
  isCompleted: boolean;
  profileId: string;
  platform: WatchPlatform;
  deviceId: string;
  lastWatchedAt: string;
  seasonNumber?: number;
  episodeNumber?: number;
};
export const PROGRESS_CONSTANTS = {
  LOCAL_WRITE_INTERVAL_MS: 5000,
  REMOTE_SYNC_INTERVAL_MS: 30000,
  COMPLETION_THRESHOLD_PERCENT: 90,
  RESUME_MIN_SECONDS: 30,
  RECONCILE_TOLERANCE_SECONDS: 5,
  MAX_HISTORY_INDEX: 50,
  EVICT_COMPLETED_DAYS: 90,
} as const;

