import { describe, expect, it, vi } from "vitest";

vi.mock("hls.js", () => ({
  default: {
    isSupported: () => true,
  },
}));

vi.mock("../core/ShakaEngine", () => ({
  ShakaEngine: class {
    static isSupported() {
      return false;
    }
  },
}));

import { resolvePlaybackPolicy } from "../core/PlayerPolicyEngine";

const hlsManifest = {
  hls: "https://cdn.example.com/master.m3u8",
  dash: null,
  progressive: null,
  drm: null,
};

const tvCaps = {
  hasMse: false,
  hasEme: false,
  hasNativeHls: true,
  preferNativeHls: true,
  preferWorker: false,
  isTv: true,
  isCoarsePointer: true,
  performanceClass: "low" as const,
  hasTizenAvPlay: false,
  hasWebOsPipeline: false,
  hasExoPlayerBridge: false,
  preferDash: false,
};

describe("resolvePlaybackPolicy", () => {
  it("selects native HLS on TV when MSE is unavailable", () => {
    const result = resolvePlaybackPolicy(
      {
        ...tvCaps,
        family: "tizen",
      },
      hlsManifest,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.engineId).toBe("native-hls");
      expect(result.policy.manifestFormat).toBe("hls");
    }
  });

  it("prefers hls.js on Samsung Internet (Tizen browser) when MSE works", () => {
    const result = resolvePlaybackPolicy(
      {
        ...tvCaps,
        family: "tizen",
        hasMse: true,
        preferNativeHls: true,
      },
      hlsManifest,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.engineId).toBe("hlsjs");
    }
  });

  it("selects hls.js when MSE is stable and native is not preferred", () => {
    const result = resolvePlaybackPolicy(
      {
        family: "desktop",
        hasMse: true,
        hasEme: true,
        hasNativeHls: false,
        preferNativeHls: false,
        preferWorker: true,
        isTv: false,
        isCoarsePointer: false,
        performanceClass: "high",
        hasTizenAvPlay: false,
        hasWebOsPipeline: false,
        hasExoPlayerBridge: false,
        preferDash: true,
      },
      hlsManifest,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.engineId).toBe("hlsjs");
    }
  });

  it("falls back to progressive MP4 when streaming is unsupported", () => {
    const result = resolvePlaybackPolicy(
      {
        ...tvCaps,
        family: "generic",
        hasNativeHls: false,
      },
      {
        hls: "",
        dash: null,
        progressive: "https://cdn.example.com/preview.mp4",
        drm: null,
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.engineId).toBe("progressive");
    }
  });

  it("returns explicit error when no source is playable", () => {
    const result = resolvePlaybackPolicy(
      {
        ...tvCaps,
        family: "generic",
        hasNativeHls: false,
        preferNativeHls: false,
      },
      { hls: "", dash: null, progressive: null, drm: null },
    );

    expect(result.ok).toBe(false);
  });
});
