import shaka from "shaka-player";
import type { DrmConfig, EngineOptions, PlaybackEngine } from "../types/playback.types";
import type {
  EngineAudioTrack,
  EngineLevel,
  EngineSubtitleTrack,
} from "../types/player.types";
import { registerShakaPlaybackNetworking } from "../../../lib/playback-networking";

function drmServers(drm: DrmConfig): Record<string, string> {
  switch (drm.scheme) {
    case "playready":
      return { "com.microsoft.playready": drm.licenseUrl };
    case "fairplay":
      return { "com.apple.fps": drm.licenseUrl };
    case "widevine":
    default:
      return { "com.widevine.alpha": drm.licenseUrl };
  }
}

/**
 * Shaka Player adapter — DASH/CMAF + cold-start two-phase buffer.
 */
export class ShakaEngine implements PlaybackEngine {
  readonly id = "shaka" as const;

  private player: shaka.Player | null = null;
  private video: HTMLVideoElement | null = null;
  private manualQuality = -1;
  private isPhase2Buffer = false;
  private steadyBufferGoal = 30;

  constructor(private readonly options: EngineOptions) {}

  static isSupported(): boolean {
    return shaka.Player.isBrowserSupported();
  }

  attach(video: HTMLVideoElement, src: string): void {
    this.destroy();
    this.video = video;
    this.isPhase2Buffer = false;

    shaka.polyfill.installAll();

    const player = new shaka.Player();
    this.player = player;
    registerShakaPlaybackNetworking(player);

    const performanceClass = this.options.performanceClass ?? "high";
    this.steadyBufferGoal =
      performanceClass === "low"
        ? 10
        : performanceClass === "medium"
          ? 20
          : this.options.config.steadyBufferTargetSeconds;

    const initialBuffer = Math.min(
      this.options.config.initialBufferTargetSeconds,
      this.steadyBufferGoal,
    );

    player.configure({
      streaming: {
        rebufferingGoal: 2,
        bufferingGoal: initialBuffer,
        bufferBehind: 15,
        safeSeekOffset: 5,
        stallEnabled: true,
        stallSkip: 0.1,
        retryParameters: {
          timeout: 120_000,
          maxAttempts: 10,
          baseDelay: 1_000,
          backoffFactor: 2,
          fuzzFactor: 0.5,
        },
      },
      abr: {
        enabled: true,
        defaultBandwidthEstimate: 100_000,
        switchInterval: 8,
        bandwidthUpgradeTarget: this.options.config.abrSafetyFactor,
        bandwidthDowngradeTarget: 0.95,
      },
      manifest: {
        retryParameters: {
          timeout: 120_000,
          maxAttempts: 10,
          baseDelay: 1_000,
          backoffFactor: 2,
          fuzzFactor: 0.5,
        },
      },
    });

    if (this.options.drm) {
      player.configure({
        drm: {
          servers: drmServers(this.options.drm),
        },
      });
    }

    player.addEventListener("error", (event) => {
      const error = (event as CustomEvent<shaka.util.Error>).detail;
      this.options.eventBus.emit("error", {
        fatal: true,
        type: String(error.category),
        details: error.message ?? String(error.code),
      });
    });

    player.addEventListener("buffering", (event) => {
      const buffering = (event as Event & { buffering?: boolean }).buffering;

      if (buffering === false && !this.isPhase2Buffer) {
        this.expandToSteadyStateBuffer();
      }
    });

    void player
      .attach(video)
      .then(() => player.load(src))
      .then(() => {
        this.options.eventBus.emit("abrPhase", { phase: "cold-start" });
        this.options.eventBus.emit("manifestParsed");
        this.options.eventBus.emit("levelsUpdated");
        this.options.eventBus.emit("audioTracksUpdated");
        this.options.eventBus.emit("subtitleTracksUpdated");
      })
      .catch((error: unknown) => {
        this.options.eventBus.emit("error", {
          fatal: true,
          type: "shakaLoad",
          details: error instanceof Error ? error.message : String(error),
        });
      });
  }

