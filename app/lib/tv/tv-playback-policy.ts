import Hls from "hls.js";
import type { DeviceCapabilities, PlatformFamily } from "../../features/player/types/playback.types";

/** TV browser shells that ship with Chromium but broken native adaptive HLS. */
const TV_BROWSER_HLSJS_FAMILIES: ReadonlySet<PlatformFamily> = new Set([
  "tizen",
  "webos",
  "androidtv",
  "firetv",
]);

function hasNativePipelineOverride(capabilities: DeviceCapabilities): boolean {
  if (capabilities.family === "tizen" && capabilities.hasTizenAvPlay) {
    return true;
  }

  if (capabilities.family === "webos" && capabilities.hasWebOsPipeline) {
    return true;
  }

  if (
    (capabilities.family === "androidtv" || capabilities.family === "firetv") &&
    capabilities.hasExoPlayerBridge
  ) {
    return true;
  }

  return false;
}

/**
 * Prefer hls.js over <video src="*.m3u8"> on TV browsers when MSE is stable.
 * Samsung Internet (Tizen) and LG webOS browser both need this for multi-variant HLS.
 */
export function prefersTvBrowserHlsJs(capabilities: DeviceCapabilities): boolean {
  if (!capabilities.hasMse || !Hls.isSupported()) {
    return false;
  }

  if (!TV_BROWSER_HLSJS_FAMILIES.has(capabilities.family)) {
    return false;
  }

  return !hasNativePipelineOverride(capabilities);
}
