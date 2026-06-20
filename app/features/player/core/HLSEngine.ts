import Hls from "hls.js";
import type {
  EngineOptions,
  PlaybackEngine,
} from "../types/playback.types";
import type {
  EngineAudioTrack,
  EngineLevel,
  EngineSubtitleTrack,
} from "../types/player.types";
import { createHlsNetworkingConfig } from "../../../lib/playback-networking";
import { CinemaABRController } from "./CinemaABRController";
import { CinemaBandwidthEstimator } from "./CinemaBandwidthEstimator";

export type HLSEngineOptions = EngineOptions;

/**
 * hls.js adapter — cold-start at lowest quality, two-phase buffer, custom ABR.
 */
export class HLSEngine implements PlaybackEngine {
  readonly id = "hlsjs" as const;
  private hls: Hls | null = null;
  private video: HTMLVideoElement | null = null;
  private manualQuality = -1;
  private lowBufferMode = false;

  private readonly estimator: CinemaBandwidthEstimator;
  private readonly abrController: CinemaABRController;
  private abrDecisionInterval: ReturnType<typeof setInterval> | null = null;
  private coldStartDone = false;
  private isPhase2Buffer = false;

  constructor(private readonly options: HLSEngineOptions) {
    const { config } = options;
    this.estimator = new CinemaBandwidthEstimator({
      safetyFactor: config.abrSafetyFactor,
      upgradeSafetyFactor: config.abrUpgradeSafetyFactor,
    });
    this.abrController = new CinemaABRController(this.estimator, {
      emergencyBufferThresholdSeconds: config.lowBufferThresholdSeconds,
      coldStartMaxLevel: config.coldStartMaxLevel,
    });
  }

  static isSupported(): boolean {
    return Hls.isSupported();
  }

