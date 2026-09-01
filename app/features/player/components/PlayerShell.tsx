"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineFastForward,
  HiOutlineMenuAlt3,
  HiOutlineRewind,
} from "react-icons/hi";
import { IoPlaySharp } from "react-icons/io5";
import { ControlBar } from "./ControlBar";
import { EpisodePanel } from "./EpisodePanel";
import { ErrorOverlay } from "./ErrorOverlay";
import { LoadingOverlay } from "./LoadingOverlay";
import { NextEpisodeCountdown } from "./NextEpisodeCountdown";
import { SkipIntroButton, SkipRecapButton } from "./SkipButtons";
import { SubtitleLayer, type SubtitleLayerHandle } from "./SubtitleLayer";
import { useAuth } from "../../../contexts/AuthContext";
import { usePlayer } from "../hooks/usePlayer";
import { usePlayerGestures } from "../hooks/usePlayerGestures";
import { usePlayerKeyboard } from "../hooks/usePlayerKeyboard";
import { useMediaSession } from "../hooks/useMediaSession";
import { useTvFocusNavigation } from "../hooks/useTvFocusNavigation";
import { usePlayerBootPhase } from "../hooks/usePlayerBootPhase";
import { getEngineLabel } from "../services/capability";
import { useWatchProgress } from "../hooks/useWatchProgress";
import { useRecordContentView } from "../hooks/useRecordContentView";
import { createDefaultTrackerConfig, ProgressTracker } from "../services/ProgressTracker";
import { PROGRESS_CONSTANTS } from "../services/progress.types";
import { selectIsLoading, usePlayerStore } from "../store/playerStore";
import type { PlayerShellProps } from "../types/player.types";
import { buildPlaybackSubtitleUrl } from "../utils/format";
import { isSameOriginMediaRequest } from "../../../lib/playback-networking";
import { optimizeManagedImageUrl } from "../../../lib/cinema-image";
import { tokenStorage } from "../../../lib/token-storage";

/**
 * Production-grade player shell — composes controller, controls, and overlays.
 */
