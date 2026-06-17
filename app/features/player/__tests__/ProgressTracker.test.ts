import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressTracker } from "../services/ProgressTracker";
import { PROGRESS_CONSTANTS, type WatchMediaInfo } from "../services/progress.types";

const media: WatchMediaInfo = {
  mediaId: "4344",
  mediaType: "movie",
  duration: 3600,
  title: "Sample",
  slug: "sample",
};

describe("ProgressTracker", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-11T14:00:00.000Z"));

    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { progress: null } }),
    })));

    vi.stubGlobal("navigator", {
      onLine: true,
      sendBeacon: vi.fn(() => true),
    });

    let perfNow = 0;
    vi.stubGlobal("performance", {
      now: () => perfNow,
    });
    (globalThis as { advancePerf?: (ms: number) => void }).advancePerf = (
      ms: number,
    ) => {
      perfNow += ms;
    };
  });

  afterEach(() => {
    ProgressTracker.resetInstance();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not reset position when re-attaching same media session", () => {
    const tracker = ProgressTracker.getInstance();
    tracker.init({
      userId: null,
      profileId: "anonymous",
      platform: "WEB",
      deviceId: "device",
      isAuthenticated: false,
      apiBaseUrl: "http://localhost:8005/api",
      getAuthToken: () => null,
    });

    tracker.attachMedia(media);
    tracker.tick(2400, 3600);
    tracker.pause();

    tracker.attachMedia({ ...media, duration: 3600 });
    tracker.updateDuration(3600);

    const progress = tracker.getProgress("4344");
    expect(progress?.currentTime).toBe(2400);
  });

  it("resolves resume by slug when mediaId is not yet known", () => {
    const tracker = ProgressTracker.getInstance();
    tracker.init({
      userId: null,
      profileId: "anonymous",
      platform: "WEB",
      deviceId: "device",
      isAuthenticated: false,
      apiBaseUrl: "http://localhost:8005/api",
      getAuthToken: () => null,
    });

    tracker.attachMedia(media);
    tracker.tick(180, 3600);
    tracker.pause();

    const resumeTime = ProgressTracker.peekLocalResumeTime(
      {
        mediaId: "meninblack3",
        mediaType: "movie",
        slug: "sample",
        title: "Sample",
      },
      null,
    );

    expect(resumeTime).toBe(180);
  });

  it("keeps session when mediaId upgrades but slug stays the same", () => {
    const tracker = ProgressTracker.getInstance();
    tracker.init({
      userId: null,
      profileId: "anonymous",
      platform: "WEB",
      deviceId: "device",
      isAuthenticated: false,
      apiBaseUrl: "http://localhost:8005/api",
      getAuthToken: () => null,
    });

    tracker.attachMedia(media);
    tracker.tick(900, 3600);
    tracker.pause();

    tracker.attachMedia({
      mediaId: "sample",
      mediaType: "movie",
      slug: "sample",
      title: "Sample",
      duration: 3600,
    });
    tracker.tick(910, 3600);
    tracker.pause();

    expect(tracker.getProgress("4344")?.currentTime).toBe(910);
  });

  it("returns local resume instantly without network", () => {
    const tracker = ProgressTracker.getInstance();
    tracker.init({
      userId: null,
      profileId: "anonymous",
      platform: "WEB",
      deviceId: "device",
      isAuthenticated: false,
      apiBaseUrl: "http://localhost:8005/api",
      getAuthToken: () => null,
    });

    tracker.attachMedia(media);
    tracker.tick(120, 3600);
    tracker.pause();

    const decision = tracker.getLocalResumeDecision();
    expect(decision.resumeTime).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("saves progress every 5 seconds during playback", async () => {
    const tracker = ProgressTracker.getInstance();
    tracker.init({
      userId: null,
      profileId: "anonymous",
      platform: "WEB",
      deviceId: "device",
      isAuthenticated: false,
      apiBaseUrl: "http://localhost:8005/api",
      getAuthToken: () => null,
    });

    await tracker.start(media);

    tracker.tick(10, 3600);
    expect(tracker.getProgress("4344")).toBeNull();

    (globalThis as { advancePerf?: (ms: number) => void }).advancePerf?.(
      PROGRESS_CONSTANTS.LOCAL_WRITE_INTERVAL_MS + 1,
    );
    tracker.tick(15, 3600);

    expect(tracker.getProgress("4344")?.currentTime).toBe(15);
  });

  it("flushes on pause immediately", async () => {
    const tracker = ProgressTracker.getInstance();
    tracker.init({
      userId: null,
      profileId: "anonymous",
      platform: "WEB",
      deviceId: "device",
      isAuthenticated: false,
      apiBaseUrl: "http://localhost:8005/api",
      getAuthToken: () => null,
    });

    await tracker.start(media);
    tracker.tick(100, 3600);
    tracker.pause();

    expect(tracker.getProgress("4344")?.currentTime).toBe(100);
  });

  it("writes synchronously on beforeunload", async () => {
    const tracker = ProgressTracker.getInstance();
    tracker.init({
      userId: "1",
      profileId: "usr_1",
      platform: "WEB",
      deviceId: "device",
      isAuthenticated: true,
      apiBaseUrl: "http://localhost:8005/api",
      getAuthToken: () => "token",
    });

    await tracker.start(media);
    tracker.tick(200, 3600);
    tracker.pause();

    window.dispatchEvent(new Event("beforeunload"));

    expect(tracker.getProgress("4344")?.currentTime).toBe(200);
    expect(navigator.sendBeacon).toHaveBeenCalled();
  });
});
