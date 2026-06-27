import type {
  DeviceCapabilities,
  EngineId,
  PlaybackManifest,
  PlaybackPolicy,
} from "../types/playback.types";
import Hls from "hls.js";
import { ShakaEngine } from "./ShakaEngine";
import { prefersTvBrowserHlsJs } from "../../../lib/tv/tv-playback-policy";

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

function hlsPolicy(engineId: EngineId, hlsUrl: string): PlaybackPolicy {
  return {
    engineId,
    manifestUrl: hlsUrl,
    manifestFormat: "hls",
  };
}

/**
 * Ordered playback engines for this device + manifest (used for recovery fallback).
 */
export function listPlaybackEngineCandidates(
  capabilities: DeviceCapabilities,
  manifest: PlaybackManifest,
): EngineId[] {
  const hlsUrl = manifest.hls?.trim();
  const dashUrl = manifest.dash?.trim();
  const progressiveUrl = manifest.progressive?.trim();
  const drm = manifest.drm ?? null;
  const candidates: EngineId[] = [];

  const push = (id: EngineId) => {
    if (!candidates.includes(id)) {
      candidates.push(id);
    }
  };

  if (capabilities.hasTizenAvPlay && hlsUrl) {
    push("tizen-avplay");
  }

  if (capabilities.hasWebOsPipeline && hlsUrl) {
    push("webos-pipeline");
  }

  if (capabilities.hasExoPlayerBridge && (dashUrl || hlsUrl)) {
    push("exo-bridge");
  }

  if (drm && dashUrl && capabilities.hasEme && ShakaEngine.isSupported()) {
    push("shaka");
  }

  // TV browser shells (Tizen, webOS, Android TV): hls.js beats native <video> for adaptive HLS.
  if (prefersTvBrowserHlsJs(capabilities) && hlsUrl) {
    push("hlsjs");
  }

  if (capabilities.preferNativeHls && capabilities.hasNativeHls && hlsUrl) {
    push("native-hls");
  }

  if (
    capabilities.preferDash &&
    dashUrl &&
    capabilities.hasMse &&
    capabilities.hasEme &&
    ShakaEngine.isSupported()
  ) {
    push("shaka");
  }

  if (!capabilities.preferNativeHls && capabilities.hasMse && Hls.isSupported() && hlsUrl) {
    push("hlsjs");
  }

  if (capabilities.hasNativeHls && hlsUrl) {
    push("native-hls");
  }

  if (dashUrl && capabilities.hasMse && ShakaEngine.isSupported()) {
    push("shaka");
  }

  if (progressiveUrl) {
    push("progressive");
  }

  return candidates;
}

function policyForEngine(
  engineId: EngineId,
  manifest: PlaybackManifest,
): PlaybackPolicy | null {
  const hlsUrl = manifest.hls?.trim();
  const dashUrl = manifest.dash?.trim();
  const progressiveUrl = manifest.progressive?.trim();

  switch (engineId) {
    case "tizen-avplay":
    case "webos-pipeline":
    case "native-hls":
    case "hlsjs":
      return hlsUrl ? hlsPolicy(engineId, hlsUrl) : null;
    case "exo-bridge":
      if (dashUrl) {
        return { engineId, manifestUrl: dashUrl, manifestFormat: "dash" };
      }
      return hlsUrl ? hlsPolicy(engineId, hlsUrl) : null;
    case "shaka":
      return dashUrl ? dashPolicy(dashUrl) : null;
    case "progressive":
      return progressiveUrl
        ? { engineId, manifestUrl: progressiveUrl, manifestFormat: "progressive" }
        : null;
    default:
      return null;
  }
}

/**
 * Selects manifest + engine using capability graph (VOD compatibility-first).
 */
export function resolvePlaybackPolicy(
  capabilities: DeviceCapabilities,
  manifest: PlaybackManifest,
): PolicyResolution {
  const hlsUrl = manifest.hls?.trim();
  const dashUrl = manifest.dash?.trim();
  const progressiveUrl = manifest.progressive?.trim();

  if (!hlsUrl && !dashUrl && !progressiveUrl) {
    return { ok: false, reason: "هیچ منبع پخشی در دسترس نیست." };
  }

  const candidates = listPlaybackEngineCandidates(capabilities, manifest);
  const first = candidates[0];

  if (!first) {
    return {
      ok: false,
      reason: "مرورگر یا دستگاه شما از HLS پشتیبانی نمی‌کند.",
    };
  }

  const policy = policyForEngine(first, manifest);

  if (!policy) {
    return {
      ok: false,
      reason: "مرورگر یا دستگاه شما از HLS پشتیبانی نمی‌کند.",
    };
  }

  return { ok: true, policy };
}

/** Pick the next engine during recovery (cycles through viable candidates). */
export function resolveRecoveryPlaybackPolicy(
  capabilities: DeviceCapabilities,
  manifest: PlaybackManifest,
  recoveryAttempt: number,
): PolicyResolution {
  const candidates = listPlaybackEngineCandidates(capabilities, manifest);

  if (candidates.length === 0) {
    return {
      ok: false,
      reason: "مرورگر یا دستگاه شما از HLS پشتیبانی نمی‌کند.",
    };
  }

  const index = Math.min(Math.max(recoveryAttempt - 1, 0), candidates.length - 1);
  const engineId = candidates[index];
  const policy = policyForEngine(engineId, manifest);

  if (!policy) {
    return resolvePlaybackPolicy(capabilities, manifest);
  }

  return { ok: true, policy };
}
