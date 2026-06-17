import { buildRecordKey, isCanonicalMediaId } from "./progressKeys";
import type {
  RemoteProgressPayload,
  SyncJob,
  TrackerConfig,
  WatchProgressRecord,
} from "./progress.types";
import { postBeacon } from "../../../lib/tv/beacon";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export class RemoteSync {
  private queue: SyncJob[] = [];
  private isSyncing = false;
  private fetchInFlight = new Map<string, Promise<number | null>>();
  private config: TrackerConfig | null = null;
  private markSynced: ((record: WatchProgressRecord, syncedAt: string) => void) | null =
    null;
  private onlineHandler: (() => void) | null = null;

  configure(
    config: TrackerConfig,
    markSynced: (record: WatchProgressRecord, syncedAt: string) => void,
  ): void {
    this.config = config;
    this.markSynced = markSynced;

    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
    }

    this.onlineHandler = () => {
      void this.flushQueue();
    };
    window.addEventListener("online", this.onlineHandler);
  }

  destroy(): void {
    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
      this.onlineHandler = null;
    }
    this.queue = [];
    this.isSyncing = false;
  }

  enqueue(record: WatchProgressRecord, userId: string): void {
    if (!this.config?.isAuthenticated) {
      return;
    }

    if (
      !record.mediaId ||
      !isCanonicalMediaId(record.mediaId) ||
      (Math.round(record.duration) <= 0 && record.currentTime < 1)
    ) {
      return;
    }

    const key = buildRecordKey(record, userId);
    const existing = this.queue.findIndex((job) => job.key === key);
    const job: SyncJob = { key, record, retries: 0 };

    if (existing >= 0) {
      this.queue[existing] = job;
    } else {
      this.queue.push(job);
    }

    void this.flushQueue();
  }

  async flushQueue(): Promise<void> {
    if (this.isSyncing || !this.config?.isAuthenticated || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;

    while (this.queue.length > 0) {
      const job = this.queue[0];

      try {
        const syncedAt = await this.sendToApi(job.record);
        this.queue.shift();
        this.markSynced?.(job.record, syncedAt);
      } catch {
        job.retries += 1;
        if (job.retries >= 3) {
          this.queue.shift();
        } else {
          await sleep(2 ** job.retries * 1000);
          break;
        }
      }
    }

    this.isSyncing = false;
  }

  sendBeacon(record: WatchProgressRecord, apiBaseUrl: string): boolean {
    const payload = this.toPayload(record);
    const url = `${apiBaseUrl}/v1/watch-progress`;

    return postBeacon(url, JSON.stringify(payload));
  }

  async fetchServerProgress(
    mediaId: string,
    episodeId?: string,
  ): Promise<number | null> {
    if (!this.config?.isAuthenticated) {
      return null;
    }

    const token = this.config.getAuthToken();
    if (!token) {
      return null;
    }

    const cacheKey = `${mediaId}:${episodeId ?? "movie"}`;
    const inFlight = this.fetchInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const query = episodeId
      ? `?episodeId=${encodeURIComponent(episodeId)}`
      : "";

    const request = (async () => {
      const response = await fetch(
        `${this.config!.apiBaseUrl}/v1/watch-progress/${encodeURIComponent(mediaId)}${query}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        data?: { progress?: { currentTime?: number } | null };
      };

      return data.data?.progress?.currentTime ?? null;
    })().finally(() => {
      this.fetchInFlight.delete(cacheKey);
    });

    this.fetchInFlight.set(cacheKey, request);
    return request;
  }

  async migrateBatch(records: WatchProgressRecord[]): Promise<void> {
    if (!this.config?.isAuthenticated || records.length === 0) {
      return;
    }

    const token = this.config.getAuthToken();
    if (!token) {
      return;
    }

    await fetch(`${this.config.apiBaseUrl}/v1/watch-progress/migrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-Device-Id": this.config.deviceId,
      },
      body: JSON.stringify({
        records: records.map((record) => this.toPayload(record)),
      }),
    });
  }

  private async sendToApi(record: WatchProgressRecord): Promise<string> {
    const config = this.config;
    if (!config) {
      throw new Error("RemoteSync not configured");
    }

    const token = config.getAuthToken();
    if (!token) {
      throw new Error("Missing auth token");
    }

    const response = await fetch(`${config.apiBaseUrl}/v1/watch-progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-Device-Id": config.deviceId,
      },
      body: JSON.stringify(this.toPayload(record)),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const data = (await response.json()) as { syncedAt?: string };
    return data.syncedAt ?? new Date().toISOString();
  }

  private toPayload(record: WatchProgressRecord): RemoteProgressPayload {
    return {
      mediaId: record.mediaId,
      episodeId: record.episodeId ?? null,
      currentTime: record.currentTime,
      duration: Math.max(0, Math.round(record.duration)),
      percentWatched: record.percentWatched / 100,
      isCompleted: record.isCompleted,
      profileId: record.profileId,
      platform: record.platform,
      deviceId: record.deviceId,
      lastWatchedAt: record.lastWatchedAt,
      seasonNumber: record.seasonNumber,
      episodeNumber: record.episodeNumber,
    };
  }
}
