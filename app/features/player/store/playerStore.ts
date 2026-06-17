import { create } from "zustand";
import type {
  AudioOption,
  MenuKey,
  PlayerFsmState,
  PlayerPreferences,
  QualityOption,
  RecoveryPhase,
  SubtitleBackground,
  SubtitleFontColor,
  SubtitleFontSize,
  SubtitleOption,
  SubtitlePanel,
} from "../types/player.types";
import type { DeviceCapabilities, EngineId, PlatformFamily } from "../types/playback.types";
import { PREFERENCE_STORAGE_KEY } from "../types/player.types";

export type PlayerStoreState = {
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
  recoveryMessage: string;
  recoveryAttempt: number;
  usingHlsJs: boolean;
  engineId: EngineId;
  platformFamily: PlatformFamily;
  capabilities: DeviceCapabilities | null;
  isTv: boolean;
  tvPlayBlocked: boolean;
  showControls: boolean;
  isFullscreen: boolean;
  openMenu: MenuKey;
  qualityOptions: QualityOption[];
  selectedQuality: number;
  autoQualityLabel: string;
  audioOptions: AudioOption[];
  selectedAudio: number;
  subtitleOptions: SubtitleOption[];
  selectedSubtitle: number;
  subtitlePanel: SubtitlePanel;
  subtitleFontSize: SubtitleFontSize;
  subtitleFontColor: SubtitleFontColor;
  subtitleBackground: SubtitleBackground;
  subtitleDelay: number;
  activeSubtitleLines: string[];
  showEpisodeDrawer: boolean;
  showNextEpisodePrompt: boolean;
  autoplayCountdown: number | null;
  showSkipIntro: boolean;
  showSkipRecap: boolean;
  prefetchedNext: boolean;
  currentBandwidthMbps: number | null;
  abrPhase: "cold-start" | "ramp-up" | "steady";
  lastABRReason: "upgrade" | "downgrade" | "emergency-downgrade" | null;
};

export type PlayerStoreActions = {
  applySnapshot: (partial: Partial<PlayerStoreState>) => void;
  applyPlaybackTick: (tick: { currentTime: number; isPlaying: boolean }) => void;
  setShowControls: (show: boolean) => void;
  setOpenMenu: (menu: MenuKey) => void;
  setSubtitlePanel: (panel: SubtitlePanel) => void;
  setQualityOptions: (options: QualityOption[]) => void;
  setSelectedQuality: (value: number) => void;
  setAutoQualityLabel: (label: string) => void;
  setAudioOptions: (options: AudioOption[]) => void;
  setSelectedAudio: (value: number, options?: { persist?: boolean }) => void;
  setSubtitleOptions: (options: SubtitleOption[]) => void;
  setSelectedSubtitle: (value: number) => void;
  setSubtitleStyle: (style: {
    fontSize?: SubtitleFontSize;
    fontColor?: SubtitleFontColor;
    background?: SubtitleBackground;
  }) => void;
  setSubtitleDelay: (delay: number) => void;
  setActiveSubtitleLines: (lines: string[]) => void;
  setIsFullscreen: (value: boolean) => void;
  setShowEpisodeDrawer: (value: boolean) => void;
  setShowNextEpisodePrompt: (value: boolean) => void;
  setAutoplayCountdown: (value: number | null) => void;
  setSkipFlags: (flags: { intro?: boolean; recap?: boolean }) => void;
  setRecoveryMessage: (message: string) => void;
  setPrefetchedNext: (value: boolean) => void;
  setCapabilities: (capabilities: DeviceCapabilities) => void;
  setTvPlayBlocked: (value: boolean) => void;
  resetForNewMedia: () => void;
};

const initialState: PlayerStoreState = {
  fsmState: "idle",
  currentTime: 0,
  duration: 0,
  bufferedEnd: 0,
  isPlaying: false,
  isMuted: false,
  volume: 1,
  playbackRate: 1,
  readyState: 0,
  error: "",
  recoveryPhase: "none",
  recoveryMessage: "",
  recoveryAttempt: 0,
  usingHlsJs: false,
  engineId: "hlsjs",
  platformFamily: "desktop",
  capabilities: null,
  isTv: false,
  tvPlayBlocked: false,
  showControls: true,
  isFullscreen: false,
  openMenu: null,
  qualityOptions: [],
  selectedQuality: -1,
  autoQualityLabel: "",
  audioOptions: [],
  selectedAudio: 0,
  subtitleOptions: [],
  selectedSubtitle: -1,
  subtitlePanel: "tracks",
  subtitleFontSize: "medium",
  subtitleFontColor: "white",
  subtitleBackground: "transparent",
  subtitleDelay: 0,
  activeSubtitleLines: [],
  showEpisodeDrawer: false,
  showNextEpisodePrompt: false,
  autoplayCountdown: null,
  showSkipIntro: false,
  showSkipRecap: false,
  prefetchedNext: false,
  currentBandwidthMbps: null,
  abrPhase: "cold-start",
  lastABRReason: null,
};

/** Load persisted player preferences from localStorage. */
export function loadPlayerPreferences(): Partial<PlayerPreferences> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Partial<PlayerPreferences>;
  } catch {
    return {};
  }
}