  attach(video: HTMLVideoElement, src: string): void {
    this.destroy();
    this.video = video;

    if (!Hls.isSupported()) {
      return;
    }

    const { config, eventBus } = this.options;
    const performanceClass = this.options.performanceClass ?? "high";

    const steadyBuffer =
      performanceClass === "low"
        ? Math.min(config.steadyBufferTargetSeconds, 10)
        : performanceClass === "medium"
          ? Math.min(config.steadyBufferTargetSeconds, 20)
          : config.steadyBufferTargetSeconds;

    const initialBuffer = Math.min(
      config.initialBufferTargetSeconds,
      steadyBuffer,
    );

    this.hls = new Hls({
      enableWorker: this.options.enableWorker ?? true,
      lowLatencyMode: false,
      startLevel: 0,
      maxBufferLength: initialBuffer,
      maxMaxBufferLength: initialBuffer,
      abrEwmaDefaultEstimate: 100_000,
      abrBandWidthFactor: config.abrSafetyFactor,
      abrBandWidthUpFactor: config.abrUpgradeSafetyFactor,
      startFragPrefetch: false,
      backBufferLength: 15,
      capLevelToPlayerSize: true,
      abrEwmaFastLive: 3.0,
      abrEwmaSlowLive: 9.0,
      testBandwidth: true,
      maxBufferHole: 0.5,
      ...createHlsNetworkingConfig(),
    });

    this.steadyBufferTarget = steadyBuffer;

    this.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      if (!this.hls) {
        return;
      }

      const levels = data.levels.map((level) => ({
        bitrate: level.bitrate,
        height: level.height ?? 0,
      }));

      const coldStartLevel = this.abrController.selectColdStartLevel(levels);
      this.hls.startLevel = coldStartLevel;
      this.hls.nextLevel = coldStartLevel;
      this.coldStartDone = false;

      eventBus.emit("abrPhase", { phase: "cold-start" });
      eventBus.emit("manifestParsed");
    });

    this.hls.on(Hls.Events.LEVELS_UPDATED, () => {
      eventBus.emit("levelsUpdated");
    });

    this.hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
      eventBus.emit("levelSwitched", { level: data.level });
    });

    this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
      eventBus.emit("audioTracksUpdated");
    });

    this.hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
      eventBus.emit("audioTrackSwitched", { id: data.id });
    });

    this.hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
      eventBus.emit("subtitleTracksUpdated");
    });

    this.hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_, data) => {
      eventBus.emit("subtitleTrackSwitched", { id: data.id });
    });

    this.hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
      const stats = data.frag.stats;
      const loadStart = stats.loading.start;
      const loadEnd = stats.loading.end;
      const durationMs = loadEnd - loadStart;

      if (durationMs > 0 && stats.loaded > 0) {
        this.estimator.onSegmentLoaded({
          bytesLoaded: stats.loaded,
          durationMs,
          contentDurationSec: data.frag.duration,
          levelIndex: data.frag.level,
          timestamp: performance.now(),
        });

        eventBus.emit("fragmentLoaded", {
          loadTime: durationMs,
          bytes: stats.loaded,
        });
      }

      if (!this.coldStartDone && this.hls) {
        this.coldStartDone = true;
        eventBus.emit("abrPhase", { phase: "ramp-up" });
        this.startABRDecisionLoop();
      }

      this.checkExpandBuffer();
    });

    this.hls.on(Hls.Events.BUFFER_APPENDED, () => {
      this.checkExpandBuffer();
    });

    this.hls.on(Hls.Events.ERROR, (_, data) => {
      const typeName =
        data.type === Hls.ErrorTypes.NETWORK_ERROR
          ? "networkError"
          : data.type === Hls.ErrorTypes.MEDIA_ERROR
            ? "mediaError"
            : String(data.type);

      this.options.eventBus.emit("error", {
        fatal: data.fatal,
        type: typeName,
        details: String(data.details),
      });
    });

    this.hls.loadSource(src);
    this.hls.attachMedia(video);
  }

  private steadyBufferTarget = 30;

  attachNative(video: HTMLVideoElement, src: string): void {
    this.destroy();
    this.video = video;
    video.src = src;
  }

  getLevels(): EngineLevel[] {
    if (!this.hls) {
      return [];
    }

    return this.hls.levels.map((level, index) => ({
      index,
      height: level.height,
      width: level.width,
      bitrate: level.bitrate,
    }));
  }

  getAudioTracks(): EngineAudioTrack[] {
    if (!this.hls) {
      return [];
    }

    return this.hls.audioTracks.map((track, id) => ({
      id,
      name: track.name,
      lang: track.lang ?? "",
    }));
  }

  getSubtitleTracks(): EngineSubtitleTrack[] {
    if (!this.hls) {
      return [];
    }

    return this.hls.subtitleTracks.map((track, id) => ({
      id,
      name: track.name,
      lang: track.lang ?? "",
    }));
  }

  getCurrentLevel(): number {
    return this.hls?.currentLevel ?? -1;
  }

  getAutoLevelLabel(): string {
    const level = this.hls?.levels[this.hls?.nextAutoLevel ?? -1];
    return level?.height ? `${level.height}p` : "";
  }

  setQuality(levelIndex: number): void {
    if (!this.hls) {
      return;
    }

    if (levelIndex === -1) {
      this.manualQuality = -1;
      this.hls.nextLevel = -1;
    } else {
      this.manualQuality = levelIndex;
      this.hls.nextLevel = levelIndex;
    }
  }

  getManualQuality(): number {
    return this.manualQuality;
  }

  syncQualityAfterSeek(): void {
    if (!this.hls || this.manualQuality === -1) {
      return;
    }

    this.hls.nextLevel = this.manualQuality;
  }

  setAudioTrack(index: number): void {
    if (this.hls && this.hls.audioTracks.length > 0) {
      this.hls.audioTrack = index;
    }
  }

  disableManifestAudioTracks(): void {
    if (!this.hls) {
      return;
    }

    if (this.hls.audioTracks.length > 0) {
      this.hls.audioTrack = 0;
      return;
    }

    if (this.video) {
      this.video.muted = true;
    }
  }

  setSubtitleTrack(index: number): void {
    if (this.hls) {
      this.hls.subtitleTrack = index;
    }
  }

  disableEmbeddedSubtitles(): void {
    if (this.hls) {
      this.hls.subtitleTrack = -1;
    }
  }

  recoverNetwork(): void {
    this.hls?.startLoad();
  }

  recoverMedia(): void {
    this.hls?.recoverMediaError();
  }

  updateBufferHealth(bufferedSeconds: number): void {
    const { config } = this.options;

    if (bufferedSeconds < config.lowBufferThresholdSeconds && !this.lowBufferMode) {
      this.lowBufferMode = true;
      this.options.onLowBuffer?.();

      if (this.hls && this.manualQuality < 0) {
        this.hls.nextLevel = 0;
      }
    } else if (bufferedSeconds >= 10 && this.lowBufferMode) {
      this.lowBufferMode = false;
      this.options.onBufferRecovered?.();

      if (this.hls && this.manualQuality < 0) {
        this.hls.nextLevel = -1;
      }
    }
  }

  getBandwidthEstimate(): number {
    const estimate = this.estimator.getEstimateBps();
    if (estimate !== null) {
      return estimate;
    }

    if (this.hls?.bandwidthEstimate) {
      return this.hls.bandwidthEstimate;
    }

    return 0;
  }

  destroy(): void {
    if (this.abrDecisionInterval) {
      clearInterval(this.abrDecisionInterval);
      this.abrDecisionInterval = null;
    }

    this.estimator.reset();
    this.abrController.reset();
    this.coldStartDone = false;
    this.isPhase2Buffer = false;

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    this.video = null;
    this.manualQuality = -1;
    this.lowBufferMode = false;
  }

  usesHlsJs(): boolean {
    return true;
  }

  get instance(): Hls | null {
    return this.hls;
  }

  private getBufferedAhead(): number {
    const video = this.video;
    if (!video || video.buffered.length === 0) {
      return 0;
    }

    const current = video.currentTime;
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i);
      const end = video.buffered.end(i);
      if (current >= start && current <= end) {
        return Math.max(0, end - current);
      }
    }

    return 0;
  }

  private checkExpandBuffer(): void {
    if (this.isPhase2Buffer) {
      return;
    }

    if (this.getBufferedAhead() >= 3) {
      this.expandToSteadyStateBuffer();
    }
  }

  private expandToSteadyStateBuffer(): void {
    if (!this.hls || this.isPhase2Buffer) {
      return;
    }

    this.isPhase2Buffer = true;
    this.hls.config.maxBufferLength = this.steadyBufferTarget;
    this.hls.config.maxMaxBufferLength = this.steadyBufferTarget;

    if (this.manualQuality === -1) {
      this.hls.nextLevel = -1;
    }

    this.options.eventBus.emit("abrPhase", { phase: "steady" });
  }

  private startABRDecisionLoop(): void {
    if (this.abrDecisionInterval) {
      return;
    }

    const { eventBus } = this.options;

    this.abrDecisionInterval = setInterval(() => {
      if (!this.hls || this.manualQuality !== -1) {
        return;
      }

      const buffered = this.getBufferedAhead();
      const levels =
        this.hls.levels?.map((level) => ({
          bitrate: level.bitrate,
          height: level.height ?? 0,
        })) ?? [];
      const currentLevel =
        this.hls.currentLevel >= 0 ? this.hls.currentLevel : this.hls.nextLevel;

      const decision = this.abrController.decide({
        currentLevelIndex: currentLevel >= 0 ? currentLevel : 0,
        bufferAheadSeconds: buffered,
        availableLevels: levels,
      });

      const estimateMbps = (this.estimator.getEstimateBps() ?? 0) / 1_000_000;

      eventBus.emit("bandwidthEstimate", { estimateMbps });

      if (decision.targetLevelIndex !== currentLevel && decision.reason !== "hold") {
        this.hls!.nextLevel = decision.targetLevelIndex;

        eventBus.emit("abrDecision", {
          from: currentLevel,
          to: decision.targetLevelIndex,
          reason: decision.reason,
          estimateMbps,
        });
      }
    }, 1000);
  }
}
