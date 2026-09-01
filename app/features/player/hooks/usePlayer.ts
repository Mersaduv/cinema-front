"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { PlayerController } from "../core/PlayerController";
import type { SubtitleLayerHandle } from "../components/SubtitleLayer";
import {
  loadPlayerPreferences,
  savePlayerPreferences,
  usePlayerStore,
} from "../store/playerStore";
import {
  DEFAULT_PLAYER_CONFIG,
  type EngineAudioTrack,
  type MediaSource,
  type PlaybackAudioTrack,
  type PlaybackVariant,
  type PlayerPreferences,
  type PlayerShellProps,
  type SeriesPlaybackContext,
  type SubtitleBackground,
  type SubtitleFontColor,
  type SubtitleFontSize,
} from "../types/player.types";
import {
  getQualityDetail,
  getQualityLabel,
  normalizeAudioOptionLabel,
  normalizeSubtitleOptionLabel,
} from "../utils/labels";
import { isProgressiveAudioUrl, resolveMediaPlaybackKey } from "../utils/format";
import { mediaResolver } from "../core/MediaResolver";
import { detectDeviceCapabilities } from "../services/capability";
import { shouldShowTvPlayGate } from "../utils/tv-autoplay-result";

type UsePlayerOptions = Pick<
  PlayerShellProps,
  "media" | "seriesContext" | "onEpisodeSelect" | "onEnded"
> & {
  /** Seek target applied once before the first autoplay — never mid-playback. */
  initialResumeTime?: number | null;
  /** When prompt, startup waits for user choice before seek/play. */
  startupMode?: "auto" | "prompt";
  pendingResumeTime?: number | null;
  subtitleLayerRef?: RefObject<SubtitleLayerHandle | null>;
};

function waitForSeek(video: HTMLVideoElement, targetTime: number): Promise<void> {
  if (Math.abs(video.currentTime - targetTime) < 0.5 && !video.seeking) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      video.removeEventListener("seeked", onSeeked);
      window.clearTimeout(timeoutId);
      resolve();
    };

    const onSeeked = () => finish();
    const timeoutId = window.setTimeout(finish, 2500);

    video.addEventListener("seeked", onSeeked);
  });
}

function hasSavedPreference<K extends keyof PlayerPreferences>(
  prefs: Partial<PlayerPreferences>,
  key: K,
): boolean {
  return Object.prototype.hasOwnProperty.call(prefs, key);
}

/** After silent play(): mark success or show TV gate only when autoplay is blocked. */
function applySilentAutoplayResult(
  started: boolean,
  video: HTMLVideoElement,
  autoplayAttemptedRef: { current: boolean },
): void {
  if (started) {
    autoplayAttemptedRef.current = true;
  }

  const isTv = detectDeviceCapabilities({ video }).isTv;
  usePlayerStore
    .getState()
    .setTvPlayBlocked(shouldShowTvPlayGate(started, isTv));
}

function isDubbedLanguage(language?: string): boolean {
  const normalized = (language ?? "").toLowerCase();
  return ["fa", "fas", "per", "persian", "farsi"].includes(normalized);
}

function findDubbedTrackIndex(
  engineTracks: EngineAudioTrack[],
  mediaTracks: PlaybackAudioTrack[] | undefined,
): number {
  if (mediaTracks?.length) {
    const dubbedTrack = mediaTracks.findIndex(
      (track) =>
        isDubbedLanguage(track.language) ||
        track.label.includes("دوبله") ||
        track.is_default === true,
    );

    if (dubbedTrack >= 0 && dubbedTrack < engineTracks.length) {
      return dubbedTrack;
    }
  }

  const dubbedEngineIdx = engineTracks.findIndex(
    (track) =>
      isDubbedLanguage(track.lang) ||
      /dub|دوبله/i.test(track.name),
  );

  return dubbedEngineIdx;
}

