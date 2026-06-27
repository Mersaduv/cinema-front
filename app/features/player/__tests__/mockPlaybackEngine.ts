import { vi } from "vitest";
import type { PlaybackEngine } from "../types/playback.types";

export function createMockPlaybackEngine(): PlaybackEngine {
  return {
    id: "hlsjs",
    attach: vi.fn(),
    destroy: vi.fn(),
    getLevels: () => [],
    getAudioTracks: () => [],
    getSubtitleTracks: () => [],
    getCurrentLevel: () => -1,
    getAutoLevelLabel: () => "",
    setQuality: vi.fn(),
    getManualQuality: () => -1,
    syncQualityAfterSeek: vi.fn(),
    setAudioTrack: vi.fn(),
    disableManifestAudioTracks: vi.fn(),
    setSubtitleTrack: vi.fn(),
    disableEmbeddedSubtitles: vi.fn(),
    recoverNetwork: vi.fn(),
    recoverMedia: vi.fn(),
    updateBufferHealth: vi.fn(),
    getBandwidthEstimate: () => 0,
    usesHlsJs: () => true,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
  };
}
