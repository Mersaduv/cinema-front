import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerController } from "../core/PlayerController";
import { SyncCoordinator } from "../core/SyncCoordinator";
import { DEFAULT_PLAYER_CONFIG } from "../types/player.types";
import { createMockPlaybackEngine } from "./mockPlaybackEngine";

const mockEngine = createMockPlaybackEngine();

vi.mock("hls.js", () => ({
  default: {
    isSupported: () => true,
    Events: {},
  },
}));

vi.mock("../core/ShakaEngine", () => ({
  ShakaEngine: class {
    static isSupported() {
      return false;
    }
  },
}));

vi.mock("../core/EngineFactory", () => ({
  EngineFactory: {
    create: vi.fn(() => mockEngine),
  },
}));

vi.mock("../services/capability", () => ({
  detectDeviceCapabilities: () => ({
    family: "tizen",
    hasMse: true,
    hasEme: false,
    hasNativeHls: true,
    preferNativeHls: true,
    preferWorker: false,
    isTv: true,
    isCoarsePointer: true,
    performanceClass: "low",
    hasTizenAvPlay: false,
    hasWebOsPipeline: false,
    hasExoPlayerBridge: false,
    preferDash: false,
  }),
}));

vi.mock("../utils/format", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/format")>();
  return {
    ...actual,
    backoffDelayMs: () => 0,
  };
});

const source = {
  src: "https://cdn.example.com/ep/master.m3u8",
  subtitleUrl: null,
};

function createController(callbacks: Partial<Parameters<typeof PlayerController>[1]> = {}) {
  return new PlayerController(
    {
      ...DEFAULT_PLAYER_CONFIG,
      watchdogTimeoutMs: 5_000,
      maxRecoveryRetries: 4,
    },
    {
      onSnapshot: () => {},
      onPlaybackTick: () => {},
      onFsmTransition: () => {},
      onSubtitleLines: () => {},
      onRecoveryMessage: () => {},
      ...callbacks,
    },
  );
}

describe("PlayerController recovery teardown", () => {
  beforeEach(() => {
    vi.mocked(mockEngine.attach).mockClear();
    vi.mocked(mockEngine.destroy).mockClear();
    HTMLVideoElement.prototype.pause = vi.fn();
    HTMLVideoElement.prototype.load = vi.fn();
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs three recovery cycles and tears down engine + subtitle RAF each time", async () => {
    const stopLoopSpy = vi.spyOn(SyncCoordinator.prototype, "stopSubtitleLoop");
    const onRecoveryMessage = vi.fn();

    const video = document.createElement("video");
    Object.defineProperty(video, "readyState", { value: 4, writable: true });
    Object.defineProperty(video, "paused", { value: true, writable: true });
    document.body.appendChild(video);

    const controller = createController({ onRecoveryMessage });

    await controller.load(video, source);
    const destroysAfterLoad = vi.mocked(mockEngine.destroy).mock.calls.length;

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await controller.recover();
    }

    expect(vi.mocked(mockEngine.destroy).mock.calls.length).toBeGreaterThanOrEqual(
      destroysAfterLoad + 3,
    );
    expect(stopLoopSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(onRecoveryMessage).toHaveBeenCalled();

    controller.destroy();
    video.remove();
    stopLoopSpy.mockRestore();
  });
});

describe("PlayerController watchdog — stalled manifest", () => {
  beforeEach(() => {
    vi.mocked(mockEngine.attach).mockClear();
    vi.mocked(mockEngine.destroy).mockClear();
    HTMLVideoElement.prototype.pause = vi.fn();
    HTMLVideoElement.prototype.load = vi.fn();
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("triggers recovery within watchdogTimeoutMs when metadata never arrives", async () => {
    const onRecoveryMessage = vi.fn();

    const video = document.createElement("video");
    Object.defineProperty(video, "readyState", { value: 0, writable: true });
    Object.defineProperty(video, "paused", { value: true, writable: true });
    document.body.appendChild(video);

    const controller = createController({ onRecoveryMessage });

    await controller.load(video, source);

    await vi.advanceTimersByTimeAsync(5_000);

    expect(onRecoveryMessage).toHaveBeenCalledWith(
      expect.stringMatching(/بازیابی پخش|بارگذاری طولانی/),
    );
    expect(vi.mocked(mockEngine.destroy)).toHaveBeenCalled();

    controller.destroy();
    video.remove();
  });
});
