import { describe, expect, it } from "vitest";
import { reconcileResumeTime } from "../services/progressReconcile";
import { PROGRESS_CONSTANTS } from "../services/progress.types";

describe("resume auto rules", () => {
  it("resumes for position > 30s without prompt", () => {
    const decision = reconcileResumeTime(
      {
        mediaId: "1",
        mediaType: "movie",
        currentTime: 45,
        duration: 1000,
        percentWatched: 4.5,
        isCompleted: false,
        lastWatchedAt: new Date().toISOString(),
        profileId: "anonymous",
        platform: "WEB",
        deviceId: "d",
        syncedAt: null,
        syncVersion: 1,
        isDirty: true,
      },
      null,
    );

    expect(decision.showPrompt).toBe(false);
    expect(decision.resumeTime).toBeGreaterThanOrEqual(
      PROGRESS_CONSTANTS.RESUME_MIN_SECONDS,
    );
  });

  it("skips resume for position < 30s", () => {
    const decision = reconcileResumeTime(
      {
        mediaId: "1",
        mediaType: "movie",
        currentTime: 12,
        duration: 1000,
        percentWatched: 1.2,
        isCompleted: false,
        lastWatchedAt: new Date().toISOString(),
        profileId: "anonymous",
        platform: "WEB",
        deviceId: "d",
        syncedAt: null,
        syncVersion: 1,
        isDirty: true,
      },
      null,
    );

    expect(decision.showPrompt).toBe(false);
    expect(decision.resumeTime).toBe(0);
  });
});
