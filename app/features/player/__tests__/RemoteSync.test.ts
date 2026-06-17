import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteSync } from "../services/RemoteSync";
import type { TrackerConfig, WatchProgressRecord } from "../services/progress.types";

function makeRecord(): WatchProgressRecord {
  return {
    mediaId: "9",
    mediaType: "movie",
    currentTime: 38.029,
    duration: 7320,
    percentWatched: 0.52,
    isCompleted: false,
    lastWatchedAt: "2025-06-11T14:32:00.000Z",
    profileId: "usr_1",
    platform: "WEB",
    deviceId: "device",
    syncedAt: null,
    syncVersion: 1,
    isDirty: true,
    slug: "movie",
  };
}

const config: TrackerConfig = {
  userId: "1",
  profileId: "usr_1",
  platform: "WEB",
  deviceId: "device",
  isAuthenticated: true,
  apiBaseUrl: "http://localhost:8005/api",
  getAuthToken: () => "token",
};

describe("RemoteSync", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ syncedAt: "2025-06-11T14:32:01.123Z" }),
      })),
    );
    vi.stubGlobal("navigator", {
      onLine: true,
      sendBeacon: vi.fn(() => true),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("drains queue when online event fires", async () => {
    const sync = new RemoteSync();
    const markSynced = vi.fn();

    sync.configure(config, markSynced);
    sync.enqueue(makeRecord(), "usr_1");

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it("calls sendBeacon with payload on unload helper", () => {
    const sync = new RemoteSync();
    const record = makeRecord();
    const ok = sync.sendBeacon(record, config.apiBaseUrl);

    expect(ok).toBe(true);
    expect(navigator.sendBeacon).toHaveBeenCalledWith(
      "http://localhost:8005/api/v1/watch-progress",
      expect.any(Blob),
    );
  });

  it("deduplicates jobs for same media", async () => {
    const sync = new RemoteSync();
    sync.configure(config, vi.fn());

    sync.enqueue(makeRecord(), "usr_1");
    sync.enqueue({ ...makeRecord(), currentTime: 50 }, "usr_1");

    await sync.flushQueue();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
