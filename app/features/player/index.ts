export { default, PlayerShell } from "./components/PlayerShell";
export type { PlayerShellProps, MediaSource, SeriesPlaybackContext } from "./types/player.types";
export type { PlaybackEngine, EngineId, PlatformFamily } from "./types/playback.types";
export { detectDeviceCapabilities, detectWatchPlatform, getEngineLabel, probeMediaSource } from "./services/capability";
export { fetchPlaybackSession, clearPlaybackSessionCache } from "./services/StreamAccessManager";
export type { DrmConfig, DrmScheme } from "./types/playback.types";
