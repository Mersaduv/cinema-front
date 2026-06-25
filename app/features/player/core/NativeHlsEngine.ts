import { buildPlaybackSubtitleUrl } from "../utils/format";
import type { PlaybackEngine, EngineOptions, EngineId } from "../types/playback.types";
import type {
  EngineAudioTrack,
  EngineLevel,
  EngineSubtitleTrack,
} from "../types/player.types";
import { detectDeviceCapabilities } from "../services/capability";

type NativeAudioTrackList = {
  length: number;
  [index: number]: { enabled: boolean; label?: string; language?: string };
};

type HtmlVideoWithAudioTracks = HTMLVideoElement & {
  audioTracks?: NativeAudioTrackList;
};

/**
 * Native HLS adapter — preferred on TV browsers without stable MSE.
 */
export class NativeHlsEngine implements PlaybackEngine {
  readonly id: EngineId = "native-hls";

  private video: HTMLVideoElement | null = null;
  private trackEl: HTMLTrackElement | null = null;
  private onLoadedMetadata: (() => void) | null = null;
  private onCanPlay: (() => void) | null = null;

  constructor(private readonly options: EngineOptions) {}

  attach(video: HTMLVideoElement, src: string): void {
    this.destroy();
    this.video = video;

    const caps = detectDeviceCapabilities({ video });
    if (caps.family === "tizen" || caps.family === "webos") {
      video.setAttribute("type", "application/vnd.apple.mpegurl");
    }

    video.src = src;
    video.load();

    this.onLoadedMetadata = () => {
      this.options.eventBus.emit("manifestParsed");
      this.options.eventBus.emit("levelsUpdated");
      this.detectNativeTextTracks(video);
    };

    this.onCanPlay = () => {
      const tracks = this.getAudioTracks();
      if (tracks.length > 0) {
        this.options.eventBus.emit("audioTracksUpdated");
      }
    };

    video.addEventListener("loadedmetadata", this.onLoadedMetadata);
    video.addEventListener("canplay", this.onCanPlay, { once: true });
  }

  attachSubtitle(
    subtitleUrl: string,
    label = "زیرنویس",
    language = "fa",
  ): void {
    if (!this.video) {
      return;
    }

    this.removeSubtitle();

    const proxied = buildPlaybackSubtitleUrl(subtitleUrl) ?? subtitleUrl;
    const track = document.createElement("track");
    track.kind = "subtitles";
    track.label = label;
    track.srclang = language;
    track.src = proxied;
    track.default = true;

    track.addEventListener("load", () => {
      this.activateSubtitleTrack(0);
    });

    this.video.appendChild(track);
    this.trackEl = track;
  }

  removeSubtitle(): void {
    this.trackEl?.remove();
    this.trackEl = null;
  }

  destroy(): void {
    this.removeSubtitle();

    if (this.video) {
      if (this.onLoadedMetadata) {
        this.video.removeEventListener("loadedmetadata", this.onLoadedMetadata);
      }

      if (this.onCanPlay) {
        this.video.removeEventListener("canplay", this.onCanPlay);
      }

      this.video.src = "";
      this.video.load();
    }

    this.video = null;
    this.onLoadedMetadata = null;
    this.onCanPlay = null;
  }

  getLevels(): EngineLevel[] {
    return [];
  }

  getAudioTracks(): EngineAudioTrack[] {
    if (!this.video) {
      return [];
    }

    const tracks = (this.video as HtmlVideoWithAudioTracks).audioTracks;
    if (!tracks || tracks.length === 0) {
      return [];
    }

    return Array.from({ length: tracks.length }, (_, index) => ({
      id: index,
      name: tracks[index]?.label || `Audio ${index + 1}`,
      lang: tracks[index]?.language || "",
    }));
  }

  getSubtitleTracks(): EngineSubtitleTrack[] {
    if (!this.video) {
      return [];
    }

    const tracks = this.video.textTracks;
    if (!tracks || tracks.length === 0) {
      return [];
    }

    return Array.from({ length: tracks.length }, (_, index) => ({
      id: index,
      name: tracks[index]?.label || `Subtitle ${index + 1}`,
      lang: tracks[index]?.language || "",
    }));
  }

  getCurrentLevel(): number {
    return -1;
  }

  getAutoLevelLabel(): string {
    return "";
  }

  setQuality(): void {
    // Native HLS ABR is handled by the platform decoder.
  }

  getManualQuality(): number {
    return -1;
  }

  syncQualityAfterSeek(): void {}

  setAudioTrack(index: number): void {
    if (!this.video) {
      return;
    }

    const tracks = (this.video as HtmlVideoWithAudioTracks).audioTracks;
    if (!tracks || tracks.length === 0) {
      this.options.eventBus.emit("error", {
        fatal: false,
        type: "audioTrackUnsupported",
        details: String(index),
      });
      return;
    }

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].enabled = i === index;
    }
  }

  disableManifestAudioTracks(): void {
    if (!this.video) {
      return;
    }

    const tracks = (this.video as HtmlVideoWithAudioTracks).audioTracks;
    if (!tracks) {
      return;
    }

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].enabled = false;
    }
  }

  setSubtitleTrack(index: number): void {
    this.activateSubtitleTrack(index);
  }

  disableEmbeddedSubtitles(): void {
    this.disableSubtitles();
  }

  disableSubtitles(): void {
    if (!this.video) {
      return;
    }

    const tracks = this.video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = "hidden";
    }
  }

  recoverNetwork(): void {
    if (!this.video) {
      return;
    }

    const src = this.video.src;
    if (!src) {
      return;
    }

    const time = this.video.currentTime;
    this.video.src = src;
    this.video.load();
    this.video.currentTime = time;
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

  usesNativeSubtitleTrack(): boolean {
    return true;
  }

  private activateSubtitleTrack(index: number): void {
    if (!this.video) {
      return;
    }

    const tracks = this.video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = i === index ? "showing" : "hidden";
    }
  }

  private detectNativeTextTracks(video: HTMLVideoElement): void {
    const tracks = video.textTracks;
    if (!tracks || tracks.length === 0) {
      return;
    }

    this.options.eventBus.emit("subtitleTracksUpdated");
  }
}
