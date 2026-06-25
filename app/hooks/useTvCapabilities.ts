"use client";

import { useMemo } from "react";
import { detectDeviceCapabilities } from "../features/player/services/capability";
import type { DeviceCapabilities } from "../features/player/types/playback.types";
import { isUnifiedTvUiEnabled } from "../lib/tv/unified-ui";

export type TvDeviceCapabilities = DeviceCapabilities & {
  platformFamily: DeviceCapabilities["family"];
  /** Desktop-like chrome on TV (no TvSidebarNav). */
  unifiedUi: boolean;
  /** Legacy TV-only chrome (sidebar + filter sheet). */
  legacyTvUi: boolean;
};

function readCapabilities(): DeviceCapabilities {
  if (typeof window === "undefined") {
    return detectDeviceCapabilities({ userAgent: "" });
  }

  return detectDeviceCapabilities({
    video:
      typeof document !== "undefined" ? document.createElement("video") : null,
  });
}

export function useTvCapabilities(): TvDeviceCapabilities {
  return useMemo(() => {
    const caps = readCapabilities();
    const unifiedUi = caps.isTv && isUnifiedTvUiEnabled();

    return {
      ...caps,
      platformFamily: caps.family,
      unifiedUi,
      legacyTvUi: caps.isTv && !unifiedUi,
    };
  }, []);
}

/** Device is a TV browser — drives CSS compat, remote focus, playback helpers, login pairing. */
export function useIsTvCompat(): boolean {
  return useTvCapabilities().isTv;
}

/** Legacy TV-only shell (sidebar nav + filter sheet). False when unified UI is on. */
export function useIsTvUi(): boolean {
  return useTvCapabilities().legacyTvUi;
}

/**
 * @deprecated Prefer useIsTvCompat (behavior layer) or useIsTvUi (legacy chrome).
 * Maps to useIsTvCompat for backward compatibility.
 */
export function useIsTv(): boolean {
  return useIsTvCompat();
}
