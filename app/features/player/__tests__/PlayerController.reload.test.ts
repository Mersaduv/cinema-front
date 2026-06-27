import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerController } from "../core/PlayerController";
import { DEFAULT_PLAYER_CONFIG } from "../types/player.types";

const mockEngine = {
  attach: vi.fn(),
  destroy: vi.fn(),
  disableManifestAudioTracks: vi.fn(),
  setQuality: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  usesHlsJs: () => true,
};

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
    family: "desktop",
    hasMse: true,
    hasEme: false,
    hasNativeHls: true,
    preferNativeHls: false,
    preferWorker: false,
    isTv: false,
    isCoarsePointer: false,
    performanceClass: "high",
    hasTizenAvPlay: false,
    hasWebOsPipeline: false,
    hasExoPlayerBridge: false,
    preferDash: false,
  }),
}));

describe("PlayerController.reloadSource", () => {
  beforeEach(() => {
    vi.mocked(mockEngine.attach).mockClear();
    vi.mocked(mockEngine.destroy).mockClear();
    HTMLVideoElement.prototype.pause = vi.fn();
    HTMLVideoElement.prototype.load = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses the same video element across source changes", async () => {
    const video = document.createElement("video");
    document.body.appendChild(video);

    const controller = new PlayerController(DEFAULT_PLAYER_CONFIG, {
      onSnapshot: () => {},
      onPlaybackTick: () => {},
      onFsmTransition: () => {},
      onSubtitleLines: () => {},
      onRecoveryMessage: () => {},
    });

    const sourceA = {
      src: "https://cdn.example.com/a/master.m3u8",
      subtitleUrl: null,
    };
    const sourceB = {
      src: "https://cdn.example.com/b/master.m3u8",
      subtitleUrl: null,
    };

    await controller.load(video, sourceA);
    const videoAfterLoad = video;

    await controller.reloadSource(sourceB);

    expect(videoAfterLoad).toBe(video);
    expect(video.isConnected).toBe(true);
    expect(vi.mocked(mockEngine.destroy)).toHaveBeenCalled();
    expect(vi.mocked(mockEngine.attach)).toHaveBeenCalledTimes(2);

    controller.destroy();
    video.remove();
  });

  it("tears down engine on each reload without leaking destroy calls", async () => {
    const video = document.createElement("video");
    document.body.appendChild(video);

    const controller = new PlayerController(DEFAULT_PLAYER_CONFIG, {
      onSnapshot: () => {},
      onPlaybackTick: () => {},
      onFsmTransition: () => {},
      onSubtitleLines: () => {},
      onRecoveryMessage: () => {},
    });

    const source = {
      src: "https://cdn.example.com/ep/master.m3u8",
      subtitleUrl: null,
    };

    await controller.load(video, source);
    const destroysAfterLoad = vi.mocked(mockEngine.destroy).mock.calls.length;

    await controller.reloadSource({ ...source, src: "https://cdn.example.com/ep2/master.m3u8" });
    await controller.reloadSource({ ...source, src: "https://cdn.example.com/ep3/master.m3u8" });

    expect(vi.mocked(mockEngine.destroy).mock.calls.length).toBeGreaterThanOrEqual(
      destroysAfterLoad + 2,
    );

    controller.destroy();
    video.remove();
  });
});
