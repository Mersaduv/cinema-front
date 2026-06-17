import type {
  DeviceCapabilities,
  PlaybackManifest,
  PlaybackPolicy,
} from "../types/playback.types";
import Hls from "hls.js";
import { ShakaEngine } from "./ShakaEngine";

export type PolicyResolution =
  | { ok: true; policy: PlaybackPolicy }
  | { ok: false; reason: string };

function dashPolicy(dashUrl: string): PlaybackPolicy {
  return {
    engineId: "shaka",
    manifestUrl: dashUrl,
    manifestFormat: "dash",
  };
}

/**
 * Selects manifest + engine using capability graph (VOD compatibility-first).
 *
 * Order: platform-native → TV native HLS → DRM/DASH → hls.js → native HLS → progressive.
 */
export function resolvePlaybackPolicy(
  capabilities: DeviceCapabilities,
  manifest: PlaybackManifest,
): PolicyResolution {
  const hlsUrl = manifest.hls?.trim();
  const dashUrl = manifest.dash?.trim();
  const progressiveUrl = manifest.progressive?.trim();
  const drm = manifest.drm ?? null;

  if (!hlsUrl && !dashUrl && !progressiveUrl) {
    return { ok: false, reason: "هیچ منبع پخشی در دسترس نیست." };
  }

  if (capabilities.hasTizenAvPlay && hlsUrl) {
    return {
      ok: true,
      policy: {
        engineId: "tizen-avplay",
        manifestUrl: hlsUrl,
        manifestFormat: "hls",
      },
    };
  }

  if (capabilities.hasWebOsPipeline && hlsUrl) {
    return {
      ok: true,
      policy: {
        engineId: "webos-pipeline",
        manifestUrl: hlsUrl,
        manifestFormat: "hls",
      },
    };
  }

  if (capabilities.hasExoPlayerBridge && (dashUrl || hlsUrl)) {
    return {
      ok: true,
      policy: {
        engineId: "exo-bridge",
        manifestUrl: dashUrl || hlsUrl!,
        manifestFormat: dashUrl ? "dash" : "hls",
      },
    };
  }

  if (drm && dashUrl && capabilities.hasEme && ShakaEngine.isSupported()) {
    return { ok: true, policy: dashPolicy(dashUrl) };
  }

  if (capabilities.preferNativeHls && capabilities.hasNativeHls && hlsUrl) {
    return {
      ok: true,
      policy: {
        engineId: "native-hls",
        manifestUrl: hlsUrl,
        manifestFormat: "hls",
      },
    };
  }

  if (
    capabilities.preferDash &&
    dashUrl &&
    capabilities.hasMse &&
    capabilities.hasEme &&
    ShakaEngine.isSupported()
  ) {
    return { ok: true, policy: dashPolicy(dashUrl) };
  }

  if (
    !capabilities.preferNativeHls &&
    capabilities.hasMse &&
    Hls.isSupported() &&
    hlsUrl
  ) {
    return {
      ok: true,
      policy: {
        engineId: "hlsjs",
        manifestUrl: hlsUrl,
        manifestFormat: "hls",
      },
    };
  }

  if (capabilities.hasNativeHls && hlsUrl) {
    return {
      ok: true,
      policy: {
        engineId: "native-hls",
        manifestUrl: hlsUrl,
        manifestFormat: "hls",
      },
    };
  }

  if (dashUrl && capabilities.hasMse && ShakaEngine.isSupported()) {
    return { ok: true, policy: dashPolicy(dashUrl) };
  }

  if (progressiveUrl) {
    return {
      ok: true,
      policy: {
        engineId: "progressive",
        manifestUrl: progressiveUrl,
        manifestFormat: "progressive",
      },
    };
  }

  return {
    ok: false,
    reason: "مرورگر یا دستگاه شما از HLS پشتیبانی نمی‌کند.",
  };
}
