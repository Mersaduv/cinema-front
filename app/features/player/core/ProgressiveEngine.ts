import type { PlaybackEngine, EngineOptions } from "../types/playback.types";
import type {
  EngineAudioTrack,
  EngineLevel,
  EngineSubtitleTrack,
} from "../types/player.types";

/** Low-bitrate progressive MP4 fallback when streaming is unavailable. */
export class ProgressiveEngine implements PlaybackEngine {
  readonly id = "progressive" as const;

  private video: HTMLVideoElement | null = null;
  private onLoadedMetadata: (() => void) | null = null;

  constructor(private readonly options: EngineOptions) {}

  attach(video: HTMLVideoElement, src: string): void {
    this.destroy();
    this.video = video;
    video.preload = "auto";
    video.src = src;

    this.onLoadedMetadata = () => {
      this.options.eventBus.emit("manifestParsed");
    };

    video.addEventListener("loadedmetadata", this.onLoadedMetadata);
    // Kick the network immediately; setting src alone can delay on some browsers.
    video.load();
  }

  destroy(): void {
    if (this.video && this.onLoadedMetadata) {
      this.video.removeEventListener("loadedmetadata", this.onLoadedMetadata);
    }

    this.video = null;
    this.onLoadedMetadata = null;
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
    this.video?.load();
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
}