function resolveInitialAudioTrackIndex(
  engineTracks: EngineAudioTrack[],
  mediaTracks: PlaybackAudioTrack[] | undefined,
  preferredIndex: number | undefined,
  userSelected: boolean,
): number {
  const effectiveTracks: EngineAudioTrack[] =
    engineTracks.length > 0
      ? engineTracks
      : (mediaTracks ?? []).map((track, index) => ({
          id: index,
          name: track.label,
          lang: track.language,
        }));

  if (effectiveTracks.length === 0) {
    return 0;
  }

  const dubbedIdx = findDubbedTrackIndex(effectiveTracks, mediaTracks);

  if (
    userSelected &&
    preferredIndex !== undefined &&
    preferredIndex >= 0 &&
    preferredIndex < effectiveTracks.length
  ) {
    return preferredIndex;
  }

  if (dubbedIdx >= 0) {
    return dubbedIdx;
  }

  if (
    preferredIndex !== undefined &&
    preferredIndex >= 0 &&
    preferredIndex < effectiveTracks.length
  ) {
    return preferredIndex;
  }

  if (mediaTracks?.length) {
    const originalTrack = mediaTracks.findIndex(
      (track) => track.is_default || track.language === "eng",
    );

    if (originalTrack >= 0 && originalTrack < effectiveTracks.length) {
      return originalTrack;
    }
  }

  const originalEngineIdx = effectiveTracks.findIndex(
    (track) =>
      track.lang === "eng" ||
      track.lang === "en" ||
      /original/i.test(track.name),
  );

  return originalEngineIdx >= 0 ? originalEngineIdx : 0;
}

function resolveInitialSubtitleIndex(
  options: Array<{ value: number; label: string }>,
  preferredIndex: number | undefined,
): number {
  if (options.length === 0) {
    return -1;
  }

  if (
    preferredIndex !== undefined &&
    options.some((option) => option.value === preferredIndex)
  ) {
    return preferredIndex;
  }

  const firstEnabled = options.find((option) => option.value >= 0);
  return firstEnabled?.value ?? -1;
}

function applyInitialSubtitleTrack(
  controller: PlayerController,
  options: Array<{ value: number; label: string }>,
  preferredIndex: number | undefined,
): void {
  const trackIndex = resolveInitialSubtitleIndex(options, preferredIndex);

  if (trackIndex < 0) {
    return;
  }

  controller.setSubtitleTrack(trackIndex);
  getActions().setSelectedSubtitle(trackIndex);
}

function resolvePlayerConfig(video: HTMLVideoElement) {
  const caps = detectDeviceCapabilities({ video });
  if (!caps.isTv) {
    return DEFAULT_PLAYER_CONFIG;
  }

  return {
    ...DEFAULT_PLAYER_CONFIG,
    watchdogTimeoutMs: 14_000,
    maxRecoveryRetries: 4,
  };
}

/** Stable store actions — never subscribe to the full store in this hook. */
function getActions() {
  return usePlayerStore.getState();
}

/**
 * Main player hook — wires PlayerController to Zustand store.
 */
