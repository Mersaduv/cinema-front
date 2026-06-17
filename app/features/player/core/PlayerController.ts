import { EngineFactory } from "./EngineFactory";
import { NativeHlsEngine } from "./NativeHlsEngine";
import { PlayerEventBus } from "./PlayerEventBus";
import { PlayerFsm } from "./playerFsm";
import { resolvePlaybackPolicy } from "./PlayerPolicyEngine";
import { SyncCoordinator } from "./SyncCoordinator";
import { mediaResolver } from "./MediaResolver";
import { detectDeviceCapabilities } from "../services/capability";
import { getPlayerTelemetry } from "../services/telemetry";
import { backoffDelayMs, isProgressiveAudioUrl } from "../utils/format";
import type { PlaybackEngine, EngineId, PlatformFamily } from "../types/playback.types";
import type {
  MediaSource,
  PlayerConfig,
  PlayerFsmState,
  RecoveryPhase,
} from "../types/player.types";

export type PlayerControllerSnapshot = {
  fsmState: PlayerFsmState;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  readyState: number;
  error: string;
  recoveryPhase: RecoveryPhase;
  recoveryAttempt: number;
  usingHlsJs: boolean;
  engineId: EngineId;
  platformFamily: PlatformFamily;
  autoQualityLabel: string;
};

export type PlayerControllerCallbacks = {
  onSnapshot: (snapshot: PlayerControllerSnapshot) => void;
  onPlaybackTick: (tick: { currentTime: number; isPlaying: boolean }) => void;
  onFsmTransition: (state: PlayerFsmState) => void;
  onSubtitleLines: (lines: string[]) => void;
  onRecoveryMessage: (message: string) => void;
};

/**
 * Central player controller — FSM, engine, sync, watchdog, and recovery.
 */
export class PlayerController {
  readonly eventBus = new PlayerEventBus();
  readonly sync = new SyncCoordinator();