/** Persist player preferences to localStorage. */
export function savePlayerPreferences(prefs: Partial<PlayerPreferences>): void {
  if (typeof window === "undefined") {
    return;
  }

  const existing = loadPlayerPreferences();
  localStorage.setItem(
    PREFERENCE_STORAGE_KEY,
    JSON.stringify({ ...existing, ...prefs }),
  );
}

export const usePlayerStore = create<PlayerStoreState & PlayerStoreActions>(
  (set) => ({
    ...initialState,

    applySnapshot: (partial) => set((state) => ({ ...state, ...partial })),

    applyPlaybackTick: ({ currentTime, isPlaying }) =>
      set((state) => {
        if (state.currentTime === currentTime && state.isPlaying === isPlaying) {
          return state;
        }

        return { ...state, currentTime, isPlaying };
      }),

    setShowControls: (showControls) => set({ showControls }),

    setOpenMenu: (openMenu) => set({ openMenu }),

    setSubtitlePanel: (subtitlePanel) => set({ subtitlePanel }),

    setQualityOptions: (qualityOptions) => set({ qualityOptions }),

    setSelectedQuality: (selectedQuality) => {
      set({ selectedQuality });
      savePlayerPreferences({ qualityLevel: selectedQuality });
    },

    setAutoQualityLabel: (autoQualityLabel) => set({ autoQualityLabel }),

    setAudioOptions: (audioOptions) => set({ audioOptions }),

    setSelectedAudio: (selectedAudio, options) => {
      set({ selectedAudio });
      if (options?.persist === false) {
        return;
      }

      savePlayerPreferences({
        audioTrackIndex: selectedAudio,
        audioTrackUserSelected: true,
      });
    },

    setSubtitleOptions: (subtitleOptions) => set({ subtitleOptions }),

    setSelectedSubtitle: (selectedSubtitle) => {
      set({ selectedSubtitle });
      savePlayerPreferences({ subtitleTrackIndex: selectedSubtitle });
    },

    setSubtitleStyle: ({ fontSize, fontColor, background }) => {
      set((state) => {
        const next = {
          subtitleFontSize: fontSize ?? state.subtitleFontSize,
          subtitleFontColor: fontColor ?? state.subtitleFontColor,
          subtitleBackground: background ?? state.subtitleBackground,
        };

        savePlayerPreferences({
          subtitleFontSize: next.subtitleFontSize,
          subtitleFontColor: next.subtitleFontColor,
          subtitleBackground: next.subtitleBackground,
        });

        return { ...state, ...next };
      });
    },

    setSubtitleDelay: (subtitleDelay) => {
      set({ subtitleDelay });
      savePlayerPreferences({ subtitleDelay });
    },

    setActiveSubtitleLines: (activeSubtitleLines) => set({ activeSubtitleLines }),

    setIsFullscreen: (isFullscreen) => set({ isFullscreen }),

    setShowEpisodeDrawer: (showEpisodeDrawer) => set({ showEpisodeDrawer }),

    setShowNextEpisodePrompt: (showNextEpisodePrompt) =>
      set({ showNextEpisodePrompt }),

    setAutoplayCountdown: (autoplayCountdown) => set({ autoplayCountdown }),

    setSkipFlags: ({ intro, recap }) =>
      set((state) => ({
        showSkipIntro: intro !== undefined ? intro : state.showSkipIntro,
        showSkipRecap: recap !== undefined ? recap : state.showSkipRecap,
      })),

    setRecoveryMessage: (recoveryMessage) => set({ recoveryMessage }),

    setPrefetchedNext: (prefetchedNext) => set({ prefetchedNext }),

    setCapabilities: (capabilities) =>
      set({
        capabilities,
        isTv: capabilities.isTv,
        platformFamily: capabilities.family,
      }),

    setTvPlayBlocked: (tvPlayBlocked) => set({ tvPlayBlocked }),

    resetForNewMedia: () => {
      const prefs = loadPlayerPreferences();

      set({
        ...initialState,
        volume: 1,
        playbackRate: prefs.playbackRate ?? 1,
        selectedQuality: prefs.qualityLevel ?? -1,
        selectedAudio: 0,
        selectedSubtitle: -1,
        subtitleDelay: prefs.subtitleDelay ?? 0,
        subtitleFontSize: prefs.subtitleFontSize ?? "medium",
        subtitleFontColor: prefs.subtitleFontColor ?? "white",
        subtitleBackground: prefs.subtitleBackground ?? "transparent",
      });
    },
  }),
);

/** Selectors for fine-grained subscriptions. */
export const selectIsLoading = (s: PlayerStoreState) =>
  s.fsmState === "loading" ||
  s.fsmState === "buffering" ||
  s.fsmState === "recovering";

export const selectBufferedPercent = (s: PlayerStoreState) =>
  s.duration > 0 ? Math.min(100, (s.bufferedEnd / s.duration) * 100) : 0;

export const selectProgressPercent = (s: PlayerStoreState) =>
  s.duration > 0 ? Math.min(100, (s.currentTime / s.duration) * 100) : 0;
