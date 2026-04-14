"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Hls from "hls.js";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowsExpand,
  HiOutlineFastForward,
  HiOutlineMenuAlt3,
  HiOutlineRefresh,
  HiOutlineRewind,
  HiOutlineSpeakerphone,
  HiOutlineVolumeOff,
  HiOutlineX,
} from "react-icons/hi";
import { IoPauseSharp, IoPlaySharp } from "react-icons/io5";

type MenuKey = "quality" | "audio" | "subtitle" | "speed" | null;

type QualityOption = {
  value: number;
  label: string;
  detail: string;
};

type AudioOption = {
  value: number;
  label: string;
};

type SubtitleOption = {
  value: number;
  label: string;
};

type NativeAudioTrack = {
  enabled: boolean;
  label?: string;
  language?: string;
};

type NativeAudioTrackList = {
  length: number;
  [index: number]: NativeAudioTrack;
};

function formatSeconds(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "00:00";
  }

  const safeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseResolutionHeight(resolution?: string) {
  if (!resolution) {
    return null;
  }

  const match = resolution.match(/(\d{3,4})$/);
  return match ? Number(match[1]) : null;
}

function getQualityLabel(height?: number, fallback?: string) {
  if (height) {
    return `${height}p`;
  }

  return fallback || "کیفیت";
}

function getQualityDetail(width?: number, height?: number, bitrate?: number) {
  const resolution = width && height ? `${width}x${height}` : "Adaptive";

  if (!bitrate) {
    return resolution;
  }

  return `${resolution} • ${Math.round(bitrate / 1000)} kbps`;
}

function getQualityLabelForLevel(
  levelIndex: number,
  levels: Array<{ height?: number }>,
  variants: Array<{ profile_key: string; resolution: string }>,
) {
  if (levelIndex < 0) {
    return "";
  }

  const level = levels[levelIndex];
  const variant = variants[levelIndex];

  return getQualityLabel(level?.height, variant?.profile_key);
}

function getAudioTracksFromVideo(video: HTMLVideoElement): AudioOption[] {
  const nativeTracks = (
    video as HTMLVideoElement & { audioTracks?: NativeAudioTrackList }
  ).audioTracks;

  if (!nativeTracks || nativeTracks.length === 0) {
    return [];
  }

  return Array.from({ length: nativeTracks.length }, (_, index) => {
    const track = nativeTracks[index];

    return {
      value: index,
      label: track.label || track.language || `صدا ${index + 1}`,
    };
  });
}

function getSubtitleTracksFromVideo(video: HTMLVideoElement): SubtitleOption[] {
  const textTracks = video.textTracks;

  if (!textTracks || textTracks.length === 0) {
    return [];
  }

  return Array.from({ length: textTracks.length }, (_, index) => {
    const track = textTracks[index];

    return {
      value: index,
      label: track.label || track.language || `زیرنویس ${index + 1}`,
    };
  });
}

function debugPlayer(event: string, payload?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(`[CinemaPlayer] ${event}`, payload ?? "");
}