  private expandToSteadyStateBuffer(): void {
    if (!this.player || this.isPhase2Buffer) {
      return;
    }

    this.isPhase2Buffer = true;
    this.player.configure({
      streaming: {
        bufferingGoal: this.steadyBufferGoal,
      },
    });
    this.options.eventBus.emit("abrPhase", { phase: "steady" });
  }

  destroy(): void {
    void this.player?.destroy();
    this.player = null;
    this.video = null;
    this.isPhase2Buffer = false;
  }

  getLevels(): EngineLevel[] {
    if (!this.player) {
      return [];
    }

    return this.player
      .getVariantTracks()
      .filter((track, index, tracks) => tracks.findIndex((t) => t.id === track.id) === index)
      .map((track, index) => ({
        index,
        height: track.height ?? undefined,
        width: track.width ?? undefined,
        bitrate: track.bandwidth ?? undefined,
      }));
  }

  getAudioTracks(): EngineAudioTrack[] {
    if (!this.player) {
      return [];
    }

    return this.player.getAudioTracks().map((track, index) => ({
      id: index,
      name: track.label ?? track.language,
      lang: track.language,
    }));
  }

  getSubtitleTracks(): EngineSubtitleTrack[] {
    if (!this.player) {
      return [];
    }

    return this.player.getTextTracks().map((track, index) => ({
      id: index,
      name: track.label ?? track.language,
      lang: track.language,
    }));
  }

  getCurrentLevel(): number {
    return this.manualQuality;
  }

  getAutoLevelLabel(): string {
    const track = this.player?.getStats().width;
    return track ? `${track}p` : "";
  }

  setQuality(levelIndex: number): void {
    if (!this.player) {
      return;
    }

    if (levelIndex === -1) {
      this.player.configure({ abr: { enabled: true } });
      this.manualQuality = -1;
      return;
    }

    const tracks = this.getLevels();
    const target = tracks[levelIndex];
    if (!target) {
      return;
    }

    const variant = this.player
      .getVariantTracks()
      .find((track) => track.height === target.height && track.bandwidth === target.bitrate);

    if (variant) {
      this.player.configure({ abr: { enabled: false } });
      this.player.selectVariantTrack(variant, true);
      this.manualQuality = levelIndex;
    }
  }

  getManualQuality(): number {
    return this.manualQuality;
  }

  syncQualityAfterSeek(): void {
    if (this.manualQuality >= 0) {
      this.setQuality(this.manualQuality);
    }
  }

  setAudioTrack(index: number): void {
    const track = this.player?.getAudioTracks()[index];
    if (track) {
      this.player?.selectAudioTrack(track);
    }
  }

  disableManifestAudioTracks(): void {
    if (this.video) {
      this.video.muted = true;
    }
  }

  setSubtitleTrack(index: number): void {
    const track = this.player?.getTextTracks()[index];
    if (track) {
      this.player?.selectTextTrack(track);
    }
  }

  disableEmbeddedSubtitles(): void {
    this.player?.selectTextTrack(null);
  }

  recoverNetwork(): void {
    if (!this.video?.src && this.player) {
      return;
    }

    const src = this.video?.currentSrc;
    if (src && this.video) {
      this.attach(this.video, src);
    }
  }

  recoverMedia(): void {
    this.recoverNetwork();
  }

  updateBufferHealth(bufferedSeconds: number): void {
    if (bufferedSeconds < this.options.config.lowBufferThresholdSeconds) {
      this.options.onLowBuffer?.();
    } else {
      this.options.onBufferRecovered?.();
    }
  }

  getBandwidthEstimate(): number {
    return this.player?.getStats().estimatedBandwidth ?? 0;
  }

  usesHlsJs(): boolean {
    return false;
  }
}
