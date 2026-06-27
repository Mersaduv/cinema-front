import { describe, expect, it, vi } from "vitest";

vi.mock("hls.js", () => ({
  default: {
    isSupported: () => true,
  },
}));

import { prefersTvBrowserHlsJs } from "../tv-playback-policy";
import type { DeviceCapabilities } from "../../features/player/types/playback.types";

function baseCaps(overrides: Partial<DeviceCapabilities>): DeviceCapabilities {
  return {
    family: "webos",
    hasMse: true,
    hasEme: false,
    hasNativeHls: true,
    preferNativeHls: true,
    preferWorker: false,
    isTv: true,
    isCoarsePointer: true,
    performanceClass: "medium",
    hasTizenAvPlay: false,
    hasWebOsPipeline: false,
    hasExoPlayerBridge: false,
    preferDash: false,
    ...overrides,
  };
}

describe("prefersTvBrowserHlsJs", () => {
  it("returns true for LG webOS browser with MSE", () => {
    expect(prefersTvBrowserHlsJs(baseCaps({ family: "webos" }))).toBe(true);
  });

  it("returns true for Samsung Tizen browser with MSE", () => {
    expect(prefersTvBrowserHlsJs(baseCaps({ family: "tizen" }))).toBe(true);
  });

  it("returns false when native webOS pipeline is available", () => {
    expect(
      prefersTvBrowserHlsJs(baseCaps({ family: "webos", hasWebOsPipeline: true })),
    ).toBe(false);
  });

  it("returns false when Tizen AVPlay is available", () => {
    expect(
      prefersTvBrowserHlsJs(baseCaps({ family: "tizen", hasTizenAvPlay: true })),
    ).toBe(false);
  });

  it("returns false on desktop even with MSE", () => {
    expect(
      prefersTvBrowserHlsJs(
        baseCaps({
          family: "desktop",
          isTv: false,
          preferNativeHls: false,
          preferWorker: true,
          performanceClass: "high",
        }),
      ),
    ).toBe(false);
  });

  it("returns false when MSE is unavailable", () => {
    expect(prefersTvBrowserHlsJs(baseCaps({ hasMse: false }))).toBe(false);
  });
});
