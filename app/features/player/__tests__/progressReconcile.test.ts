import { describe, expect, it } from "vitest";
import { reconcileResumeTime } from "../services/progressReconcile";
import type { WatchProgressRecord } from "../services/progress.types";

function makeRecord(currentTime: number, percent = 40): WatchProgressRecord {
  return {
    mediaId: "1",
    mediaType: "movie",
    currentTime,
    duration: 3600,
    percentWatched: percent,
    isCompleted: false,
    lastWatchedAt: new Date().toISOString(),
    profileId: "anonymous",
    platform: "WEB",
    deviceId: "device",
    syncedAt: null,
    syncVersion: 1,
    isDirty: true,
    slug: "movie",
  };
}

describe("reconcileResumeTime", () => {
  it("auto-resumes above 30s and below 90% without a prompt", () => {
    const decision = reconcileResumeTime(makeRecord(758), null);
    expect(decision.resumeTime).toBe(758);
    expect(decision.showPrompt).toBe(false);
  });

  it("does not resume below 30s", () => {
    const decision = reconcileResumeTime(makeRecord(20), null);
    expect(decision.resumeTime).toBe(0);
    expect(decision.showPrompt).toBe(false);
  });

  it("prefers server time when it is newer", () => {
    const decision = reconcileResumeTime(makeRecord(100), 500);
    expect(decision.resumeTime).toBe(500);
    expect(decision.source).toBe("server");
  });

  it("uses local time when within tolerance", () => {
    const decision = reconcileResumeTime(makeRecord(100), 102);
    expect(decision.resumeTime).toBe(100);
    expect(decision.source).toBe("local");
  });
});
