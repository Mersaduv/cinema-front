import type { WatchPlatform } from "./progress.types";
import type {
  DeviceCapabilities,
  PerformanceClass,
  PlatformFamily,
} from "../types/playback.types";
import {
  detectExoPlayerBridge,
  detectTizenAvPlay,
  detectWebOsPipeline,
} from "./platformNative";

type CapabilityInput = {
  userAgent?: string;
  video?: Pick<HTMLVideoElement, "canPlayType"> | null;
  hasMediaSource?: boolean;
  coarsePointer?: boolean;
  screenWidth?: number;
};

function readUserAgent(input?: CapabilityInput): string {
  if (input?.userAgent !== undefined) {
    return input.userAgent;
  }

  return typeof navigator !== "undefined" ? navigator.userAgent : "";
}

function detectPlatformFamily(ua: string): PlatformFamily {
  const lower = ua.toLowerCase();

  if (/roku/i.test(ua)) {
    return "roku";
  }

  if (/amazonwebappplatform|aft[a-z0-9]+/i.test(ua) || /silk|firetv|fire\s*tv/i.test(lower)) {
    return "firetv";
  }

  if (/tizen/i.test(ua) || typeof (globalThis as { tizen?: unknown }).tizen !== "undefined") {
    return "tizen";
  }

  if (/web0s|webos/i.test(ua) || typeof (globalThis as { webOS?: unknown }).webOS !== "undefined") {
    return "webos";
  }

  if (
    /android\s*tv|google\s*tv|crkey|bravia/i.test(lower) ||
    (/android/i.test(lower) && !/mobile/i.test(lower))
  ) {
    return "androidtv";
  }

  if (/iphone|ipad|ipod|android.*mobile|mobile/i.test(lower)) {
    return "mobile";
  }

  if (/smart-tv|smarttv|hbbtv|netcast|viera|philips|hisense/i.test(lower)) {
    return "generic";
  }

  return "desktop";
}

function detectNativeHls(
  video: Pick<HTMLVideoElement, "canPlayType"> | null | undefined,
): boolean {
  if (!video) {
    return false;
  }

  return (
    video.canPlayType("application/vnd.apple.mpegurl") !== "" ||
    video.canPlayType("application/x-mpegURL") !== ""
  );
}

/** Functional MSE probe — existence-only checks fail on broken Tizen MSE builds. */
export function probeMediaSource(): boolean {
  if (typeof window === "undefined" || typeof window.MediaSource === "undefined") {
    return false;
  }

  try {
    const supported = MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"');
    if (!supported) {
      return false;
    }

    const ms = new MediaSource();
    const url = URL.createObjectURL(ms);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function detectHasMse(hasMediaSource?: boolean): boolean {
  if (hasMediaSource !== undefined) {
    return hasMediaSource;
  }

  return probeMediaSource();
}

function detectCoarsePointer(input?: CapabilityInput): boolean {
  if (input?.coarsePointer !== undefined) {
    return input.coarsePointer;
  }

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(pointer: coarse)").matches;
}

function detectScreenWidth(input?: CapabilityInput): number {
  if (input?.screenWidth !== undefined) {
    return input.screenWidth;
  }

  return typeof window !== "undefined" ? window.screen.width : 0;
}

function parseChromeVersion(ua: string): number {
  const match = ua.match(/Chrome\/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function detectPerformanceClass(
  platformFamily: PlatformFamily,
  ua: string,
): PerformanceClass {
  if (platformFamily === "desktop") {
    return "high";
  }

  if (platformFamily === "mobile") {
    return "medium";
  }

  const chromeVersion = parseChromeVersion(ua);

  if (platformFamily === "tizen") {
    if (chromeVersion >= 94) {
      return "medium";
    }

    return "low";
  }

  if (platformFamily === "webos") {
    if (chromeVersion >= 79) {
      return "medium";
    }

    return "low";
  }

  if (platformFamily === "androidtv" || platformFamily === "firetv") {
    return "medium";
  }

  return "low";
}

function isTvFamily(family: PlatformFamily): boolean {
  return (
    family === "tizen" ||
    family === "webos" ||
    family === "firetv" ||
    family === "androidtv" ||
    family === "roku" ||
    family === "generic"
  );
}

/**
 * Feature-first device capability graph — avoids UA-only playback decisions.
 */
export function detectDeviceCapabilities(input: CapabilityInput = {}): DeviceCapabilities {
  const ua = readUserAgent(input);
  const family = detectPlatformFamily(ua);
  const hasMse = detectHasMse(input.hasMediaSource);
  const hasEme =
    typeof window !== "undefined" &&
    typeof (window as Window & { MediaKeys?: unknown }).MediaKeys !== "undefined";
  const hasNativeHls = detectNativeHls(input.video ?? null);
  const isCoarsePointer = detectCoarsePointer(input);
  const screenWidth = detectScreenWidth(input);
  const isTv =
    isTvFamily(family) ||
    (family !== "desktop" &&
      family !== "mobile" &&
      isCoarsePointer &&
      screenWidth >= 1280) ||
    /smart-tv|smarttv|googletv|hbbtv/i.test(ua);

  const preferNativeHls =
    isTv ||
    family === "tizen" ||
    family === "webos" ||
    family === "firetv" ||
    family === "androidtv" ||
    (!hasMse && hasNativeHls);

  const preferWorker =
    !isTv &&
    family !== "tizen" &&
    family !== "webos" &&
    family !== "firetv" &&
    hasMse;

  const hasTizenAvPlay = family === "tizen" && detectTizenAvPlay();
  const hasWebOsPipeline = family === "webos" && detectWebOsPipeline();
  const hasExoPlayerBridge =
    (family === "androidtv" || family === "firetv") && detectExoPlayerBridge();

  const preferDash =
    !preferNativeHls &&
    (family === "desktop" || (hasMse && hasEme));

  return {
    family,
    hasMse,
    hasEme,
    hasNativeHls,
    preferNativeHls,
    preferWorker,
    isTv,
    isCoarsePointer,
    performanceClass: detectPerformanceClass(family, ua),
    hasTizenAvPlay,
    hasWebOsPipeline,
    hasExoPlayerBridge,
    preferDash,
  };
}

/** Maps capabilities to progress API platform enum. */
export function detectWatchPlatform(input: CapabilityInput = {}): WatchPlatform {
  const caps = detectDeviceCapabilities(input);

  if (caps.isTv) {
    return "TV";
  }

  if (caps.family === "mobile") {
    return "MOBILE";
  }

  return "WEB";
}

export function getEngineLabel(engineId: string): string {
  switch (engineId) {
    case "hlsjs":
      return "Adaptive HLS";
    case "native-hls":
      return "Native HLS";
    case "shaka":
      return "DASH (Shaka)";
    case "tizen-avplay":
      return "Tizen AVPlay";
    case "webos-pipeline":
      return "webOS Media Pipeline";
    case "exo-bridge":
      return "ExoPlayer (Native)";
    case "progressive":
      return "Progressive MP4";
    default:
      return "HLS";
  }
}
