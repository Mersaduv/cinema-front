import type {
  EngineAudioTrack,
  EngineLevel,
  EngineSubtitleTrack,
  PlayerConfig,
} from "./player.types";
import type { PlayerEventBus } from "../core/PlayerEventBus";

/** Playback engine identifiers — maps to VOD adapter families. */
export type EngineId =
  | "hlsjs"
  | "native-hls"
  | "shaka"
  | "progressive"
  | "tizen-avplay"
  | "webos-pipeline"
  | "exo-bridge";

export type DrmScheme = "widevine" | "playready" | "fairplay";

export type DrmConfig = {
  scheme: DrmScheme;
  licenseUrl: string;
};

export type PlatformFamily =
  | "generic"
  | "tizen"
  | "webos"
  | "firetv"
  | "androidtv"
  | "roku"
  | "desktop"
  | "mobile";

export type ManifestFormat = "hls" | "dash" | "progressive";

export type PlaybackManifest = {
  hls: string;
  dash?: string | null;
  progressive?: string | null;
  drm?: DrmConfig | null;
};

export type PerformanceClass = "high" | "medium" | "low";

export type DeviceCapabilities = {
  family: PlatformFamily;
  hasMse: boolean;
  hasEme: boolean;
  hasNativeHls: boolean;
  preferNativeHls: boolean;
  preferWorker: boolean;
  isTv: boolean;
  isCoarsePointer: boolean;
  performanceClass: PerformanceClass;
  hasTizenAvPlay: boolean;
  hasWebOsPipeline: boolean;
  hasExoPlayerBridge: boolean;
  preferDash: boolean;
};

export type PlaybackPolicy = {
  engineId: EngineId;
  manifestUrl: string;
  manifestFormat: ManifestFormat;
};

export type EngineOptions = {
  config: PlayerConfig;
  eventBus: PlayerEventBus;
  enableWorker?: boolean;
  performanceClass?: PerformanceClass;
  drm?: DrmConfig | null;
  onLowBuffer?: () => void;
  onBufferRecovered?: () => void;
};

/** Common contract for all playback adapters. */
export interface PlaybackEngine {
  readonly id: EngineId;
  attach(video: HTMLVideoElement, src: string): void;
  destroy(): void;
  getLevels(): EngineLevel[];
  getAudioTracks(): EngineAudioTrack[];
  getSubtitleTracks(): EngineSubtitleTrack[];
  getCurrentLevel(): number;
  getAutoLevelLabel(): string;
  setQuality(levelIndex: number): void;
  getManualQuality(): number;
  syncQualityAfterSeek(): void;
  setAudioTrack(index: number): void;
  disableManifestAudioTracks(): void;
  setSubtitleTrack(index: number): void;
  disableEmbeddedSubtitles(): void;
  recoverNetwork(): void;
  recoverMedia(): void;
  updateBufferHealth(bufferedSeconds: number): void;
  getBandwidthEstimate(): number;
  usesHlsJs(): boolean;
  /** When true, play/pause/seek are delegated to the engine instead of `<video>`. */
  controlsPlayback?(): boolean;
  play?(): Promise<void>;
  pause?(): void;
  seekTo?(seconds: number): void;
  setPlaybackRate?(rate: number): void;
}

export type QoEEventName =
  | "playback.session_start"
  | "playback.startup"
  | "playback.rebuffer"
  | "playback.error"
  | "playback.ended"
  | "playback.engine_selected"
  | "playback.abr_upgrade"
  | "playback.abr_downgrade"
  | "playback.abr_emergency";

export type QoEEvent = {
  name: QoEEventName;
  timestamp: number;
  sessionId: string;
  engineId: EngineId;
  platformFamily: PlatformFamily;
  manifestFormat?: ManifestFormat;
  mediaId?: string;
  episodeId?: string;
  platform?: "WEB" | "MOBILE" | "TV";
  data?: Record<string, string | number | boolean | null>;
};
