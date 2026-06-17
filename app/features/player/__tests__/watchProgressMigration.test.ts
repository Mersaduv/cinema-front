import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageAdapter } from "../services/LocalStorageAdapter";
import type { WatchProgressRecord } from "../services/progress.types";

describe("anonymous migration payload", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("collects anonymous records for batch migrate", () => {
    const anonymous = new LocalStorageAdapter("anonymous");
    const record: WatchProgressRecord = {
      mediaId: "10",
      mediaType: "movie",
      currentTime: 90,
      duration: 3600,
      percentWatched: 2.5,
      isCompleted: false,
      lastWatchedAt: "2025-06-11T10:00:00.000Z",
      profileId: "anonymous",
      platform: "WEB",
      deviceId: "device",
      syncedAt: null,
      syncVersion: 1,
      isDirty: true,
      slug: "title",
    };

    anonymous.write(record);
    const batch = anonymous.readAll();

    expect(batch).toHaveLength(1);
    expect(batch[0].mediaId).toBe("10");
    expect(batch[0].profileId).toBe("anonymous");
  });
});