  private fsm = new PlayerFsm();
  private engine: PlaybackEngine | null = null;
  private engineId: EngineId = "hlsjs";
  private platformFamily: PlatformFamily = "desktop";
  private telemetry = getPlayerTelemetry();
  private video: HTMLVideoElement | null = null;
  private config: PlayerConfig;
  private callbacks: PlayerControllerCallbacks;
  private abortController: AbortController | null = null;
  private watchdogTimer: number | null = null;
  private recoveryAttempt = 0;
  private recoveryPhase: RecoveryPhase = "none";
  private lastKnownTime = 0;
  private lastKnownQuality = -1;
  private currentSource: MediaSource | null = null;
  private unbindVideoEvents: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private errorMessage = "";
  private managedSubtitleEnabled = false;
  private nativeSubtitleMode = false;
  private externalDubActive = false;
  private outputVolume = 1;
  private outputMuted = false;
  private lastFullSnapshotAt = 0;
  private pendingSeekTime: number | null = null;
  private seekDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    config: PlayerConfig,
    callbacks: PlayerControllerCallbacks,
  ) {
    this.config = config;
    this.callbacks = callbacks;
    this.platformFamily = detectDeviceCapabilities().family;
    this.wireEngineEvents();
  }

  private createEngineOptions() {
    const capabilities = detectDeviceCapabilities({ video: this.video });
    return {
      config: this.config,
      eventBus: this.eventBus,
      enableWorker: capabilities.preferWorker,
      performanceClass: capabilities.performanceClass,
      drm: this.currentSource?.drm ?? null,
      onLowBuffer: () => {
        this.telemetry.markRebufferStart();
        this.transition("bufferStart");
      },
      onBufferRecovered: () => {
        this.telemetry.markRebufferEnd();
        this.transition("bufferEnd");
      },
    };
  }

  private mountEngine(engineId: EngineId): PlaybackEngine {
    if (this.engine && this.engineId === engineId) {
      return this.engine;
    }

    this.engine?.destroy();
    const capabilities = detectDeviceCapabilities({ video: this.video });
    this.engine = EngineFactory.create(
      engineId,
      this.createEngineOptions(),
      capabilities,
    );
    this.engineId = engineId;
    this.telemetry.configure(engineId, this.platformFamily);
    return this.engine;
  }

  private getEngineOrThrow(): PlaybackEngine {
    if (!this.engine) {
      throw new Error("Playback engine is not mounted.");
    }

    return this.engine;
  }

  /** Bind video element and load media source. */
  async load(video: HTMLVideoElement, source: MediaSource): Promise<void> {
    this.destroy(false);
    this.video = video;
    this.currentSource = mediaResolver.resolveSource(source);
    this.abortController = new AbortController();

    video.controls = false;
    video.playsInline = true;
    this.sync.bindVideo(video);

    this.bindVideoEvents(video);
    this.bindVisibilityHandler();

    this.transition("load");
    this.startWatchdog();
    this.telemetry.markSessionStart();

    const resolved = this.currentSource;
    const useExternalDub = isProgressiveAudioUrl(resolved.dubbedAudioUrl);
    const useManifestAudio =
      !useExternalDub && (resolved.audioTracks?.length ?? 0) > 0;

    this.externalDubActive = useExternalDub;

    if (useExternalDub && resolved.dubbedAudioUrl) {
      this.activateExternalDub(resolved.dubbedAudioUrl);
    } else {
      this.deactivateExternalDub();
      video.muted = this.outputMuted;
      video.volume = this.outputVolume;
      void useManifestAudio;
    }

    const policyResult = resolvePlaybackPolicy(
      detectDeviceCapabilities({ video }),
      mediaResolver.toPlaybackManifest(resolved),
    );

    if (!policyResult.ok) {
      this.setError(policyResult.reason);
      return;
    }

    const { policy } = policyResult;
    const engine = this.mountEngine(policy.engineId);
    this.telemetry.trackEngineSelected(policy.engineId, policy.manifestFormat);
    engine.attach(video, policy.manifestUrl);

    if (this.externalDubActive) {
      engine.disableManifestAudioTracks();
    }

    if (
      policy.engineId === "native-hls" ||
      policy.engineId === "webos-pipeline" ||
      policy.engineId === "progressive"
    ) {
      this.transition("manifestReady");
    }

    if (resolved.subtitleUrl) {
      if (
        (policy.engineId === "native-hls" || policy.engineId === "webos-pipeline") &&
        this.engine instanceof NativeHlsEngine
      ) {
        this.nativeSubtitleMode = true;
        this.managedSubtitleEnabled = false;
        this.engine.attachSubtitle(resolved.subtitleUrl);
      } else {
        this.nativeSubtitleMode = false;
        this.sync.setManagedSubtitleUrl(resolved.subtitleUrl);
        this.managedSubtitleEnabled = true;
        engine.disableEmbeddedSubtitles();
        try {
          await this.sync.loadExternalSubtitles(
            resolved.subtitleUrl,
            this.abortController.signal,
          );
          this.sync.startSubtitleLoop(this.callbacks.onSubtitleLines);
        } catch {
          // Subtitle load failure is non-fatal.
        }
      }
    }
  }

  /** Play media. Returns false when playback could not start. */
  async play(options?: { silent?: boolean }): Promise<boolean> {
    if (!this.video) {
      return false;
    }

    try {
      if (this.engine?.controlsPlayback?.()) {
        await this.engine.play?.();
      } else {
        await this.video.play();
      }
      this.errorMessage = "";
      this.transition("play");

      if (this.externalDubActive) {
        const dubStarted = await this.sync.audio.syncPlayState();
        if (dubStarted) {
          this.video.muted = true;
        } else {
          this.deactivateExternalDub();
        }
      } else {
        await this.sync.audio.syncPlayState();
      }

      this.emitSnapshot();
      return true;
    } catch {
      if (!options?.silent) {
        this.setError("شروع پخش در این مرورگر انجام نشد.");
      }
      return false;
    }
  }

  /** Pause media. */
  pause(): void {
    if (this.engine?.controlsPlayback?.()) {
      this.engine.pause?.();
    } else {
      this.video?.pause();
    }
    this.transition("pause");
    void this.sync.audio.syncPlayState();
  }

  /** Toggle play/pause. */
  async togglePlay(): Promise<void> {
    if (!this.video) {
      return;
    }

    if (this.video.paused) {
      await this.play();
    } else {
      this.pause();
    }
  }

  seek(seconds: number): void {
    if (!this.video) {
      return;
    }

    const duration = this.video.duration || 0;
    const targetTime = Math.max(
      0,
      Math.min(duration, this.video.currentTime + seconds),
    );
    this.seekTo(targetTime);
  }

  seekTo(time: number): void {
    if (!this.video) {
      return;
    }

    const duration = this.video.duration || 0;
    const clamped = Math.max(0, Math.min(duration, time));

    if (this.seekDebounceTimer) {
      clearTimeout(this.seekDebounceTimer);
    }

    this.pendingSeekTime = clamped;

    this.seekDebounceTimer = setTimeout(() => {
      this.seekDebounceTimer = null;
      if (!this.video || this.pendingSeekTime === null) {
        return;
      }

      const targetTime = this.pendingSeekTime;
      this.pendingSeekTime = null;

      this.transition("seekStart");

      if (this.engine?.controlsPlayback?.()) {
        this.engine.seekTo?.(targetTime);
      }

      this.video.currentTime = targetTime;
    }, 80);
  }

  /** Hot-swap managed subtitle URL without reloading HLS. */
  async updateSubtitleUrl(url: string | null): Promise<void> {
    if (!this.video || !url) {
      return;
    }

    const resolved = mediaResolver.resolveSubtitleUrl(url);
    if (!resolved) {
      return;
    }

    if (this.nativeSubtitleMode && this.engine instanceof NativeHlsEngine) {
      this.engine.attachSubtitle(resolved);
      return;
    }

    this.sync.stopSubtitleLoop();
    this.sync.setManagedSubtitleUrl(resolved);
    this.managedSubtitleEnabled = true;
    this.engine?.disableEmbeddedSubtitles();

    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      await this.sync.loadExternalSubtitles(
        resolved,
        this.abortController.signal,
      );
      this.sync.startSubtitleLoop(this.callbacks.onSubtitleLines);
    } catch {
      // Subtitle load failure is non-fatal.
    }
  }

  /** Hot-swap dubbed audio without reloading HLS. */
  updateDubbedAudio(url: string | null): void {
    if (!this.video) {
      return;
    }

    if (url && isProgressiveAudioUrl(url)) {
      this.activateExternalDub(url);
      if (!this.video.paused) {
        void this.play();
      }
    } else {
      this.deactivateExternalDub();
    }

    this.emitSnapshot();
  }

  setVolume(volume: number): void {
    if (!this.video) {
      return;
    }

    this.outputVolume = volume;
    this.outputMuted = volume === 0;

    if (this.externalDubActive && this.sync.audio.isAttached()) {
      this.video.muted = true;
      this.sync.audio.setVolume(volume, this.outputMuted);
    } else {
      this.video.volume = volume;
      this.video.muted = this.outputMuted;
      this.sync.audio.setVolume(volume, this.outputMuted);
    }

    this.emitSnapshot();
  }

  setMuted(muted: boolean): void {
    if (!this.video) {
      return;
    }

    this.outputMuted = muted;

    if (this.externalDubActive && this.sync.audio.isAttached()) {
      this.video.muted = true;
      this.sync.audio.setVolume(this.outputVolume, muted);
    } else {
      this.video.muted = muted;
      this.sync.audio.setVolume(this.outputVolume, muted);
    }

    this.emitSnapshot();
  }

  setPlaybackRate(rate: number): void {
    if (!this.video) {
      return;
    }

    this.video.playbackRate = rate;
    this.sync.audio.setPlaybackRate(rate);
    this.emitSnapshot();
  }

  setQuality(level: number): void {
    this.lastKnownQuality = level;
    this.engine?.setQuality(level);
    this.emitSnapshot();
  }

  setAudioTrack(index: number): void {
    this.engine?.setAudioTrack(index);
  }

  setSubtitleTrack(index: number): void {
    if (this.nativeSubtitleMode && this.engine instanceof NativeHlsEngine) {
      if (index < 0) {
        this.engine.disableSubtitles();
      } else {
        this.engine.setSubtitleTrack(index);
      }
      return;
    }

    if (this.managedSubtitleEnabled) {
      this.engine?.disableEmbeddedSubtitles();
      return;
    }

    this.engine?.setSubtitleTrack(index);
  }

  setSubtitleDelay(seconds: number): void {
    this.sync.setSubtitleDelay(seconds);
  }

  /** Trigger manual recovery. */
  async recover(): Promise<void> {
    await this.runRecovery("manual");
  }

  /** Destroy controller and release resources. */
  destroy(full = true): void {
    this.clearWatchdog();

    if (this.unbindVideoEvents) {
      this.unbindVideoEvents();
      this.unbindVideoEvents = null;
    }

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }

    this.abortController?.abort();
    this.abortController = null;

    if (this.seekDebounceTimer) {
      clearTimeout(this.seekDebounceTimer);
      this.seekDebounceTimer = null;
    }
    this.pendingSeekTime = null;

    this.engine?.destroy();
    this.engine = null;
    this.sync.destroy();

    if (this.video) {
      this.video.pause();
      this.video.removeAttribute("src");
      this.video.load();
    }

    if (full) {
      this.video = null;
      this.currentSource = null;
      this.fsm.reset();
      this.eventBus.clear();
    }

    this.recoveryAttempt = 0;
    this.recoveryPhase = "none";
    this.errorMessage = "";
    this.managedSubtitleEnabled = false;
    this.nativeSubtitleMode = false;
    this.externalDubActive = false;
  }

  getEngine(): PlaybackEngine {
    return this.getEngineOrThrow();
  }

  getFsmState(): PlayerFsmState {
    return this.fsm.getState();
  }

  private wireEngineEvents(): void {
    this.eventBus.on("manifestParsed", () => {
      this.clearWatchdog();
      this.transition("manifestReady");
      if (this.lastKnownQuality >= 0) {
        this.engine?.setQuality(this.lastKnownQuality);
      }
    });

    this.eventBus.on("levelSwitched", () => {
      this.emitSnapshot();
    });

    this.eventBus.on("abrDecision", (payload) => {
      const data = payload as {
        from: number;
        to: number;
        reason: string;
        estimateMbps: number;
      };

      if (data.reason === "upgrade") {
        this.telemetry.trackAbrUpgrade(data.from, data.to, data.estimateMbps);
      } else if (data.reason === "downgrade") {
        this.telemetry.trackAbrDowngrade(data.from, data.to, data.estimateMbps);
      } else if (data.reason === "emergency-downgrade") {
        this.telemetry.trackAbrEmergency(data.from, data.estimateMbps);
      }
    });

    this.eventBus.on("error", (payload) => {
      const { fatal, type, details } = payload as {
        fatal?: boolean;
        type?: string;
        details?: string;
      };

      if (!fatal) {
        return;
      }

      if (type === "networkError") {
        this.engine?.recoverNetwork();
        return;
      }

      if (type === "mediaError") {
        this.engine?.recoverMedia();
        return;
      }

      if (
        this.managedSubtitleEnabled &&
        typeof details === "string" &&
        details.includes("LEVEL_PARSING_ERROR")
      ) {
        this.engine?.disableEmbeddedSubtitles();
        return;
      }

      void this.runRecovery("retry");
    });
  }

  private bindVideoEvents(video: HTMLVideoElement): void {
    const onLoadedMetadata = () => {
      this.transition("canPlay");
      this.emitSnapshot();
    };

    const onCanPlay = () => {
      this.transition("canPlay");
      this.clearWatchdog();
      this.emitSnapshot();
    };

    const onPlay = () => {
      this.transition("play");
      void this.syncExternalAudioOnPlay();
      this.emitSnapshot();
    };

    const onPause = () => {
      this.transition("pause");
      void this.sync.audio.syncPlayState();
      this.emitSnapshot();
    };

    const onWaiting = () => {
      this.telemetry.markRebufferStart();
      this.transition("bufferStart");
      this.emitSnapshot();
    };

    const onPlaying = () => {
      this.transition("bufferEnd");
      this.recoveryPhase = "none";
      this.recoveryAttempt = 0;
      this.errorMessage = "";
      this.telemetry.markFirstFrame();
      this.telemetry.markRebufferEnd();
      this.emitSnapshot();
    };

    const onTimeUpdate = () => {
      if (video && !video.seeking) {
        this.lastKnownTime = video.currentTime;
      }

      this.callbacks.onPlaybackTick({
        currentTime: video.currentTime,
        isPlaying: !video.paused,
      });
      this.updateBufferHealth();
      this.emitFullSnapshotThrottled();
    };

    const onSeeking = () => {
      this.transition("seekStart");
    };

    const onSeeked = () => {
      this.transition("seekEnd");
      this.engine?.syncQualityAfterSeek();
      this.sync.audio.hardResync();
      this.emitSnapshot();
    };

    const onEnded = () => {
      this.telemetry.markEnded();
      this.transition("ended");
      this.emitSnapshot();
    };

    const onVolumeChange = () => this.emitSnapshot();

    const onError = () => {
      this.telemetry.trackError("decode", "video element error");
      void this.runRecovery("watchdog");
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ended", onEnded);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("error", onError);

    this.unbindVideoEvents = () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("error", onError);
    };
  }

  private bindVisibilityHandler(): void {
    this.visibilityHandler = () => {
      if (document.visibilityState === "visible" && this.video) {
        const rs = this.video.readyState;
        if (rs < HTMLMediaElement.HAVE_FUTURE_DATA && !this.video.paused) {
          this.callbacks.onRecoveryMessage("بازگردانی پخش...");
          void this.runRecovery("retry");
        } else if (this.video.paused === false && this.video.readyState >= 2) {
          void this.video.play().catch(() => undefined);
        }
      }
    };

    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  private startWatchdog(): void {
    if (this.recoveryAttempt >= this.config.maxRecoveryRetries) {
      return;
    }

    this.clearWatchdog();

    const timeoutMs = Math.min(
      this.config.watchdogTimeoutMs * 2 ** this.recoveryAttempt,
      30_000,
    );

    this.watchdogTimer = window.setTimeout(() => {
      if (!this.video) {
        return;
      }

      const state = this.fsm.getState();
      if (state === "recovering" || state === "error") {
        return;
      }

      if (this.video.readyState < HTMLMediaElement.HAVE_METADATA) {
        this.callbacks.onRecoveryMessage("بارگذاری طولانی — تلاش مجدد...");
        void this.runRecovery("watchdog");
      }
    }, timeoutMs);
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer !== null) {
      window.clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private async runRecovery(phase: RecoveryPhase): Promise<void> {
    if (!this.video || !this.currentSource) {
      return;
    }

    if (this.recoveryAttempt >= this.config.maxRecoveryRetries) {
      this.transition("recoverFail");
      this.setError("پخش با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
      this.recoveryPhase = "manual";
      this.emitSnapshot();
      return;
    }

    this.recoveryPhase = phase;
    this.recoveryAttempt += 1;
    this.transition("recover");

    const resumeTime = this.lastKnownTime;
    const quality = this.lastKnownQuality;
    const wasPlaying = !this.video.paused;

    this.callbacks.onRecoveryMessage(
      `بازیابی پخش (${this.recoveryAttempt}/${this.config.maxRecoveryRetries})...`,
    );

    this.engine?.destroy();
    this.engine = null;
    this.video.pause();

    await new Promise((resolve) => {
      window.setTimeout(resolve, backoffDelayMs(this.recoveryAttempt - 1));
    });

    if (!this.video || !this.currentSource) {
      return;
    }

    this.lastKnownQuality = quality;

    const policyResult = resolvePlaybackPolicy(
      detectDeviceCapabilities({ video: this.video }),
      mediaResolver.toPlaybackManifest(this.currentSource),
    );

    if (!policyResult.ok) {
      this.setError(policyResult.reason);
      return;
    }

    const engine = this.mountEngine(policyResult.policy.engineId);
    engine.attach(this.video, policyResult.policy.manifestUrl);

    this.video.currentTime = resumeTime;

    if (quality >= 0) {
      engine.setQuality(quality);
    }

    this.transition("recoverSuccess");
    this.startWatchdog();

    if (wasPlaying) {
      await this.play();
    }

    this.emitSnapshot();
  }

  private readBufferedEnd(): number {
    if (!this.video) {
      return 0;
    }

    try {
      const buffered = this.video.buffered;
      if (buffered.length === 0) {
        return 0;
      }

      return buffered.end(buffered.length - 1);
    } catch {
      return 0;
    }
  }

  private updateBufferHealth(): void {
    if (!this.video || !this.video.duration) {
      return;
    }

    try {
      const buffered = this.video.buffered;
      if (buffered.length === 0) {
        return;
      }

      const end = buffered.end(buffered.length - 1);
      const ahead = end - this.video.currentTime;
      this.engine?.updateBufferHealth(ahead);
    } catch {
      // SourceBuffer may be torn down during HLS recovery or destroy.
    }
  }

  private transition(event: Parameters<PlayerFsm["transition"]>[0]): void {
    const next = this.fsm.transition(event);
    if (next) {
      if (next === "paused" || next === "idle" || next === "ended" || next === "error") {
        this.sync.audio.suspend();
      } else if (next === "playing") {
        this.sync.audio.resume();
      }

      this.callbacks.onFsmTransition(next);
    }
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.telemetry.trackError("player", message);
    this.transition("error");
    this.emitSnapshot();
  }

  private emitFullSnapshotThrottled(): void {
    const now = performance.now();
    if (now - this.lastFullSnapshotAt < 1000) {
      return;
    }

    this.lastFullSnapshotAt = now;
    this.emitSnapshot();
  }

  private activateExternalDub(url: string): void {
    if (!isProgressiveAudioUrl(url)) {
      this.deactivateExternalDub();
      return;
    }

    this.externalDubActive = true;
    this.sync.setDubbedAudioUrl(url);
    this.sync.audio.setVolume(this.outputVolume, this.outputMuted);
    this.engine?.disableManifestAudioTracks();
  }

  private deactivateExternalDub(): void {
    this.externalDubActive = false;
    this.sync.clearDubbedAudio();

    if (this.video) {
      this.video.muted = this.outputMuted;
      this.video.volume = this.outputVolume;
    }
  }

  private async syncExternalAudioOnPlay(): Promise<void> {
    if (!this.externalDubActive || !this.video) {
      await this.sync.audio.syncPlayState();
      return;
    }

    const dubStarted = await this.sync.audio.syncPlayState();
    if (dubStarted) {
      this.video.muted = true;
      return;
    }

    this.deactivateExternalDub();
  }

  private emitSnapshot(): void {
    const video = this.video;
    const bufferedEnd = this.readBufferedEnd();
    const useDubOutput =
      this.externalDubActive && this.sync.audio.isAttached();

    this.lastFullSnapshotAt = performance.now();

    this.callbacks.onSnapshot({
      fsmState: this.fsm.getState(),
      currentTime: video?.currentTime ?? 0,
      duration: video?.duration ?? 0,
      bufferedEnd,
      isPlaying: video ? !video.paused : false,
      isMuted: useDubOutput
        ? this.sync.audio.getMuted()
        : (video?.muted ?? false),
      volume: useDubOutput
        ? this.sync.audio.getVolume()
        : (video?.volume ?? this.outputVolume),
      playbackRate: video?.playbackRate ?? 1,
      readyState: video?.readyState ?? 0,
      error: this.errorMessage,
      recoveryPhase: this.recoveryPhase,
      recoveryAttempt: this.recoveryAttempt,
      usingHlsJs: this.engine?.usesHlsJs() ?? false,
      engineId: this.engineId,
      platformFamily: this.platformFamily,
      autoQualityLabel: this.engine?.getAutoLevelLabel() ?? "",
    });
  }
}

export type { PlayerConfig };
