import { describe, expect, it, vi } from "vitest";
import {
  detectDeviceCapabilities,
  detectWatchPlatform,
  getEngineLabel,
  probeMediaSource,
} from "../services/capability";

describe("detectDeviceCapabilities", () => {
  it("detects Fire TV from AmazonWebAppPlatform UA", () => {
    const caps = detectDeviceCapabilities({
      userAgent: "Mozilla/5.0 (Linux; Android 9; AFTMM) AppleWebKit/537.36 AmazonWebAppPlatform",
      hasMediaSource: true,
      video: { canPlayType: () => "probably" },
      coarsePointer: true,
      screenWidth: 1920,
    });

    expect(caps.family).toBe("firetv");
    expect(caps.isTv).toBe(true);
    expect(caps.preferNativeHls).toBe(true);
    expect(caps.preferWorker).toBe(false);
    expect(caps.hasTizenAvPlay).toBe(false);
  });

  it("detects Tizen and prefers native HLS", () => {
    const caps = detectDeviceCapabilities({
      userAgent: "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0)",
      hasMediaSource: false,
      video: { canPlayType: (type) => (type.includes("mpegurl") ? "maybe" : "") },
      coarsePointer: true,
      screenWidth: 1920,
    });

    expect(caps.family).toBe("tizen");
    expect(caps.hasNativeHls).toBe(true);
    expect(caps.preferNativeHls).toBe(true);
  });

  it("detects LG webOS from Web0S UA", () => {
    const caps = detectDeviceCapabilities({
      userAgent:
        "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager",
      hasMediaSource: true,
      video: { canPlayType: (type) => (type.includes("mpegurl") ? "maybe" : "") },
      coarsePointer: true,
      screenWidth: 1920,
    });

    expect(caps.family).toBe("webos");
    expect(caps.isTv).toBe(true);
    expect(caps.preferNativeHls).toBe(true);
    expect(caps.preferWorker).toBe(false);
    expect(caps.hasWebOsPipeline).toBe(false);
  });

  it("prefers hls.js worker on desktop Chrome", () => {
    const caps = detectDeviceCapabilities({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
      hasMediaSource: true,
      video: { canPlayType: () => "" },
      coarsePointer: false,
      screenWidth: 1920,
    });

    expect(caps.family).toBe("desktop");
    expect(caps.preferNativeHls).toBe(false);
    expect(caps.preferWorker).toBe(true);
    expect(caps.performanceClass).toBe("high");
  });

  it("returns hasMse=false when MediaSource.isTypeSupported throws", () => {
    vi.stubGlobal("MediaSource", {
      isTypeSupported: () => {
        throw new Error("Not supported");
      },
    });

    expect(probeMediaSource()).toBe(false);
    expect(
      detectDeviceCapabilities({
        userAgent: "Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0)",
        video: { canPlayType: () => "maybe" },
      }).hasMse,
    ).toBe(false);
  });
});

describe("detectWatchPlatform", () => {
  it("returns TV for webOS UA", () => {
    expect(
      detectWatchPlatform({
        userAgent: "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36",
        coarsePointer: true,
        screenWidth: 1920,
      }),
    ).toBe("TV");
  });

  it("returns MOBILE for phone UA", () => {
    expect(
      detectWatchPlatform({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        coarsePointer: true,
        screenWidth: 390,
      }),
    ).toBe("MOBILE");
  });
});

describe("getEngineLabel", () => {
  it("maps engine ids to labels", () => {
    expect(getEngineLabel("hlsjs")).toBe("Adaptive HLS");
    expect(getEngineLabel("native-hls")).toBe("Native HLS");
  });
});