export default function HlsVideoPlayer({
  src,
  poster,
  title,
  backHref,
  immersive = false,
  availableVariants = [],
  availableAudioTracks = [],
}: {
  src: string;
  poster?: string | null;
  title?: string;
  backHref?: string;
  immersive?: boolean;
  availableVariants?: Array<{
    profile_key: string;
    resolution: string;
    bandwidth: number;
  }>;
  availableAudioTracks?: Array<{
    key: string;
    label: string;
    language: string;
    is_default: boolean;
  }>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressTrackRef = useRef<HTMLDivElement | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const manualQualityRef = useRef(-1);

  const [playerError, setPlayerError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [autoQualityLabel, setAutoQualityLabel] = useState("");
  const [audioOptions, setAudioOptions] = useState<AudioOption[]>([]);
  const [selectedAudio, setSelectedAudio] = useState(0);
  const [subtitleOptions, setSubtitleOptions] = useState<SubtitleOption[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(-1);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [usingManagedHls, setUsingManagedHls] = useState(false);

  const playbackRates = useMemo(
    () => [
      { value: 0.75, label: "0.75x" },
      { value: 1, label: "عادی" },
      { value: 1.25, label: "1.25x" },
      { value: 1.5, label: "1.5x" },
      { value: 2, label: "2x" },
    ],
    [],
  );

  const canUsePictureInPicture = useMemo(() => {
    if (typeof document === "undefined") {
      return false;
    }

    return Boolean(document.pictureInPictureEnabled);
  }, []);

  const resolvedQualityOptions = useMemo(() => {
    if (qualityOptions.length > 1) {
      return qualityOptions;
    }

    if (availableVariants.length > 0) {
      return [
        { value: -1, label: "خودکار", detail: "Adaptive HLS" },
        ...availableVariants.map((variant, index) => ({
          value: index,
          label: variant.profile_key,
          detail: `${variant.resolution} • ${Math.round(variant.bandwidth / 1000)} kbps`,
        })),
      ];
    }

    return qualityOptions;
  }, [availableVariants, qualityOptions]);

  const getAutoQualityLabel = useCallback(
    (levelIndex: number, hls?: Hls | null) =>
      getQualityLabelForLevel(levelIndex, hls?.levels ?? [], availableVariants),
    [availableVariants],
  );

  const activeQualityLabel = useMemo(() => {
    if (selectedQuality === -1) {
      return autoQualityLabel ? `خودکار (${autoQualityLabel})` : "خودکار";
    }

    return (
      resolvedQualityOptions.find((option) => option.value === selectedQuality)
        ?.label || "کیفیت"
    );
  }, [autoQualityLabel, resolvedQualityOptions, selectedQuality]);

  const activeAudioLabel = useMemo(
    () =>
      audioOptions.find((option) => option.value === selectedAudio)?.label ||
      "???? ????",
    [audioOptions, selectedAudio],
  );

  const queueControlsHide = useCallback(() => {
    if (controlsTimerRef.current) {
      window.clearTimeout(controlsTimerRef.current);
    }

    controlsTimerRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setOpenMenu(null);
      }
    }, 2800);
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    queueControlsHide();
  }, [queueControlsHide]);

  const syncBuffered = useCallback(() => {
    const video = videoRef.current;

    if (!video || !video.duration || video.buffered.length === 0) {
      setBufferedPercent(0);
      return;
    }

    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    setBufferedPercent(clamp((bufferedEnd / video.duration) * 100, 0, 100));
  }, []);

  const syncQualityOptions = useCallback(
    (hls: Hls) => {
      const options: QualityOption[] = [
        { value: -1, label: "خودکار", detail: "Adaptive HLS" },
      ];

      if (availableVariants.length > 0) {
        availableVariants.forEach((variant, index) => {
          const expectedHeight = parseResolutionHeight(variant.resolution);
          const matchedLevelIndex = hls.levels.findIndex((level) => {
            if (expectedHeight && level.height === expectedHeight) {
              return true;
            }

            return level.bitrate === variant.bandwidth;
          });

          options.push({
            value:
              matchedLevelIndex >= 0
                ? matchedLevelIndex
                : index < hls.levels.length
                  ? index
                  : index,
            label:
              expectedHeight !== null
                ? `${expectedHeight}p`
                : variant.profile_key,
            detail: `${variant.resolution} • ${Math.round(variant.bandwidth / 1000)} kbps`,
          });
        });
      } else {
        hls.levels.forEach((level, index) => {
          options.push({
            value: index,
            label: getQualityLabel(level.height),
            detail: getQualityDetail(level.width, level.height, level.bitrate),
          });
        });
      }

      setQualityOptions(
        options.filter(
          (option, index, array) =>
            array.findIndex(
              (candidate) =>
                candidate.value === option.value &&
                candidate.label === option.label,
            ) === index,
        ),
      );
    },
    [availableVariants],
  );

  const syncAudioOptions = useCallback(
    (video: HTMLVideoElement, hls?: Hls | null) => {
      if (hls && hls.audioTracks.length > 0) {
        setAudioOptions(
          hls.audioTracks.map((track, index) => ({
            value: index,
            label:
              availableAudioTracks[index]?.label ||
              track.name ||
              track.lang ||
              `??? ${index + 1}`,
          })),
        );
        setSelectedAudio(hls.audioTrack >= 0 ? hls.audioTrack : 0);
        return;
      }

      setAudioOptions(getAudioTracksFromVideo(video));
    },
    [availableAudioTracks],
  );

  const syncSubtitleOptions = useCallback(
    (video: HTMLVideoElement, hls?: Hls | null) => {
      if (hls && hls.subtitleTracks.length > 0) {
        setSubtitleOptions([
          { value: -1, label: "خاموش" },
          ...hls.subtitleTracks.map((track, index) => ({
            value: index,
            label: track.name || track.lang || `زیرنویس ${index + 1}`,
          })),
        ]);
        setSelectedSubtitle(hls.subtitleTrack);
        return;
      }

      setSubtitleOptions([
        { value: -1, label: "خاموش" },
        ...getSubtitleTracksFromVideo(video),
      ]);
    },
    [],
  );

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    try {
      if (video.paused) {
        await video.play();
        revealControls();
      } else {
        video.pause();
        setShowControls(true);
      }
    } catch {
      setPlayerError("???? ??? ?? ??? ?????? ?? ?????? ????? ???.");
    }
  }, [revealControls]);

  const handleVideoSurfaceClick = useCallback(() => {
    void togglePlayback();
  }, [togglePlayback]);

  const seekBy = useCallback(
    (seconds: number) => {
      const video = videoRef.current;

      if (!video || !duration) {
        return;
      }

      video.currentTime = clamp(video.currentTime + seconds, 0, duration);
      revealControls();
    },
    [duration, revealControls],
  );

  const setPositionFromClientX = useCallback(
    (clientX: number) => {
      const video = videoRef.current;
      const track = progressTrackRef.current;

      if (!video || !track || !duration) {
        return;
      }

      const rect = track.getBoundingClientRect();
      const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
      video.currentTime = duration * percent;
      setCurrentTime(video.currentTime);
    },
    [duration],
  );

  const handleProgressPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      setPositionFromClientX(event.clientX);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        setPositionFromClientX(moveEvent.clientX);
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [setPositionFromClientX],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((nextVolume: number) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  }, []);

  const selectPlaybackRate = useCallback((nextRate: number) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.playbackRate = nextRate;
    setPlaybackRate(nextRate);
    setOpenMenu(null);
  }, []);

  const selectQuality = useCallback(
    (nextValue: number) => {
      if (!hlsRef.current) {
        debugPlayer("quality-select-skipped-no-hls", { nextValue });
        return;
      }

      const hls = hlsRef.current;
      debugPlayer("quality-select-click", {
        nextValue,
        autoLevelEnabled: hls.autoLevelEnabled,
        currentLevel: hls.currentLevel,
        nextLevel: hls.nextLevel,
        loadLevel: hls.loadLevel,
        levels: hls.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
        })),
      });

      if (nextValue === -1) {
        manualQualityRef.current = -1;
        hls.currentLevel = -1;
        hls.nextLevel = -1;
        hls.loadLevel = -1;
        hls.startLevel = -1;
        hls.nextAutoLevel = -1;
        setAutoQualityLabel(getAutoQualityLabel(hls.currentLevel, hls));
      } else {
        manualQualityRef.current = nextValue;
        hls.nextLevel = nextValue;
        hls.loadLevel = nextValue;
        hls.nextLoadLevel = nextValue;
        hls.currentLevel = nextValue;
        hls.startLevel = nextValue;
        setAutoQualityLabel("");
      }

      setSelectedQuality(nextValue);
      setOpenMenu(null);
    },
    [getAutoQualityLabel],
  );

  const selectAudioTrack = useCallback((nextValue: number) => {
    const video = videoRef.current;

    if (hlsRef.current && hlsRef.current.audioTracks.length > 0) {
      hlsRef.current.audioTrack = nextValue;
      setSelectedAudio(nextValue);
      setOpenMenu(null);
      return;
    }

    const nativeTracks = (
      video as HTMLVideoElement & { audioTracks?: NativeAudioTrackList }
    )?.audioTracks;

    if (!nativeTracks) {
      return;
    }

    Array.from({ length: nativeTracks.length }, (_, index) => {
      nativeTracks[index].enabled = index === nextValue;
      return null;
    });

    setSelectedAudio(nextValue);
    setOpenMenu(null);
  }, []);

  const selectSubtitleTrack = useCallback((nextValue: number) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (hlsRef.current && hlsRef.current.subtitleTracks.length > 0) {
      hlsRef.current.subtitleTrack = nextValue;
      setSelectedSubtitle(nextValue);
      setOpenMenu(null);
      return;
    }

    Array.from(video.textTracks).forEach((track, index) => {
      track.mode =
        nextValue === -1
          ? "disabled"
          : index === nextValue
            ? "showing"
            : "disabled";
    });

    setSelectedSubtitle(nextValue);
    setOpenMenu(null);
  }, []);

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
      setPlayerError("تغییر حالت تمام‌صفحه در این مرورگر انجام نشد.");
    }
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;

    if (!video || !canUsePictureInPicture) {
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      setPlayerError("حالت تصویر در تصویر در این دستگاه در دسترس نیست.");
    }
  }, [canUsePictureInPicture]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !src) {
      return;
    }

    let hls: Hls | null = null;
    const resetFrame = window.requestAnimationFrame(() => {
      setPlayerError("");
      setIsLoading(true);
      setShowControls(true);
      setUsingManagedHls(false);
    });

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setCurrentTime(video.currentTime || 0);
      syncBuffered();
      syncAudioOptions(video, hls);
      syncSubtitleOptions(video, hls);
    };

    const handleDurationChange = () => setDuration(video.duration || 0);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);

      if (video.readyState >= 2) {
        setIsLoading(false);
      }
    };
    const handleProgress = () => syncBuffered();
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleSeeking = () => {
      debugPlayer("media-seeking", {
        currentTime: video.currentTime,
        manualQuality: manualQualityRef.current,
      });

      if (!hls) {
        return;
      }

      if (manualQualityRef.current >= 0) {
        hls.currentLevel = manualQualityRef.current;
        hls.nextLevel = manualQualityRef.current;
        hls.loadLevel = manualQualityRef.current;
        hls.nextLoadLevel = manualQualityRef.current;
      }

      debugPlayer("seek-load-sync", {
        currentTime: video.currentTime,
        manualQuality: manualQualityRef.current,
        currentLevel: hls.currentLevel,
        nextLevel: hls.nextLevel,
        loadLevel: hls.loadLevel,
      });
    };
    const handleSeeked = () => {
      if (video.readyState >= 2) {
        setIsLoading(false);
      }

      debugPlayer("media-seeked", {
        currentTime: video.currentTime,
        manualQuality: manualQualityRef.current,
        readyState: video.readyState,
      });
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      queueControlsHide();
    };
    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }
    };
    const handleVolume = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolume);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        backBufferLength: 90,
        lowLatencyMode: false,
      });

      hlsRef.current = hls;
      window.requestAnimationFrame(() => {
        setUsingManagedHls(true);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        debugPlayer("manifest-parsed", {
          levels: hls!.levels.map((level, index) => ({
            index,
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
          })),
        });
        syncQualityOptions(hls!);
        syncAudioOptions(video, hls!);
        syncSubtitleOptions(video, hls!);
        setSelectedQuality(hls!.currentLevel >= 0 ? hls!.currentLevel : -1);
        setAutoQualityLabel(getAutoQualityLabel(hls!.nextAutoLevel, hls!));
        setIsLoading(false);
      });

      hls.on(Hls.Events.LEVELS_UPDATED, () => {
        debugPlayer("levels-updated", {
          levels: hls!.levels.map((level, index) => ({
            index,
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
          })),
        });
        syncQualityOptions(hls!);
      });

      hls.on(Hls.Events.LEVEL_SWITCHING, (_, data) => {
        debugPlayer("level-switching", data);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        debugPlayer("level-switched", data);
        setAutoQualityLabel(getAutoQualityLabel(data.level, hls!));

        if (manualQualityRef.current >= 0) {
          setSelectedQuality(manualQualityRef.current);
          return;
        }

        setSelectedQuality(-1);
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        syncAudioOptions(video, hls!);
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setSelectedAudio(data.id);
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        syncSubtitleOptions(video, hls!);
      });

      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_, data) => {
        setSelectedSubtitle(data.id);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        debugPlayer("hls-error", data);
        if (data.fatal) {
          setPlayerError(
            "پخش HLS با خطا روبه‌رو شد. لاگ پردازش را در پنل بررسی کن.",
          );
          setIsLoading(false);
          hls?.destroy();
          hlsRef.current = null;
        }
      });

      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      debugPlayer("native-hls-fallback", { src });
      video.src = src;
      window.requestAnimationFrame(() => {
        setQualityOptions(
          availableVariants.length > 0
            ? [
                { value: -1, label: "خودکار", detail: "Adaptive HLS" },
                ...availableVariants.map((variant, index) => ({
                  value: index,
                  label: variant.profile_key,
                  detail: `${variant.resolution} • ${Math.round(variant.bandwidth / 1000)} kbps`,
                })),
              ]
            : [
                {
                  value: -1,
                  label: "خودکار",
                  detail: "مرورگر کیفیت را مدیریت می‌کند",
                },
              ],
        );
        setSelectedQuality(-1);
      });
    } else {
      window.requestAnimationFrame(() => {
        setPlayerError("مرورگر شما از HLS پشتیبانی نمی‌کند.");
        setIsLoading(false);
      });
    }

    return () => {
      video.pause();
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolume);

      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }

      window.cancelAnimationFrame(resetFrame);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [
    availableVariants,
    getAutoQualityLabel,
    queueControlsHide,
    src,
    syncAudioOptions,
    syncBuffered,
    syncQualityOptions,
    syncSubtitleOptions,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    debugPlayer("selected-quality-state", {
      selectedQuality,
      activeQualityLabel,
      usingManagedHls,
    });
  }, [activeQualityLabel, selectedQuality, usingManagedHls]);

  const currentProgressPercent = duration
    ? clamp((currentTime / duration) * 100, 0, 100)
    : 0;

  return (
    <div className={immersive ? "h-screen w-screen bg-black" : "space-y-4"} dir="ltr">
      <div
        ref={containerRef}
        tabIndex={0}
        onMouseMove={revealControls}
        onFocus={revealControls}
        onKeyDown={(event) => {
          if (event.key === " " || event.key.toLowerCase() === "k") {
            event.preventDefault();
            void togglePlayback();
            return;
          }

          if (event.key === "ArrowRight") {
            event.preventDefault();
            seekBy(10);
            return;
          }

          if (event.key === "ArrowLeft") {
            event.preventDefault();
            seekBy(-10);
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            handleVolumeChange(clamp(volume + 0.1, 0, 1));
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            handleVolumeChange(clamp(volume - 0.1, 0, 1));
            return;
          }

          if (event.key.toLowerCase() === "f") {
            event.preventDefault();
            void toggleFullscreen();
            return;
          }

          if (event.key.toLowerCase() === "m") {
            event.preventDefault();
            toggleMute();
            return;
          }

          if (event.key.toLowerCase() === "p") {
            event.preventDefault();
            void togglePictureInPicture();
          }
        }}
        className={`relative overflow-hidden bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${
          immersive
            ? "h-screen w-screen rounded-none border-0 shadow-none"
            : "rounded-[34px] border border-white/10 shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
        } ${
          !showControls && isPlaying ? "cursor-none" : ""
        }`}
      >
        <div
          className={`relative bg-black ${immersive ? "h-screen w-screen" : "aspect-video"}`}
          dir="ltr"
        >
          <video
            ref={videoRef}
            playsInline
            poster={poster || undefined}
            className="cinema-player-video h-full w-full bg-black object-contain"
            onClick={handleVideoSurfaceClick}
          />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.12),rgba(0,0,0,0.7)_88%)]" />

          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div
                className="rounded-full border border-white/10 bg-black/55 px-5 py-3 text-sm text-white"
                dir="rtl"
              >
                در حال بارگذاری پخش...
              </div>
            </div>
          ) : null}

          <div
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                void togglePlayback();
              }
            }}
            className={`absolute inset-0 z-30 flex flex-col justify-between bg-[linear-gradient(180deg,rgba(4,12,19,0.75),rgba(4,12,19,0.12)_35%,rgba(4,12,19,0.85))] p-4 transition duration-300 md:p-6 ${
              showControls || !isPlaying
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            {immersive ? (
              <div className="flex items-start justify-end" dir="rtl">
                {backHref ? (
                  <Link
                    href={backHref}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white transition hover:border-white/20 hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                  >
                    <HiOutlineArrowLeft className="h-5 w-5" />
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3" dir="rtl">
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d6e3ea]"
                  dir="ltr"
                >
                  <HiOutlineMenuAlt3 className="h-4 w-4 text-[#38bdf8]" />
                  {usingManagedHls ? "Adaptive HLS" : "Native HLS"}
                </div>

                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#8ea4b3]">
                      Cinema Player
                    </p>
                    <h2 className="truncate text-lg font-black text-white md:text-2xl">
                      {title || "پخش فیلم"}
                    </h2>
                  </div>

                  {backHref ? (
                    <Link
                      href={backHref}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                    >
                      <HiOutlineArrowLeft className="h-5 w-5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            )}

            {!isPlaying ? (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => void togglePlayback()}
                  className="inline-flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                >
                  <IoPlaySharp className="h-12 w-12" />
                </button>
              </div>
            ) : (
              <div />
            )}

            <div className="space-y-4">
              <div
                ref={progressTrackRef}
                onPointerDown={handleProgressPointerDown}
                className="relative h-2.5 cursor-pointer rounded-full bg-white/15"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/15"
                  style={{ width: `${bufferedPercent}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#38bdf8,#f5c518)]"
                  style={{ width: `${currentProgressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-[#081018] bg-[#f5c518] shadow-[0_0_0_4px_rgba(245,197,24,0.18)]"
                  style={{ left: `calc(${currentProgressPercent}% - 8px)` }}
                />
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void togglePlayback()}
                    className="inline-flex h-14 min-w-14 items-center justify-center rounded-full border border-white/10 bg-black/35 px-4 text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                  >
                    {isPlaying ? (
                      <IoPauseSharp className="h-8 w-8" />
                    ) : (
                      <IoPlaySharp className="h-8 w-8" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => seekBy(-10)}
                    className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 px-4 text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                  >
                    <HiOutlineRewind className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => seekBy(10)}
                    className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 px-4 text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                  >
                    <HiOutlineFastForward className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-white">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                    >
                      {isMuted || volume === 0 ? (
                        <HiOutlineVolumeOff className="h-5 w-5" />
                      ) : (
                        <HiOutlineSpeakerphone className="h-5 w-5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(event) =>
                        handleVolumeChange(Number(event.target.value))
                      }
                      className="h-1.5 w-24 accent-[#38bdf8]"
                    />
                  </div>

                  <div className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm text-white">
                    {formatSeconds(currentTime)} / {formatSeconds(duration)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PlayerMenu
                    isOpen={openMenu === "quality"}
                    label={`کیفیت: ${activeQualityLabel}`}
                    onToggle={() =>
                      setOpenMenu(openMenu === "quality" ? null : "quality")
                    }
                    onClose={() => setOpenMenu(null)}
                  >
                    {resolvedQualityOptions.map((option) => (
                      <button
                        key={`${option.value}-${option.label}`}
                        type="button"
                        onClick={() => selectQuality(option.value)}
                        className={`w-full rounded-2xl px-3 py-2 text-right transition ${
                          selectedQuality === option.value
                            ? "bg-[#38bdf8]/15 text-white"
                            : "text-[#d6e3ea] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="mt-1 text-xs text-[#8ea4b3]">
                          {option.detail}
                        </div>
                      </button>
                    ))}
                  </PlayerMenu>

                  {audioOptions.length > 1 ? (
                    <PlayerMenu
                      isOpen={openMenu === "audio"}
                      label={`????: ${activeAudioLabel}`}
                      onToggle={() =>
                        setOpenMenu(openMenu === "audio" ? null : "audio")
                      }
                      onClose={() => setOpenMenu(null)}
                    >
                      {audioOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => selectAudioTrack(option.value)}
                          className={`w-full rounded-2xl px-3 py-2 text-right transition ${
                            selectedAudio === option.value
                              ? "bg-[#38bdf8]/15 text-white"
                              : "text-[#d6e3ea] hover:bg-white/[0.05]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </PlayerMenu>
                  ) : null}

                  {subtitleOptions.length > 1 ? (
                    <PlayerMenu
                      isOpen={openMenu === "subtitle"}
                      label="زیرنویس"
                      onToggle={() =>
                        setOpenMenu(openMenu === "subtitle" ? null : "subtitle")
                      }
                      onClose={() => setOpenMenu(null)}
                    >
                      {subtitleOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => selectSubtitleTrack(option.value)}
                          className={`w-full rounded-2xl px-3 py-2 text-right transition ${
                            selectedSubtitle === option.value
                              ? "bg-[#38bdf8]/15 text-white"
                              : "text-[#d6e3ea] hover:bg-white/[0.05]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </PlayerMenu>
                  ) : null}

                  <PlayerMenu
                    isOpen={openMenu === "speed"}
                    label={`سرعت: ${
                      playbackRates.find((item) => item.value === playbackRate)
                        ?.label || "عادی"
                    }`}
                    onToggle={() =>
                      setOpenMenu(openMenu === "speed" ? null : "speed")
                    }
                    onClose={() => setOpenMenu(null)}
                  >
                    {playbackRates.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => selectPlaybackRate(option.value)}
                        className={`w-full rounded-2xl px-3 py-2 text-right transition ${
                          playbackRate === option.value
                            ? "bg-[#38bdf8]/15 text-white"
                            : "text-[#d6e3ea] hover:bg-white/[0.05]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </PlayerMenu>

                  {canUsePictureInPicture ? (
                    <button
                      type="button"
                      onClick={() => void togglePictureInPicture()}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 text-sm text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                    >
                      <span className="relative h-4 w-5 shrink-0 rounded-[4px] border border-current/80">
                        <span className="absolute bottom-[1px] right-[1px] h-1.5 w-2 rounded-[2px] border border-current/80 bg-current/15" />
                      </span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void toggleFullscreen()}
                    className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 px-4 text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                  >
                    {isFullscreen ? (
                      <HiOutlineX className="h-5 w-5" />
                    ) : (
                      <HiOutlineArrowsExpand className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!immersive ? (
        <div className="grid gap-3 md:grid-cols-3" dir="rtl">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#8ea4b3]">
            کنترل سریع
          </p>
          <p className="mt-2 text-sm leading-7 text-[#d6e3ea]">
            Space یا K برای پخش، فلش‌های راست و چپ برای جابه‌جایی ۱۰ ثانیه‌ای، F
            برای تمام‌صفحه و M برای قطع صدا.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#8ea4b3]">
            سازگار با TV
          </p>
          <p className="mt-2 text-sm leading-7 text-[#d6e3ea]">
            دکمه‌ها بزرگ‌تر و focus-friendly هستند تا با ریموت و مرورگرهای
            تلویزیونی هم راحت‌تر کنترل شوند.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#8ea4b3]">
            وضعیت پخش
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm leading-7 text-[#d6e3ea]">
            <HiOutlineRefresh className="mt-1 h-4 w-4 shrink-0 text-[#38bdf8]" />
            {playerError ||
              "در صورت آماده بودن خروجی HLS، پلیر کیفیت را به‌صورت تطبیقی مدیریت می‌کند."}
          </p>
        </div>
        </div>
      ) : null}
    </div>
  );
}

function PlayerMenu({
  label,
  isOpen,
  onToggle,
  onClose,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative" dir="rtl">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-black/35 px-4 text-sm text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
      >
        {label}
      </button>
      {isOpen ? (
        <div className="absolute bottom-[calc(100%+12px)] left-0 z-40 min-w-[240px] rounded-[26px] border border-white/10 bg-[#071119]/95 p-2 shadow-[0_18px_44px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="mb-2 flex items-center justify-between px-2 pt-1 text-xs uppercase tracking-[0.22em] text-[#8ea4b3]">
            <span>{label}</span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#8ea4b3] transition hover:bg-white/[0.05] hover:text-white"
            >
              <HiOutlineX className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
