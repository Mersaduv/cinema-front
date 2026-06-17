import type {
  EngineId,
  ManifestFormat,
  PlatformFamily,
  QoEEvent,
  QoEEventName,
} from "../types/playback.types";
import { postBeacon } from "../../../lib/tv/beacon";

const DEVICE_ID_KEY = "cinema-qoe-device-id";
const FLUSH_INTERVAL_MS = 10_000;
const MAX_BATCH_SIZE = 10;

let sessionCounter = 0;

function nextSessionId(): string {
  sessionCounter += 1;
  return `cinema-${Date.now()}-${sessionCounter}`;
}

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);

    if (existing) {
      return existing;
    }

    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(DEVICE_ID_KEY, created);

    return created;
  } catch {
    return "unknown";
  }
}

function inferPlatform(platformFamily: PlatformFamily): "WEB" | "MOBILE" | "TV" {
  if (["tizen", "webos", "firetv", "androidtv", "roku"].includes(platformFamily)) {
    return "TV";
  }

  if (platformFamily === "mobile") {
    return "MOBILE";
  }

  return "WEB";
}

function sendEvents(events: QoEEvent[]): void {
  if (events.length === 0 || typeof window === "undefined") {
    return;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";
  const endpoint =
    process.env.NEXT_PUBLIC_QOE_ENDPOINT ?? `${apiBase.replace(/\/$/, "")}/v1/qoe`;

  const payload = JSON.stringify(
    events.map((event) => ({
      sessionId: event.sessionId,
      deviceId: getOrCreateDeviceId(),
      mediaId: event.mediaId ?? "unknown",
      episodeId: event.episodeId ?? null,
      platform: event.platform ?? inferPlatform(event.platformFamily),
      platformFamily: event.platformFamily,
      engineId: event.engineId,
      manifestFormat: event.manifestFormat ?? "hls",
      eventType: event.name.replace(/^playback\./, ""),
      startupMs: event.data?.startupMs ?? null,
      rebufferCount: event.data?.count ?? null,
      rebufferDurationMs: event.data?.durationMs ?? null,
      errorLayer: event.data?.layer ?? null,
      errorCode: typeof event.data?.message === "string" ? event.data.message : null,
      bitrateKbps: event.data?.bitrateKbps ?? null,
      timestamp: event.timestamp,
    })),
  );

  const sameOrigin = (() => {
    try {
      return new URL(endpoint, window.location.href).origin === window.location.origin;
    } catch {
      return false;
    }
  })();

  if (sameOrigin && typeof navigator !== "undefined") {
    if (postBeacon(endpoint, payload)) {
      return;
    }
  }

  void fetch(endpoint, {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => {
    // Telemetry must never break playback.
  });
}

/**
 * Lightweight QoE telemetry — console in dev, batched beacon in production.
 */
export class PlayerTelemetry {
  readonly sessionId: string;
  private engineId: EngineId = "hlsjs";
  private platformFamily: PlatformFamily = "desktop";
  private manifestFormat: ManifestFormat = "hls";
  private mediaId = "unknown";
  private episodeId?: string;
  private sessionStartAt = 0;
  private firstFrameAt: number | null = null;
  private rebufferCount = 0;
  private rebufferDurationMs = 0;
  private rebufferStartedAt: number | null = null;
  private destroyed = false;
  private queue: QoEEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.sessionId = nextSessionId();
  }

  configure(
    engineId: EngineId,
    platformFamily: PlatformFamily,
    options?: {
      manifestFormat?: ManifestFormat;
      mediaId?: string;
      episodeId?: string;
    },
  ): void {
    this.engineId = engineId;
    this.platformFamily = platformFamily;

    if (options?.manifestFormat) {
      this.manifestFormat = options.manifestFormat;
    }

    if (options?.mediaId) {
      this.mediaId = options.mediaId;
    }

    if (options?.episodeId) {
      this.episodeId = options.episodeId;
    }
  }

  setMediaContext(mediaId: string, episodeId?: string): void {
    this.mediaId = mediaId;
    this.episodeId = episodeId;
  }

  markSessionStart(): void {
    this.sessionStartAt = performance.now();
    this.track("playback.session_start");
  }

  markFirstFrame(): void {
    if (this.firstFrameAt !== null) {
      return;
    }

    this.firstFrameAt = performance.now();
    const startupMs =
      this.sessionStartAt > 0
        ? Math.round(this.firstFrameAt - this.sessionStartAt)
        : 0;

    this.track("playback.startup", { startupMs });
  }

  markRebufferStart(): void {
    if (this.rebufferStartedAt !== null) {
      return;
    }

    this.rebufferStartedAt = performance.now();
    this.rebufferCount += 1;
  }

  markRebufferEnd(): void {
    if (this.rebufferStartedAt === null) {
      return;
    }

    const durationMs = Math.round(performance.now() - this.rebufferStartedAt);
    this.rebufferDurationMs += durationMs;
    this.rebufferStartedAt = null;
    this.track("playback.rebuffer", {
      count: this.rebufferCount,
      durationMs,
      totalDurationMs: this.rebufferDurationMs,
    });
  }

  trackError(layer: string, message: string): void {
    this.track("playback.error", { layer, message });
  }

  trackEngineSelected(engineId: EngineId, manifestFormat: string): void {
    this.manifestFormat = manifestFormat as ManifestFormat;
    this.track("playback.engine_selected", { engineId, manifestFormat });
  }

  trackAbrUpgrade(fromLevel: number, toLevel: number, estimateMbps: number): void {
    this.track("playback.abr_upgrade", {
      fromLevel,
      toLevel,
      estimateMbps,
      bitrateKbps: estimateMbps * 1000,
    });
  }

  trackAbrDowngrade(fromLevel: number, toLevel: number, estimateMbps: number): void {
    this.track("playback.abr_downgrade", {
      fromLevel,
      toLevel,
      estimateMbps,
      bitrateKbps: estimateMbps * 1000,
    });
  }

  trackAbrEmergency(fromLevel: number, estimateMbps: number): void {
    this.track("playback.abr_emergency", {
      fromLevel,
      estimateMbps,
      bitrateKbps: estimateMbps * 1000,
    });
  }

  markEnded(): void {
    this.track("playback.ended", {
      rebufferCount: this.rebufferCount,
      rebufferDurationMs: this.rebufferDurationMs,
      startupMs:
        this.firstFrameAt !== null && this.sessionStartAt > 0
          ? Math.round(this.firstFrameAt - this.sessionStartAt)
          : null,
    });
  }

  destroy(): void {
    this.flush();
    this.destroyed = true;
  }

  flush(): void {
    if (this.queue.length === 0) {
      return;
    }

    const batch = [...this.queue];
    this.queue = [];

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (process.env.NODE_ENV !== "production") {
      batch.forEach((event) => console.debug("[cinema-qoe]", event));
    }

    sendEvents(batch);
  }

  private track(
    name: QoEEventName,
    data?: Record<string, string | number | boolean | null>,
  ): void {
    if (this.destroyed) {
      return;
    }

    const event: QoEEvent = {
      name,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      engineId: this.engineId,
      platformFamily: this.platformFamily,
      manifestFormat: this.manifestFormat,
      mediaId: this.mediaId,
      episodeId: this.episodeId,
      platform: inferPlatform(this.platformFamily),
      data,
    };

    this.record(event);
  }

  private record(event: QoEEvent): void {
    this.queue.push(event);

    const eventType = event.name.replace(/^playback\./, "");

    if (["error", "ended"].includes(eventType)) {
      this.flush();
      return;
    }

    if (this.queue.length >= MAX_BATCH_SIZE) {
      this.flush();
      return;
    }

    this.scheduleFlush(FLUSH_INTERVAL_MS);
  }

  private scheduleFlush(delayMs: number): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, delayMs);
  }
}

let sharedTelemetry: PlayerTelemetry | null = null;

export function getPlayerTelemetry(): PlayerTelemetry {
  if (!sharedTelemetry) {
    sharedTelemetry = new PlayerTelemetry();
  }

  return sharedTelemetry;
}

export function resetPlayerTelemetry(): void {
  sharedTelemetry?.destroy();
  sharedTelemetry = null;
}
