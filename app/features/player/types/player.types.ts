/** Player finite-state machine states. */
import type { ResponsiveImageAsset } from "../../../lib/cinema-image";

export type PlayerFsmState =
  | "idle"
  | "loading"
  | "buffering"
  | "playing"
  | "paused"
  | "seeking"
  | "recovering"
  | "error"
  | "ended";

export type RecoveryPhase =
  | "none"
  | "watchdog"
  | "retry"
  | "manual";

export type MenuKey = "quality" | "audio" | "subtitle" | "speed" | "episodes" | null;

export type SubtitlePanel = "tracks" | "settings" | "fontSize" | "fontColor" | "background" | "delay";

export type SubtitleFontSize = "large" | "medium" | "small";
export type SubtitleFontColor = "black" | "white" | "yellow";
export type SubtitleBackground = "black" | "white" | "transparent";

export type QualityOption = {
  value: number;
  label: string;
  detail: string;
};

export type AudioOption = {
  value: number;
  label: string;
  language?: string;
};

export type SubtitleOption = {
  value: number;
  label: string;
  language?: string;
};

export type PlaybackVariant = {
  profile_key: string;
  resolution: string;
  bandwidth: number;
};

export type PlaybackAudioTrack = {
  key: string;
  label: string;
  language: string;
  is_default: boolean;
};

/** Time-range metadata for skip intro / recap buttons. */
export type SkipRange = {
  introStart?: number;
  introEnd?: number;
  recapEnd?: number;
};

export type EpisodeSummary = {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  hlsUrl?: string | null;
  progressiveUrl?: string | null;
  subtitleUrl?: string | null;
  dubbedAudioUrl?: string | null;
  durationSeconds?: number | null;
  stillUrl?: string | null;
  stillImage?: ResponsiveImageAsset | null;
  synopsis?: string | null;
};

export type SeasonSummary = {
  seasonNumber: number;
  name?: string | null;
  episodes: EpisodeSummary[];
};

export type SeriesPlaybackContext = {
  seriesSlug: string;
  seriesTitle: string;
  posterUrl?: string | null;
  seasons: SeasonSummary[];
  currentSeason: number;
  currentEpisode: number;
  nextEpisode?: EpisodeSummary | null;
  prevEpisode?: EpisodeSummary | null;
};

import type { DrmConfig } from "./playback.types";

export type MediaSource = {
  src: string;
  /** Optional DASH manifest for capability-first clients (Shaka path). */
  dashUrl?: string | null;
  /** Low-bitrate progressive fallback when HLS is unavailable on TV browsers. */
  progressiveUrl?: string | null;
  /** Multi-DRM license configuration for Shaka / native players. */
  drm?: DrmConfig | null;
  poster?: string | null;
  title?: string;
  subtitleUrl?: string | null;
  dubbedAudioUrl?: string | null;
  variants?: PlaybackVariant[];
  audioTracks?: PlaybackAudioTrack[];
  skipRanges?: SkipRange;
};

export type PlayerPreferences = {
  audioTrackIndex: number;
  audioTrackUserSelected?: boolean;
  subtitleTrackIndex: number;
  qualityLevel: number;
  playbackRate: number;
  subtitleDelay: number;
  subtitleFontSize: SubtitleFontSize;
  subtitleFontColor: SubtitleFontColor;
  subtitleBackground: SubtitleBackground;
  autoplayNext: boolean;
};

export type PlayerConfig = {
  watchdogTimeoutMs: number;
  maxRecoveryRetries: number;
  controlsHideDelayMs: number;
  mobileControlsHideDelayMs: number;
  prefetchThresholdSeconds: number;
  initialBufferTargetSeconds: number;
  steadyBufferTargetSeconds: number;
  lowBufferThresholdSeconds: number;
  abrSafetyFactor: number;
  abrUpgradeSafetyFactor: number;
  coldStartLevel: number;
  coldStartMaxLevel: number;
};

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  watchdogTimeoutMs: 8000,
  maxRecoveryRetries: 3,
  controlsHideDelayMs: 3000,
  /** Longer auto-hide on touch devices so controls stay tappable. */
  mobileControlsHideDelayMs: 6000,
  prefetchThresholdSeconds: 120,
  initialBufferTargetSeconds: 3,
  steadyBufferTargetSeconds: 30,
  lowBufferThresholdSeconds: 3,
  abrSafetyFactor: 0.85,
  abrUpgradeSafetyFactor: 0.7,
  coldStartLevel: 0,
  coldStartMaxLevel: 2,
};

export type AbrPhase = "cold-start" | "ramp-up" | "steady";

export type AbrDecisionReason =
  | "cold-start"
  | "upgrade"
  | "downgrade"
  | "emergency-downgrade"
  | "hold";

export type PlayerEngineEvents = {
  manifestParsed: void;
  levelsUpdated: void;
  levelSwitched: { level: number };
  audioTracksUpdated: void;
  audioTrackSwitched: { id: number };
  subtitleTracksUpdated: void;
  subtitleTrackSwitched: { id: number };
  error: { fatal: boolean; type: string; details: string };
  bandwidthEstimate: { estimateMbps: number };
  fragmentLoaded: { loadTime: number; bytes: number };
  abrDecision: {
    from: number;
    to: number;
    reason: AbrDecisionReason;
    estimateMbps: number;
  };
  abrPhase: { phase: AbrPhase };
};

export type EngineLevel = {
  index: number;
  height?: number;
  width?: number;
  bitrate?: number;
};

export type EngineAudioTrack = {
  id: number;
  name: string;
  lang: string;
};

export type EngineSubtitleTrack = {
  id: number;
  name: string;
  lang: string;
};

import type { WatchMediaInfo } from "../services/progress.types";

export type { WatchMediaInfo };

/** Props for the top-level player shell. */
export type PlayerShellProps = {
  media: MediaSource;
  watchMedia?: WatchMediaInfo | null;
  backHref?: string;
  immersive?: boolean;
  isSourceTransitioning?: boolean;
  seriesContext?: SeriesPlaybackContext | null;
  onEpisodeSelect?: (season: number, episode: number) => void;
  onEnded?: () => void;
};

export const PREFERENCE_STORAGE_KEY = "cinema.player.preferences.v1";