function PlayerShellComponent({
  media,
  watchMedia,
  backHref,
  immersive = false,
  isSourceTransitioning = false,
  seriesContext,
  onEpisodeSelect,
  onEnded,
}: PlayerShellProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const tvGateButtonRef = useRef<HTMLButtonElement | null>(null);
  const subtitleLayerRef = useRef<SubtitleLayerHandle | null>(null);
  const managedSubtitleUrl = useMemo(
    () => buildPlaybackSubtitleUrl(media.subtitleUrl),
    [media.subtitleUrl],
  );

  const { user, isAuthenticated, isViewer } = useAuth();

  const resumeDecision = useMemo(() => {
    if (!watchMedia) {
      return {
        resumeTime: null as number | null,
      };
    }

    const decision = ProgressTracker.peekResumeDecision(
      watchMedia,
      user?.id != null ? String(user.id) : null,
    );

    const resumeTime =
      decision.resumeTime >= PROGRESS_CONSTANTS.RESUME_MIN_SECONDS
        ? decision.resumeTime
        : null;

    return {
      resumeTime,
    };
  }, [watchMedia, user]);

  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState<{
    side: "left" | "right";
    amount: number;
    key: number;
  } | null>(null);
  const seekFeedbackKeyRef = useRef(0);

  const {
    videoRef,
    pause,
    togglePlay,
    seekBy,
    seekTo,
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
  } = usePlayer({
    media,
    seriesContext,
    onEpisodeSelect,
    onEnded,
    initialResumeTime: resumeDecision.resumeTime,
    startupMode: "auto",
    pendingResumeTime: resumeDecision.resumeTime,
    subtitleLayerRef,
  });
  const fsmState = usePlayerStore((s) => s.fsmState);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const readyState = usePlayerStore((s) => s.readyState);
  const isLoading = usePlayerStore(selectIsLoading);
  const error = usePlayerStore((s) => s.error);
  const showControls = usePlayerStore((s) => s.showControls);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsFullscreen = usePlayerStore((s) => s.setIsFullscreen);
  const usingHlsJs = usePlayerStore((s) => s.usingHlsJs);
  const engineId = usePlayerStore((s) => s.engineId);
  const isTv = usePlayerStore((s) => s.isTv);
  const tvPlayBlocked = usePlayerStore((s) => s.tvPlayBlocked);
  const setTvPlayBlocked = usePlayerStore((s) => s.setTvPlayBlocked);
  const openMenu = usePlayerStore((s) => s.openMenu);
  const selectedSubtitle = usePlayerStore((s) => s.selectedSubtitle);
  const subtitleFontSize = usePlayerStore((s) => s.subtitleFontSize);
  const subtitleFontColor = usePlayerStore((s) => s.subtitleFontColor);
  const subtitleBackground = usePlayerStore((s) => s.subtitleBackground);
  const [episodePanelOpen, setEpisodePanelOpen] = useState(false);
  const autoplayCountdown = usePlayerStore((s) => s.autoplayCountdown);
  const showSkipIntro = usePlayerStore((s) => s.showSkipIntro);
  const showSkipRecap = usePlayerStore((s) => s.showSkipRecap);
  const volume = usePlayerStore((s) => s.volume);
  const subtitleOptions = usePlayerStore((s) => s.subtitleOptions);
  const selectedSubtitleStore = usePlayerStore((s) => s.selectedSubtitle);
  const setSelectedSubtitle = usePlayerStore((s) => s.setSelectedSubtitle);
  const abrPhase = usePlayerStore((s) => s.abrPhase);
  const autoQualityLabel = usePlayerStore((s) => s.autoQualityLabel);

  const isReady = readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
  const { controlsEnabled, progressEnabled } = usePlayerBootPhase(
    isReady,
    isPlaying,
    videoRef,
  );

  useWatchProgress({
    media: watchMedia ?? null,
    userId: user?.id != null ? String(user.id) : null,
    isAuthenticated: isAuthenticated && isViewer,
    enabled: progressEnabled,
    currentTime,
    duration,
    isPlaying,
    onServerResumeSeek: seekTo,
  });

  useRecordContentView({
    media: watchMedia ?? null,
    currentTime,
    isPlaying,
    enabled: progressEnabled,
  });

  const canUsePiP = useMemo(
    () =>
      typeof document !== "undefined" &&
      Boolean(document.pictureInPictureEnabled),
    [],
  );

  const videoCrossOrigin = useMemo((): "anonymous" | undefined => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const playbackUrl =
      media.src?.trim() || media.progressiveUrl?.trim() || media.dashUrl?.trim() || "";

    return playbackUrl && isSameOriginMediaRequest(playbackUrl)
      ? "anonymous"
      : undefined;
  }, [media.src, media.progressiveUrl, media.dashUrl]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      usePlayerStore.getState().applySnapshot({
        error: "تغییر حالت تمام‌صفحه در این مرورگر انجام نشد.",
      });
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !canUsePiP) {
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP unavailable — silent in production.
    }
  }, [canUsePiP, videoRef]);

  const toggleSubtitles = useCallback(() => {
    if (subtitleOptions.length === 0) {
      return;
    }

    const next =
      selectedSubtitleStore === -1
        ? subtitleOptions.find((o) => o.value >= 0)?.value ?? 0
        : -1;
    selectSubtitle(next);
    setSelectedSubtitle(next);
  }, [selectSubtitle, selectedSubtitleStore, setSelectedSubtitle, subtitleOptions]);

  const goNextEpisode = useCallback(() => {
    const next = seriesContext?.nextEpisode;
    if (next && onEpisodeSelect) {
      onEpisodeSelect(next.seasonNumber, next.episodeNumber);
    }
  }, [onEpisodeSelect, seriesContext?.nextEpisode]);

  const handleVideoAreaClick = useCallback(() => {
    toggleControls();
  }, [toggleControls]);

  const controlsInteractive =
    showControls || !isPlaying || openMenu !== null || episodePanelOpen;

  const goPrevEpisode = useCallback(() => {
    const prev = seriesContext?.prevEpisode;
    if (prev && onEpisodeSelect) {
      onEpisodeSelect(prev.seasonNumber, prev.episodeNumber);
    }
  }, [onEpisodeSelect, seriesContext?.prevEpisode]);

  const handleSeekByWithFeedback = useCallback(
    (seconds: number) => {
      seekBy(seconds);
      seekFeedbackKeyRef.current += 1;
      setSeekFeedback({
        side: seconds >= 0 ? "right" : "left",
        amount: Math.abs(seconds),
        key: seekFeedbackKeyRef.current,
      });
      window.setTimeout(() => setSeekFeedback(null), 800);
    },
    [seekBy],
  );

  const handleBack = useCallback(() => {
    if (episodePanelOpen) {
      setEpisodePanelOpen(false);
      return;
    }

    if (openMenu) {
      usePlayerStore.getState().setOpenMenu(null);
      return;
    }

    // Persist progress immediately so Continue Watching works without a home refresh.
    const video = videoRef.current;
    if (watchMedia && video && Number.isFinite(video.currentTime) && video.currentTime > 0) {
      const tracker = ProgressTracker.getInstance();
      tracker.init(
        createDefaultTrackerConfig({
          userId: user?.id != null ? String(user.id) : null,
          isAuthenticated: isAuthenticated && isViewer,
          getAuthToken: () => tokenStorage.getToken(),
        }),
      );
      tracker.attachMedia(watchMedia);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        tracker.updateDuration(video.duration);
      }
      tracker.tick(video.currentTime, video.duration || undefined);
      tracker.pause();
    }

    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  }, [
    backHref,
    episodePanelOpen,
    isAuthenticated,
    isViewer,
    openMenu,
    router,
    user?.id,
    videoRef,
    watchMedia,
  ]);

  usePlayerKeyboard(
    containerRef,
    {
      togglePlay,
      seekBy: handleSeekByWithFeedback,
      setVolume,
      toggleMute,
      toggleFullscreen,
      toggleSubtitles,
      nextEpisode: seriesContext?.nextEpisode ? goNextEpisode : undefined,
      onBack: handleBack,
      volume,
      controlsVisible: showControls,
      menuOpen: openMenu !== null,
    },
    controlsEnabled,
  );

  useTvFocusNavigation(containerRef, controlsRef, controlsEnabled);

  const optimizedPoster = useMemo(
    () =>
      optimizeManagedImageUrl(media.poster, {
        width: immersive ? 1920 : 1280,
        quality: 70,
        sharpen: 60,
      }),
    [immersive, media.poster],
  );

  useMediaSession({
    title: media.title,
    poster: optimizedPoster,
    isPlaying,
    togglePlay: () => void togglePlay(),
    seekBy: handleSeekByWithFeedback,
    enabled: controlsEnabled,
  });

  const { onTouchStart, onTouchEnd } = usePlayerGestures(
    {
      pause,
      isPlaying,
      seekBy: handleSeekByWithFeedback,
      setVolume,
      volume,
      revealControls,
      toggleControls,
    },
    controlsEnabled,
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [setIsFullscreen]);

  useEffect(() => {
    if (!tvPlayBlocked || !isTv) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      tvGateButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isTv, tvPlayBlocked]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const sizeMap = { large: "170%", medium: "130%", small: "100%" } as const;
    const colorMap = { black: "#000000", white: "#ffffff", yellow: "#fde047" } as const;
    const bgMap = {
      black: "rgba(0, 0, 0, 0.78)",
      white: "rgba(255, 255, 255, 0.78)",
      transparent: "transparent",
    } as const;

    video.style.setProperty("--cinema-subtitle-size", sizeMap[subtitleFontSize]);
    video.style.setProperty("--cinema-subtitle-color", colorMap[subtitleFontColor]);
    video.style.setProperty("--cinema-subtitle-bg", bgMap[subtitleBackground]);
  }, [subtitleBackground, subtitleFontColor, subtitleFontSize, videoRef]);

  const showBufferingOverlay =
    !error &&
    !isDraggingSeek &&
    (isLoading ||
      isSourceTransitioning ||
      fsmState === "seeking" ||
      // Keep spinner until first frames exist — never flash poster/black alone.
      (!isPlaying &&
        readyState < HTMLMediaElement.HAVE_CURRENT_DATA &&
        fsmState !== "ended" &&
        fsmState !== "idle"));

  return (
    <div
      className={immersive ? "fixed inset-0 z-50 h-dvh w-screen overflow-hidden bg-black" : "space-y-4"}
      dir="ltr"
      style={immersive ? { width: "100vw", height: "100dvh" } : undefined}
    >
      <div
        ref={containerRef}
        data-player-tv={isTv ? "true" : undefined}
        tabIndex={0}
        onMouseMove={revealControls}
        onFocus={revealControls}
        onTouchStart={onTouchStart}
        onTouchEnd={(e) =>
          onTouchEnd(e, containerRef.current?.clientWidth ?? window.innerWidth)
        }
        style={{ touchAction: "manipulation" }}
        className={`relative overflow-hidden bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
          immersive
            ? "h-dvh w-screen rounded-none border-0"
            : "rounded-[34px] border border-white/10 shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
        } ${!showControls && isPlaying ? "cursor-none" : ""}`}
      >
        <div
          className={`relative bg-black ${immersive ? "aspect-auto h-dvh w-screen" : "aspect-video w-full"}`}
        >
          <video
            ref={videoRef}
            playsInline
            preload="auto"
            crossOrigin={videoCrossOrigin}
            controls={false}
            poster={immersive ? undefined : optimizedPoster || undefined}
            className={`cinema-player-video relative z-[2] h-full w-full bg-black ${
              immersive ? "object-cover object-center" : "object-contain"
            }`}
          />

          {!immersive ? (
            <div className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.12),rgba(0,0,0,0.7)_88%)]" />
          ) : null}

          {tvPlayBlocked ? (
            <div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60"
              data-player-controls
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setTvPlayBlocked(false);
                  void togglePlay();
                }
              }}
              onClick={() => {
                setTvPlayBlocked(false);
                void togglePlay();
              }}
            >
              <button
                ref={tvGateButtonRef}
                type="button"
                data-tv-focusable
                className="inline-flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white focus:outline-none focus:ring-4 focus:ring-white"
                aria-label="پخش"
              >
                <IoPlaySharp className="h-20 w-20" />
              </button>
              <p className="mt-4 text-2xl font-bold text-white" dir="rtl">
                {isTv
                  ? "برای شروع پخش، دکمه تأیید را فشار دهید"
                  : "برای شروع پخش ضربه بزنید"}
              </p>
            </div>
          ) : null}

          {isPlaying && !openMenu ? (
            <button
              type="button"
              aria-label={showControls ? "پنهان کردن کنترل‌ها" : "نمایش کنترل‌ها"}
              className={`absolute inset-0 z-20 cursor-pointer border-0 bg-transparent p-0 ${
                showControls ? "pointer-events-none" : "pointer-events-auto"
              }`}
              onClick={handleVideoAreaClick}
            />
          ) : null}

          {managedSubtitleUrl && selectedSubtitle === 0 && !isTv ? (
            <SubtitleLayer
              ref={subtitleLayerRef}
              fontSize={subtitleFontSize}
              fontColor={subtitleFontColor}
              background={subtitleBackground}
            />
          ) : null}

          {abrPhase === "ramp-up" && autoQualityLabel ? (
            <div className="pointer-events-none absolute right-4 top-4 z-30">
              <div className="animate-fade-in-out flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs text-white/70">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#38bdf8]" />
                {autoQualityLabel}
              </div>
            </div>
          ) : null}

          {showBufferingOverlay ? <LoadingOverlay /> : null}

          {seekFeedback ? (
            <div
              key={seekFeedback.key}
              className={`animate-seek-feedback pointer-events-none absolute top-1/2 z-[25] flex -translate-y-1/2 flex-col items-center gap-1 ${
                seekFeedback.side === "left" ? "left-16" : "right-16"
              }`}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
                {seekFeedback.side === "right" ? (
                  <HiOutlineFastForward className="h-8 w-8 text-white" />
                ) : (
                  <HiOutlineRewind className="h-8 w-8 text-white" />
                )}
              </div>
              <span className="text-sm font-medium text-white drop-shadow">
                {seekFeedback.amount} ثانیه
              </span>
            </div>
          ) : null}

          {error && fsmState === "error" ? (
            <ErrorOverlay message={error} onRetry={() => void recover()} />
          ) : null}

          {showSkipIntro ? <SkipIntroButton onSkip={skipIntro} /> : null}
          {showSkipRecap ? <SkipRecapButton onSkip={skipRecap} /> : null}

          {autoplayCountdown !== null && seriesContext?.nextEpisode ? (
            <NextEpisodeCountdown
              countdown={autoplayCountdown}
              nextTitle={
                seriesContext.nextEpisode.title ||
                `قسمت ${seriesContext.nextEpisode.episodeNumber}`
              }
              onCancel={cancelAutoplay}
              onPlayNow={goNextEpisode}
            />
          ) : null}

          {seriesContext && controlsEnabled ? (
            <EpisodePanel
              nav={{
                seriesSlug: seriesContext.seriesSlug,
                seriesTitle: seriesContext.seriesTitle,
                currentSeason: seriesContext.currentSeason,
                currentEpisode: seriesContext.currentEpisode,
              }}
              controlsVisible={showControls || !isPlaying}
              onOpenChange={setEpisodePanelOpen}
              onSelect={(season, episode) => onEpisodeSelect?.(season, episode)}
            />
          ) : null}

          <div
            className={`pointer-events-none absolute inset-0 z-30 flex flex-col justify-between bg-[linear-gradient(180deg,rgba(4,12,19,0.75),rgba(4,12,19,0.12)_35%,rgba(4,12,19,0.85))] p-4 transition duration-300 md:p-6 ${
              controlsInteractive ? "opacity-100" : "opacity-0"
            }`}
          >
            {immersive ? (
              <div
                className={`flex items-start justify-between gap-3 ${
                  controlsInteractive ? "pointer-events-auto" : ""
                }`}
                dir="rtl"
              >
                {media.title && !seriesContext ? (
                  <p className="max-w-md truncate text-right text-sm font-bold text-white/90">
                    {media.title}
                  </p>
                ) : (
                  <div />
                )}
                {backHref ? (
                  <Link
                    href={backHref}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white transition hover:bg-black/55"
                    aria-label="بازگشت"
                  >
                    <HiOutlineArrowRight className="h-5 w-5 rotate-180" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <div
                className={`flex items-start justify-between gap-3 ${
                  controlsInteractive ? "pointer-events-auto" : ""
                }`}
                dir="rtl"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d6e3ea]">
                  <HiOutlineMenuAlt3 className="h-4 w-4 text-[#38bdf8]" />
                  {getEngineLabel(engineId)}
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="truncate text-lg font-black text-white md:text-2xl">
                    {media.title || "پخش"}
                  </h2>
                  {backHref ? (
                    <Link
                      href={backHref}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white"
                    >
                      <HiOutlineArrowLeft className="h-5 w-5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            )}

            {!isPlaying && fsmState !== "ended" && !isLoading && !tvPlayBlocked ? (
              <div className="pointer-events-auto flex flex-1 items-center justify-center">
                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  aria-label="پخش"
                  className="inline-flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur"
                >
                  <IoPlaySharp className="h-12 w-12" />
                </button>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div
              ref={controlsRef}
              data-player-controls
              className={
                controlsInteractive ? "pointer-events-auto" : ""
              }
            >
            <ControlBar
              onTogglePlay={() => void togglePlay()}
              onSeekBy={handleSeekByWithFeedback}
              onSeekTo={seekTo}
              onSeekDragStart={() => setIsDraggingSeek(true)}
              onSeekDragEnd={() => setIsDraggingSeek(false)}
              onToggleMute={toggleMute}
              onVolumeChange={setVolume}
              onSelectQuality={selectQuality}
              onSelectAudio={selectAudio}
              onSelectSubtitle={selectSubtitle}
              onSelectSpeed={setPlaybackRate}
              onSubtitleDelayChange={setSubtitleDelay}
              onSubtitleStyleChange={setSubtitleStyle}
              onToggleFullscreen={() => void toggleFullscreen()}
              onTogglePiP={() => void togglePiP()}
              onNextEpisode={
                seriesContext?.nextEpisode ? goNextEpisode : undefined
              }
              onPrevEpisode={
                seriesContext?.prevEpisode ? goPrevEpisode : undefined
              }
              canUsePiP={canUsePiP}
              hasSeriesNav={Boolean(seriesContext)}
            />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .cinema-player-video::cue {
          font-size: var(--cinema-subtitle-size, 130%);
          color: var(--cinema-subtitle-color, #ffffff);
          background-color: var(--cinema-subtitle-bg, transparent);
        }

        [data-player-tv="true"] .cinema-player-video::cue {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ffffff;
          background-color: transparent;
          text-shadow:
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000;
        }
      `}</style>
    </div>
  );
}

export const PlayerShell = memo(PlayerShellComponent);
export default PlayerShell;
