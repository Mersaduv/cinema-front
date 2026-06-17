import type { EngineOptions, PlaybackEngine } from "../types/playback.types";
import type {
  EngineAudioTrack,
  EngineLevel,
  EngineSubtitleTrack,
} from "../types/player.types";
import { getTizenAvPlay, type TizenAvPlayApi } from "../services/platformNative";

/**
 * Samsung Tizen AVPlay adapter — native player for packaged Tizen web apps.
 */
export class TizenAvPlayEngine implements PlaybackEngine {
  readonly id = "tizen-avplay" as const;

  private avplay: TizenAvPlayApi | null = null;
  private video: HTMLVideoElement | null = null;
  private src = "";
  private tickTimer: number | null = null;
  private playing = false;
  private durationSeconds = 0;

  constructor(private readonly options: EngineOptions) {}

  attach(video: HTMLVideoElement, src: string): void {
    this.destroy();
    this.video = video;
    this.src = src;
    this.avplay = getTizenAvPlay();

    if (!this.avplay) {
      video.src = src;
      this.options.eventBus.emit("manifestParsed");
      return;
    }

    video.style.visibility = "hidden";

    const rect = video.getBoundingClientRect();
    this.avplay.setDisplayRect(
      Math.round(rect.left),
      Math.round(rect.top),
      Math.round(rect.width || window.innerWidth),
      Math.round(rect.height || window.innerHeight),
    );

    this.avplay.open(src);
    this.avplay.setListener({
      oncurrentplaytime: (currentMs: unknown) => {
        const seconds = Number(currentMs) / 1000;
        if (this.video && Number.isFinite(seconds)) {
          this.video.currentTime = seconds;
        }
      },
      onstreamcompleted: () => {
        this.playing = false;
      },
    });

    this.avplay.prepareAsync(
      () => {
        this.durationSeconds = (this.avplay?.getDuration() ?? 0) / 1000;
        if (this.video && this.durationSeconds > 0) {
          Object.defineProperty(this.video, "duration", {
            configurable: true,
            get: () => this.durationSeconds,
          });
        }
        this.options.eventBus.emit("manifestParsed");
        this.options.eventBus.emit("levelsUpdated");
      },
      (error) => {
        this.options.eventBus.emit("error", {
          fatal: true,
          type: "tizenAvPlay",
          details: String(error),
        });
      },
    );
  }

  destroy(): void {
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }

    try {
      this.avplay?.stop();
      this.avplay?.close();
    } catch {
      // AVPlay teardown is best-effort on Tizen.
    }

    if (this.video) {
      this.video.style.visibility = "";
    }

    this.avplay = null;
    this.video = null;
    this.src = "";
    this.playing = false;
  }

  controlsPlayback(): boolean {
    return this.avplay !== null;
  }

  async play(): Promise<void> {
    if (!this.avplay) {
      await this.video?.play();
      return;
    }

    this.avplay.play();
    this.playing = true;
    this.startTick();
  }

  pause(): void {
    if (!this.avplay) {
      this.video?.pause();
      return;
    }

    this.avplay.pause();
    this.playing = false;
  }

  seekTo(seconds: number): void {
    if (!this.avplay) {
      if (this.video) {
        this.video.currentTime = seconds;
      }
      return;
    }

    this.avplay.seekTo(Math.max(0, seconds) * 1000);
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
    if (this.tickTimer !== null || !this.avplay || !this.video) {
      return;
    }

    this.tickTimer = window.setInterval(() => {
      if (!this.avplay || !this.video) {
        return;
      }

      const seconds = this.avplay.getCurrentTime() / 1000;
      if (Number.isFinite(seconds)) {
        this.video.currentTime = seconds;
      }
    }, 250);
  }
}
