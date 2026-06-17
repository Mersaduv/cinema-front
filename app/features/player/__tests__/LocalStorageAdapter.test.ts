import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageAdapter } from "../services/LocalStorageAdapter";
import type { WatchProgressRecord } from "../services/progress.types";

function makeRecord(overrides: Partial<WatchProgressRecord> = {}): WatchProgressRecord {
  return {
    mediaId: "42",
    mediaType: "movie",
    currentTime: 120,
    duration: 3600,
    percentWatched: 3.33,
    isCompleted: false,
    lastWatchedAt: "2025-06-11T12:00:00.000Z",
    profileId: "anonymous",
    platform: "WEB",
    deviceId: "device-1",
    syncedAt: null,
    syncVersion: 1,
    isDirty: true,
    slug: "sample",
    ...overrides,
  };
}

describe("LocalStorageAdapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes and reads a record", () => {
    const adapter = new LocalStorageAdapter("anonymous");
    const record = makeRecord();
    adapter.write(record);

    const loaded = adapter.read("42");
    expect(loaded?.currentTime).toBe(120);
  });

  it("retries after QuotaExceededError", () => {
    const adapter = new LocalStorageAdapter("anonymous");
    const original = Storage.prototype.setItem;
    let calls = 0;

    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      calls += 1;
      if (calls === 1) {
        throw new DOMException("quota", "QuotaExceededError");
      }
      original.call(this, key, value);
    });

    adapter.write(makeRecord());
    expect(setItem.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(adapter.read("42")?.currentTime).toBe(120);
    setItem.mockRestore();
  });

  it("evicts old completed entries", () => {
    const adapter = new LocalStorageAdapter("anonymous");
    adapter.write(
      makeRecord({
        mediaId: "old",
        isCompleted: true,
        lastWatchedAt: "2020-01-01T00:00:00.000Z",
      }),
    );

    adapter.evictOldEntries();
    expect(adapter.read("old")).toBeNull();
  });
});
