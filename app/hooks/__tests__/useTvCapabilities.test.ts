import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { DeviceCapabilities } from "../../features/player/types/playback.types";

const detectMock = vi.fn<[], DeviceCapabilities>();

vi.mock("../../features/player/services/capability", () => ({
  detectDeviceCapabilities: (...args: unknown[]) => detectMock(...args),
}));

function tvCaps(): DeviceCapabilities {
  return {
    family: "tizen",
    isTv: true,
    supportsMse: true,
    supportsNativeHls: true,
    prefersNativeHls: false,
    userAgent: "tizen",
  };
}

function desktopCaps(): DeviceCapabilities {
  return {
    family: "desktop",
    isTv: false,
    supportsMse: true,
    supportsNativeHls: false,
    prefersNativeHls: false,
    userAgent: "chrome",
  };
}

describe("useTvCapabilities hooks", () => {
  const envKey = "NEXT_PUBLIC_UNIFIED_TV_UI";
  const previousEnv = process.env[envKey];

  afterEach(() => {
    if (previousEnv === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = previousEnv;
    }
    detectMock.mockReset();
    vi.resetModules();
  });

  async function loadHooks() {
    vi.resetModules();
    return import("../useTvCapabilities");
  }

  it("useIsTvCompat reflects device TV detection", async () => {
    detectMock.mockReturnValue(tvCaps());
    const { useIsTvCompat } = await loadHooks();
    const { result } = renderHook(() => useIsTvCompat());
    expect(result.current).toBe(true);
  });

  it("useIsTvUi is false on unified TV", async () => {
    delete process.env[envKey];
    detectMock.mockReturnValue(tvCaps());
    const { useIsTvUi } = await loadHooks();
    const { result } = renderHook(() => useIsTvUi());
    expect(result.current).toBe(false);
  });

  it("useIsTvUi is true on legacy TV shell", async () => {
    process.env[envKey] = "0";
    detectMock.mockReturnValue(tvCaps());
    const { useIsTvUi } = await loadHooks();
    const { result } = renderHook(() => useIsTvUi());
    expect(result.current).toBe(true);
  });

  it("useIsTvUi is false on desktop", async () => {
    detectMock.mockReturnValue(desktopCaps());
    const { useIsTvUi, useIsTvCompat } = await loadHooks();
    const tv = renderHook(() => useIsTvCompat());
    const ui = renderHook(() => useIsTvUi());
    expect(tv.result.current).toBe(false);
    expect(ui.result.current).toBe(false);
  });

  it("useTvCapabilities exposes unifiedUi and legacyTvUi flags", async () => {
    delete process.env[envKey];
    detectMock.mockReturnValue(tvCaps());
    const { useTvCapabilities } = await loadHooks();
    const { result } = renderHook(() => useTvCapabilities());
    expect(result.current.unifiedUi).toBe(true);
    expect(result.current.legacyTvUi).toBe(false);
    expect(result.current.platformFamily).toBe("tizen");
  });
});
