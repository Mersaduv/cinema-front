"use client";

import { useMemo } from "react";
import { detectDeviceCapabilities } from "../features/player/services/capability";
import type { DeviceCapabilities } from "../features/player/types/playback.types";

export type TvDeviceCapabilities = DeviceCapabilities & {
  platformFamily: DeviceCapabilities["family"];
};

export function useTvCapabilities(): TvDeviceCapabilities {
  return useMemo(() => {
    const caps =
      typeof window === "undefined"
        ? detectDeviceCapabilities({ userAgent: "" })
        : detectDeviceCapabilities({
            video:
              typeof document !== "undefined"
                ? document.createElement("video")
                : null,
          });

    return {
      ...caps,
      platformFamily: caps.family,
    };
  }, []);
}

export function useIsTv(): boolean {
  return useTvCapabilities().isTv;
}