export function usePlayer({
  media,
  seriesContext,
  onEpisodeSelect,
  onEnded,
  initialResumeTime = null,
  startupMode = "auto",
  pendingResumeTime = null,
  subtitleLayerRef,
}: UsePlayerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<PlayerController | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const onEndedRef = useRef(onEnded);
  const onEpisodeSelectRef = useRef(onEpisodeSelect);
  const seriesContextRef = useRef(seriesContext);
  const mediaRef = useRef(media);
  const autoplayAttemptedRef = useRef(false);
  const autoplayInFlightRef = useRef(false);
  const startupCompleteRef = useRef(false);
  const resumeSeekDoneRef = useRef(false);
  const initialResumeTimeRef = useRef(initialResumeTime);
  const startupModeRef = useRef(startupMode);
  const pendingResumeTimeRef = useRef(pendingResumeTime);
  const startupFallbackTimerRef = useRef<number | null>(null);
  const tracksReadyRef = useRef(false);
  const audioTrackInitializedRef = useRef(false);
  const subtitleTrackInitializedRef = useRef(false);
  const loadedSrcRef = useRef<string | null>(null);

  initialResumeTimeRef.current = initialResumeTime;
  startupModeRef.current = startupMode;
  pendingResumeTimeRef.current = pendingResumeTime;

  onEndedRef.current = onEnded;
  onEpisodeSelectRef.current = onEpisodeSelect;
  seriesContextRef.current = seriesContext;
  mediaRef.current = media;

  const syncTrackOptions = useCallback(
    (variants: PlaybackVariant[] = mediaRef.current.variants ?? []) => {
      const controller = controllerRef.current;
      if (!controller) {
        return;
      }

      const actions = getActions();
      const engine = controller.getEngine();
      const levels = engine.getLevels();
      const currentMedia = mediaRef.current;

      if (engine.id === "progressive") {
        actions.setQualityOptions([]);
        actions.setAutoQualityLabel("فایل واحد");
      } else {
        const qualityOptions = [
          { value: -1, label: "خودکار", detail: "Adaptive HLS" },
          ...levels.map((level) => ({
            value: level.index,
            label: getQualityLabel(level.height),
            detail: getQualityDetail(level.width, level.height, level.bitrate),
          })),
        ];

        if (qualityOptions.length === 1 && variants.length > 0) {
          qualityOptions.push(
            ...variants.map((variant, index) => ({
              value: index,
              label: variant.profile_key,
              detail: `${variant.resolution} • ${Math.round(variant.bandwidth / 1000)} kbps`,
            })),
          );
        }

        actions.setQualityOptions(qualityOptions);
        actions.setAutoQualityLabel(engine.getAutoLevelLabel());
      }

      const audioTracks = engine.getAudioTracks();
      if (audioTracks.length > 0) {
        actions.setAudioOptions(
          audioTracks.map((track, index) => ({
            value: index,
            label: normalizeAudioOptionLabel(
              currentMedia.audioTracks?.[index]?.label || track.name || track.lang,
              currentMedia.audioTracks?.[index]?.language || track.lang,
            ),
            language: track.lang,
          })),
        );
      } else if (
        currentMedia.audioTracks &&
        currentMedia.audioTracks.length > 0 &&
        (engine.id === "progressive" ||
          isProgressiveAudioUrl(currentMedia.dubbedAudioUrl))
      ) {
        actions.setAudioOptions(
          currentMedia.audioTracks.map((track, index) => ({
            value: index,
            label: normalizeAudioOptionLabel(track.label, track.language),
            language: track.language,
          })),
        );
      } else if (isProgressiveAudioUrl(currentMedia.dubbedAudioUrl)) {
        actions.setAudioOptions([
          { value: 0, label: "زبان اصلی", language: "und" },
          { value: 1, label: "دوبله فارسی", language: "fa" },
        ]);
      } else if (engine.id === "progressive") {
        actions.setAudioOptions([]);
      }

      const subtitleTracks = engine.getSubtitleTracks();
      if (currentMedia.subtitleUrl) {
        actions.setSubtitleOptions([
          { value: -1, label: "خاموش" },
          { value: 0, label: "فارسی" },
        ]);
      } else if (subtitleTracks.length > 0) {
        actions.setSubtitleOptions([
          { value: -1, label: "خاموش" },
          ...subtitleTracks.map((track, index) => ({
            value: index,
            label: normalizeSubtitleOptionLabel(track.name || track.lang, track.lang),
            language: track.lang,
          })),
        ]);
      }
    },
    [],
  );

  const revealControls = useCallback(() => {
    const actions = getActions();
    actions.setShowControls(true);
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
    }

    const caps = detectDeviceCapabilities({ video: videoRef.current });
    const hideDelay =
      caps.isCoarsePointer || caps.family === "mobile"
        ? DEFAULT_PLAYER_CONFIG.mobileControlsHideDelayMs
        : DEFAULT_PLAYER_CONFIG.controlsHideDelayMs;

    controlsTimerRef.current = window.setTimeout(() => {
      const state = usePlayerStore.getState();
      if (state.isPlaying && state.openMenu === null) {
        getActions().setShowControls(false);
      }
    }, hideDelay);
  }, []);

  const toggleControls = useCallback(() => {
    const state = usePlayerStore.getState();
    if (state.isPlaying && state.showControls) {
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
      getActions().setShowControls(false);
      getActions().setOpenMenu(null);
      return;
    }

    revealControls();
  }, [revealControls]);

  const attemptAutoplay = useCallback(async () => {
    const controller = controllerRef.current;
    const video = videoRef.current;
    if (
      !controller ||
      !video ||
      autoplayAttemptedRef.current ||
      autoplayInFlightRef.current
    ) {
      return;
    }

    // HAVE_METADATA is enough to call play(); browser buffers while starting.
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      return;
    }

    autoplayInFlightRef.current = true;
    try {
      const started = await controller.play({ silent: true });
      applySilentAutoplayResult(started, video, autoplayAttemptedRef);
    } finally {
      autoplayInFlightRef.current = false;
    }
  }, []);

  const runStartupPlayback = useCallback(async () => {
    if (startupCompleteRef.current) {
      return;
    }

    const controller = controllerRef.current;
    const video = videoRef.current;
    if (!controller || !video) {
      return;
    }

    // Start as soon as duration/dimensions are known — don't wait for a deep buffer.
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      return;
    }

    startupCompleteRef.current = true;

    if (startupFallbackTimerRef.current !== null) {
      window.clearTimeout(startupFallbackTimerRef.current);
      startupFallbackTimerRef.current = null;
    }

    const resumeAt = initialResumeTimeRef.current ?? pendingResumeTimeRef.current;
    if (
      resumeAt != null &&
      resumeAt >= 30 &&
      !resumeSeekDoneRef.current
    ) {
      resumeSeekDoneRef.current = true;
      controller.seekTo(resumeAt);
      await waitForSeek(video, resumeAt);
    }

    autoplayInFlightRef.current = true;
    try {
      const started = await controller.play({ silent: true });
      applySilentAutoplayResult(started, video, autoplayAttemptedRef);
    } finally {
      autoplayInFlightRef.current = false;
    }
  }, []);

  // If watchMedia/resume time arrives after first startup (soft-nav race), seek ASAP.
  useEffect(() => {
    const resumeAt = initialResumeTime;
    if (resumeAt == null || resumeAt < 30 || resumeSeekDoneRef.current) {
      return;
    }

    const video = videoRef.current;
    const controller = controllerRef.current;
    if (!video || !controller || video.readyState < HTMLMediaElement.HAVE_METADATA) {
      return;
    }

    let cancelled = false;

    void (async () => {
      resumeSeekDoneRef.current = true;
      controller.seekTo(resumeAt);
      await waitForSeek(video, resumeAt);
      if (cancelled) {
        return;
      }

      if (!video.paused) {
        return;
      }

      autoplayInFlightRef.current = true;
      try {
        const started = await controller.play({ silent: true });
        applySilentAutoplayResult(started, video, autoplayAttemptedRef);
      } finally {
        autoplayInFlightRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialResumeTime]);

  const confirmResume = useCallback(async () => {
    const controller = controllerRef.current;
    const video = videoRef.current;
    if (!controller || !video) {
      return;
    }

    const resumeAt = pendingResumeTimeRef.current ?? initialResumeTimeRef.current;
    if (resumeAt != null && resumeAt >= 30) {
      resumeSeekDoneRef.current = true;
      controller.seekTo(resumeAt);
      await waitForSeek(video, resumeAt);
    }

    const started = await controller.play({ silent: true });
    applySilentAutoplayResult(started, video, autoplayAttemptedRef);
  }, []);

  const confirmStartOver = useCallback(async () => {
    const controller = controllerRef.current;
    const video = videoRef.current;
    if (!controller || !video) {
      return;
    }

    resumeSeekDoneRef.current = true;
    const started = await controller.play({ silent: true });
    applySilentAutoplayResult(started, video, autoplayAttemptedRef);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const caps = detectDeviceCapabilities({ video });
    getActions().setCapabilities(caps);
    const prefs = loadPlayerPreferences();

    const controller = new PlayerController(resolvePlayerConfig(video), {
      onPlaybackTick: (tick) => {
        getActions().applyPlaybackTick(tick);
      },
      onSnapshot: (snapshot) => {
        const actions = getActions();
        actions.applySnapshot({
          fsmState: snapshot.fsmState,
          currentTime: snapshot.currentTime,
          duration: snapshot.duration,
          bufferedEnd: snapshot.bufferedEnd,
          isPlaying: snapshot.isPlaying,
          isMuted: snapshot.isMuted,
          volume: snapshot.volume,
          playbackRate: snapshot.playbackRate,
          readyState: snapshot.readyState,
          error: snapshot.error,
          recoveryPhase: snapshot.recoveryPhase,
          recoveryAttempt: snapshot.recoveryAttempt,
          usingHlsJs: snapshot.usingHlsJs,
          engineId: snapshot.engineId,
          platformFamily: snapshot.platformFamily,
          autoQualityLabel: snapshot.autoQualityLabel,
        });

        const ctx = seriesContextRef.current;
        const nextEpisodePrefetchUrl =
          ctx?.nextEpisode?.hlsUrl || ctx?.nextEpisode?.progressiveUrl || null;
        if (snapshot.duration > 0 && nextEpisodePrefetchUrl) {
          const remaining = snapshot.duration - snapshot.currentTime;
          if (
            remaining <= DEFAULT_PLAYER_CONFIG.prefetchThresholdSeconds &&
            !usePlayerStore.getState().prefetchedNext
          ) {
            actions.setPrefetchedNext(true);
            prefetchAbortRef.current?.abort();
            prefetchAbortRef.current = new AbortController();
            void mediaResolver.prefetchManifest(
              nextEpisodePrefetchUrl,
              prefetchAbortRef.current.signal,
            );
          }

          const progress = snapshot.currentTime / snapshot.duration;
          const shouldShowNext = progress > 0.8 && snapshot.isPlaying;
          if (usePlayerStore.getState().showNextEpisodePrompt !== shouldShowNext) {
            actions.setShowNextEpisodePrompt(shouldShowNext);
          }
        }

        const skip = mediaRef.current.skipRanges;
        if (skip) {
          const showIntro =
            skip.introStart !== undefined &&
            skip.introEnd !== undefined &&
            snapshot.currentTime >= skip.introStart &&
            snapshot.currentTime < skip.introEnd;
          const showRecap =
            skip.recapEnd !== undefined &&
            snapshot.currentTime >= 0 &&
            snapshot.currentTime < skip.recapEnd;

          const state = usePlayerStore.getState();
          if (
            state.showSkipIntro !== showIntro ||
            state.showSkipRecap !== showRecap
          ) {
            actions.setSkipFlags({ intro: showIntro, recap: showRecap });
          }
        }

      },
      onFsmTransition: (state) => {
        if (state === "ended") {
          onEndedRef.current?.();
          const ctx = seriesContextRef.current;
          if (ctx?.nextEpisode && (prefs.autoplayNext ?? true)) {
            let count = 10;
            getActions().setAutoplayCountdown(count);
            countdownTimerRef.current = window.setInterval(() => {
              count -= 1;
              if (count <= 0) {
                if (countdownTimerRef.current) {
                  window.clearInterval(countdownTimerRef.current);
                }
                const next = ctx.nextEpisode;
                if (next && onEpisodeSelectRef.current) {
                  onEpisodeSelectRef.current(next.seasonNumber, next.episodeNumber);
                }
                getActions().setAutoplayCountdown(null);
              } else {
                getActions().setAutoplayCountdown(count);
              }
            }, 1000);
          }
        }
      },
      onSubtitleLines: (lines) => {
        subtitleLayerRef?.current?.updateLines(lines);
        getActions().setActiveSubtitleLines(lines);
      },
      onRecoveryMessage: (message) => getActions().setRecoveryMessage(message),
    });

    controllerRef.current = controller;

    controller.eventBus.on("manifestParsed", () => {
      syncTrackOptions();

      if (!audioTrackInitializedRef.current) {
        const engine = controller.getEngine();
        const engineTracks = engine.getAudioTracks();
        const mediaTracks = mediaRef.current.audioTracks;
        const canInitExternalAudio =
          engineTracks.length === 0 &&
          (engine.id === "progressive" ||
            isProgressiveAudioUrl(mediaRef.current.dubbedAudioUrl)) &&
          ((mediaTracks && mediaTracks.length > 0) ||
            isProgressiveAudioUrl(mediaRef.current.dubbedAudioUrl));

        if (canInitExternalAudio) {
          audioTrackInitializedRef.current = true;
          const prefs = loadPlayerPreferences();
          const userSelected =
            hasSavedPreference(prefs, "audioTrackIndex") &&
            prefs.audioTrackUserSelected === true;
          const syntheticTracks: EngineAudioTrack[] =
            mediaTracks && mediaTracks.length > 0
              ? mediaTracks.map((track, index) => ({
                  id: index,
                  name: track.label,
                  lang: track.language,
                }))
              : [
                  { id: 0, name: "زبان اصلی", lang: "und" },
                  { id: 1, name: "دوبله فارسی", lang: "fa" },
                ];
          const trackIndex = resolveInitialAudioTrackIndex(
            syntheticTracks,
            mediaTracks,
            hasSavedPreference(prefs, "audioTrackIndex")
              ? prefs.audioTrackIndex
              : undefined,
            userSelected,
          );

          controller.setAudioTrack(trackIndex);
          getActions().setSelectedAudio(trackIndex, { persist: false });
        }
      }

      if (!subtitleTrackInitializedRef.current) {
        const prefs = loadPlayerPreferences();
        const options = usePlayerStore.getState().subtitleOptions;

        if (options.length > 0) {
          subtitleTrackInitializedRef.current = true;
          applyInitialSubtitleTrack(
            controller,
            options,
            hasSavedPreference(prefs, "subtitleTrackIndex")
              ? prefs.subtitleTrackIndex
              : undefined,
          );
        }
      }

      void runStartupPlayback();
    });
    controller.eventBus.on("levelsUpdated", () => syncTrackOptions());
    controller.eventBus.on("audioTracksUpdated", () => {
      syncTrackOptions();

      const engine = controller.getEngine();
      const tracks = engine.getAudioTracks();

      if (tracks.length === 0 || audioTrackInitializedRef.current) {
        return;
      }

      audioTrackInitializedRef.current = true;
      const prefs = loadPlayerPreferences();
      const userSelected =
        hasSavedPreference(prefs, "audioTrackIndex") &&
        prefs.audioTrackUserSelected === true;
      const trackIndex = resolveInitialAudioTrackIndex(
        tracks,
        mediaRef.current.audioTracks,
        hasSavedPreference(prefs, "audioTrackIndex")
          ? prefs.audioTrackIndex
          : undefined,
        userSelected,
      );

      controller.setAudioTrack(trackIndex);
      getActions().setSelectedAudio(trackIndex, { persist: false });
    });
    controller.eventBus.on("subtitleTracksUpdated", () => {
      syncTrackOptions();

      if (subtitleTrackInitializedRef.current) {
        return;
      }

      const prefs = loadPlayerPreferences();
      const options = usePlayerStore.getState().subtitleOptions;

      if (options.length === 0) {
        return;
      }

      subtitleTrackInitializedRef.current = true;
      applyInitialSubtitleTrack(
        controller,
        options,
        hasSavedPreference(prefs, "subtitleTrackIndex")
          ? prefs.subtitleTrackIndex
          : undefined,
      );
    });
    controller.eventBus.on("levelSwitched", () => {
      getActions().setAutoQualityLabel(controller.getEngine().getAutoLevelLabel());
    });

    controller.eventBus.on("abrDecision", (payload) => {
      const data = payload as {
        reason: "upgrade" | "downgrade" | "emergency-downgrade" | "hold";
        estimateMbps: number;
      };

      getActions().applySnapshot({
        currentBandwidthMbps: data.estimateMbps,
        lastABRReason:
          data.reason === "hold" ? null : data.reason,
      });
    });

    controller.eventBus.on("abrPhase", (payload) => {
      const data = payload as { phase: "cold-start" | "ramp-up" | "steady" };
      getActions().applySnapshot({ abrPhase: data.phase });
    });

    controller.eventBus.on("bandwidthEstimate", (payload) => {
      const data = payload as { estimateMbps: number };
      getActions().applySnapshot({ currentBandwidthMbps: data.estimateMbps });
    });

    return () => {
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
      prefetchAbortRef.current?.abort();
      controller.destroy();
      controllerRef.current = null;
      loadedSrcRef.current = null;
    };
  }, [subtitleLayerRef, syncTrackOptions]);

  useEffect(() => {
    const video = videoRef.current;
    const controller = controllerRef.current;
    const playbackKey = resolveMediaPlaybackKey(media);
    if (!video || !controller || !playbackKey) {
      return;
    }

    const isSourceChange =
      loadedSrcRef.current !== null && loadedSrcRef.current !== playbackKey;
    const isFirstLoad = loadedSrcRef.current === null;

    if (!isFirstLoad && !isSourceChange) {
      return;
    }

    autoplayAttemptedRef.current = false;
    startupCompleteRef.current = false;
    resumeSeekDoneRef.current = false;
    tracksReadyRef.current = false;
    audioTrackInitializedRef.current = false;
    subtitleTrackInitializedRef.current = false;
    getActions().resetForNewMedia();

    const prefs = loadPlayerPreferences();
    const isProgressiveOnly = Boolean(
      media.progressiveUrl?.trim() && !media.src?.trim(),
    );

    const scheduleStartupFallback = () => {
      if (startupFallbackTimerRef.current !== null) {
        return;
      }

      // Progressive MP4 should start almost immediately; HLS may need a bit longer.
      startupFallbackTimerRef.current = window.setTimeout(() => {
        void runStartupPlayback();
      }, isProgressiveOnly ? 1200 : 5000);
    };

    const onStartupReady = () => {
      void runStartupPlayback();
    };

    // loadedmetadata fires earlier than canplay — start play ASAP for MP4.
    video.addEventListener("loadedmetadata", onStartupReady, { once: true });
    video.addEventListener("loadeddata", onStartupReady, { once: true });
    video.addEventListener("canplay", onStartupReady, { once: true });
    scheduleStartupFallback();

    const loadTask = isSourceChange
      ? controller.reloadSource(mediaRef.current)
      : controller.load(video, mediaRef.current);

    loadedSrcRef.current = playbackKey;

    void loadTask.then(() => {
      tracksReadyRef.current = true;
      if (prefs.qualityLevel !== undefined && prefs.qualityLevel >= 0) {
        controller.setQuality(prefs.qualityLevel);
        getActions().setSelectedQuality(prefs.qualityLevel);
      }
      if (prefs.playbackRate && prefs.playbackRate !== 1) {
        controller.setPlaybackRate(prefs.playbackRate);
      }
      if (prefs.subtitleDelay) {
        controller.setSubtitleDelay(prefs.subtitleDelay);
        getActions().setSubtitleDelay(prefs.subtitleDelay);
      }
    });

    return () => {
      video.removeEventListener("loadedmetadata", onStartupReady);
      video.removeEventListener("loadeddata", onStartupReady);
      video.removeEventListener("canplay", onStartupReady);
      if (startupFallbackTimerRef.current !== null) {
        window.clearTimeout(startupFallbackTimerRef.current);
        startupFallbackTimerRef.current = null;
      }
    };
  }, [media.src, media.progressiveUrl, media.dashUrl, runStartupPlayback]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!tracksReadyRef.current || !controller || !media.subtitleUrl) {
      return;
    }

    void controller.updateSubtitleUrl(media.subtitleUrl);
  }, [media.subtitleUrl]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!tracksReadyRef.current || !controller) {
      return;
    }

    controller.updateDubbedAudio(media.dubbedAudioUrl ?? null);
  }, [media.dubbedAudioUrl]);

  const pause = useCallback(() => {
    revealControls();
    controllerRef.current?.pause();
  }, [revealControls]);

  const togglePlay = useCallback(async () => {
    revealControls();
    await controllerRef.current?.togglePlay();
  }, [revealControls]);

  const seekBy = useCallback(
    (seconds: number) => {
      const state = usePlayerStore.getState();
      const duration = state.duration;
      const newTime = Math.max(
        0,
        Math.min(duration, state.currentTime + seconds),
      );
      usePlayerStore.getState().applySnapshot({ currentTime: newTime });
      controllerRef.current?.seekTo(newTime);
      revealControls();
    },
    [revealControls],
  );

  const seekTo = useCallback(
    (time: number) => {
      const state = usePlayerStore.getState();
      const duration = state.duration;
      const boundedTime =
        duration > 0 ? Math.max(0, Math.min(duration, time)) : Math.max(0, time);
      usePlayerStore.getState().applySnapshot({ currentTime: boundedTime });
      controllerRef.current?.seekTo(boundedTime);
      revealControls();
    },
    [revealControls],
  );

  const playMedia = useCallback(async () => {
    autoplayAttemptedRef.current = false;
    await attemptAutoplay();
  }, [attemptAutoplay]);

  const setVolume = useCallback((volume: number) => {
    controllerRef.current?.setVolume(volume);
  }, []);

  const toggleMute = useCallback(() => {
    const { isMuted, volume } = usePlayerStore.getState();
    controllerRef.current?.setMuted(!isMuted);
    if (!isMuted && volume === 0) {
      controllerRef.current?.setVolume(0.5);
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    controllerRef.current?.setPlaybackRate(rate);
    savePlayerPreferences({ playbackRate: rate });
  }, []);

  const selectQuality = useCallback((level: number) => {
    controllerRef.current?.setQuality(level);
    const actions = getActions();
    actions.setSelectedQuality(level);
    actions.setOpenMenu(null);
  }, []);

  const selectAudio = useCallback((index: number) => {
    controllerRef.current?.setAudioTrack(index);
    const actions = getActions();
    actions.setSelectedAudio(index);
    actions.setOpenMenu(null);
  }, []);

  const selectSubtitle = useCallback((index: number) => {
    controllerRef.current?.setSubtitleTrack(index);
    const actions = getActions();
    actions.setSelectedSubtitle(index);
    actions.setOpenMenu(null);
  }, []);

  const setSubtitleDelay = useCallback((delay: number) => {
    controllerRef.current?.setSubtitleDelay(delay);
    getActions().setSubtitleDelay(delay);
  }, []);

  const setSubtitleStyle = useCallback(
    (style: {
      fontSize?: SubtitleFontSize;
      fontColor?: SubtitleFontColor;
      background?: SubtitleBackground;
    }) => {
      getActions().setSubtitleStyle(style);
    },
    [],
  );

  const recover = useCallback(async () => {
    await controllerRef.current?.recover();
  }, []);

  const cancelAutoplay = useCallback(() => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    getActions().setAutoplayCountdown(null);
  }, []);

  const skipIntro = useCallback(() => {
    const end = mediaRef.current.skipRanges?.introEnd;
    if (end !== undefined) {
      seekTo(end);
    }
  }, [seekTo]);

  const skipRecap = useCallback(() => {
    const end = mediaRef.current.skipRanges?.recapEnd;
    if (end !== undefined) {
      seekTo(end);
    }
  }, [seekTo]);

  return {
    videoRef,
    pause,
    togglePlay,
    seekBy,
    seekTo,
    playMedia,
    setVolume,
    toggleMute,
    setPlaybackRate,
    selectQuality,
    selectAudio,
    selectSubtitle,
    setSubtitleDelay,
    setSubtitleStyle,
    recover,
    revealControls,
    toggleControls,
    cancelAutoplay,
    skipIntro,
    skipRecap,
    confirmResume,
    confirmStartOver,
  };
}

export type { SeriesPlaybackContext, MediaSource };
