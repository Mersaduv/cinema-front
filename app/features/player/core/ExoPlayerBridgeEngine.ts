import type { EngineOptions, PlaybackEngine } from "../types/playback.types";
import type {
  EngineAudioTrack,
  EngineLevel,
  EngineSubtitleTrack,
} from "../types/player.types";
import {
  getExoPlayerBridge,
  type CinemaNativePlayerBridge,
} from "../services/platformNative";

/**
 * Android TV / Fire TV native ExoPlayer bridge (injected by WebView shell).
 */
export class ExoPlayerBridgeEngine implements PlaybackEngine {
  readonly id = "exo-bridge" as const;

  private bridge: CinemaNativePlayerBridge | null = null;
  private video: HTMLVideoElement | null = null;
  private src = "";
  private format: "hls" | "dash" = "hls";
  private tickTimer: number | null = null;

  constructor(private readonly options: EngineOptions) {}

  attach(video: HTMLVideoElement, src: string): void {
    this.destroy();
    this.video = video;
    this.src = src;
    this.format = src.includes(".mpd") ? "dash" : "hls";
    this.bridge = getExoPlayerBridge();

    if (!this.bridge) {
      video.src = src;
      this.options.eventBus.emit("manifestParsed");
      return;
    }

    video.style.visibility = "hidden";

    void this.bridge
      .load(src, this.format)
      .then(() => {
        this.options.eventBus.emit("manifestParsed");
        this.options.eventBus.emit("levelsUpdated");
        this.startTick();
      })
      .catch((error: unknown) => {
        this.options.eventBus.emit("error", {
          fatal: true,
          type: "exoBridge",
          details: error instanceof Error ? error.message : String(error),
        });
      });
  }

  destroy(): void {
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }

    if (this.video) {
      this.video.style.visibility = "";
    }

    this.bridge = null;
    this.video = null;
    this.src = "";
  }

  controlsPlayback(): boolean {
    return this.bridge !== null;
  }

  async play(): Promise<void> {
    if (!this.bridge) {
      await this.video?.play();
      return;
    }

    await this.bridge.play();
  }

  pause(): void {
    if (!this.bridge) {
      this.video?.pause();
      return;
    }

    this.bridge.pause();
  }

  seekTo(seconds: number): void {
    if (!this.bridge) {
      if (this.video) {
        this.video.currentTime = seconds;
      }
      return;
    }

    this.bridge.seekTo(seconds);
  }

  setPlaybackRate(rate: number): void {
    if (this.video) {
      this.video.playbackRate = rate;
    }
  }

  getLevels(): EngineLevel[] {
    return [];
  }

  getAudioTracks(): EngineAudioTrack[] {
    return [];
  }

  getSubtitleTracks(): EngineSubtitleTrack[] {
    return [];
  }

  getCurrentLevel(): number {
    return -1;
  }

  getAutoLevelLabel(): string {
    return "";
  }

  setQuality(): void {}

  getManualQuality(): number {
    return -1;
  }

  syncQualityAfterSeek(): void {}

  setAudioTrack(): void {}

  disableManifestAudioTracks(): void {}

  setSubtitleTrack(): void {}

  disableEmbeddedSubtitles(): void {}

  recoverNetwork(): void {
    if (this.video && this.src) {
      this.attach(this.video, this.src);
    }
  }

  recoverMedia(): void {
    this.recoverNetwork();
  }

  updateBufferHealth(): void {}

  getBandwidthEstimate(): number {
    return 0;
  }

  usesHlsJs(): boolean {
    return false;
  }

  private startTick(): void {
    if (this.tickTimer !== null || !this.bridge || !this.video) {
      return;
    }

    this.tickTimer = window.setInterval(() => {
      if (!this.bridge || !this.video) {
        return;
      }

      const current = this.bridge.getCurrentTime();
      const duration = this.bridge.getDuration();
      if (Number.isFinite(current)) {
        this.video.currentTime = current;
      }
      if (Number.isFinite(duration) && duration > 0) {
        Object.defineProperty(this.video, "duration", {
          configurable: true,
          get: () => duration,
        });
      }
    }, 250);
  }
}
