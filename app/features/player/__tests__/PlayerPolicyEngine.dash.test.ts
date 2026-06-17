import { describe, expect, it, vi } from "vitest";

vi.mock("hls.js", () => ({
  default: {
    isSupported: () => true,
  },
}));

vi.mock("../core/ShakaEngine", () => ({
  ShakaEngine: class {
    static isSupported() {
      return true;
    }
  },
}));

import { resolvePlaybackPolicy } from "../core/PlayerPolicyEngine";

const baseCaps = {
  hasMse: true,
  hasEme: true,
  hasNativeHls: true,
  preferNativeHls: false,
  preferWorker: true,
  isTv: false,
  isCoarsePointer: false,
  performanceClass: "high" as const,
  hasTizenAvPlay: false,
  hasWebOsPipeline: false,
  hasExoPlayerBridge: false,
  preferDash: true,
};

describe("resolvePlaybackPolicy — DASH / platform-native", () => {
  it("selects Shaka for DASH on capable desktop", () => {
    const result = resolvePlaybackPolicy(
      { ...baseCaps, family: "desktop" },
      {
        hls: "https://cdn.example.com/master.m3u8",
        dash: "https://cdn.example.com/manifest.mpd",
        progressive: null,
        drm: null,
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.engineId).toBe("shaka");
      expect(result.policy.manifestFormat).toBe("dash");
    }
  });

  it("selects Tizen AVPlay when webapis.avplay is available", () => {
    const result = resolvePlaybackPolicy(
      {
        ...baseCaps,
        family: "tizen",
        preferNativeHls: true,
        hasTizenAvPlay: true,
      },
      {
        hls: "https://cdn.example.com/master.m3u8",
        dash: null,
        progressive: null,
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.engineId).toBe("tizen-avplay");
    }
  });

  it("selects Shaka when DRM manifest is present", () => {
    const result = resolvePlaybackPolicy(
      { ...baseCaps, family: "androidtv", preferDash: true },
      {
        hls: "https://cdn.example.com/master.m3u8",
        dash: "https://cdn.example.com/manifest.mpd",
        progressive: null,
        drm: { scheme: "widevine", licenseUrl: "https://license.example.com/wv" },
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.engineId).toBe("shaka");
    }
  });
});
