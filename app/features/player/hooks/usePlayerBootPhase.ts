"use client";

import { useEffect, useState } from "react";

export type PlayerBootPhase = "stream" | "controls" | "progress";

/**
 * Staged player boot — stream first, then controls, then progress/memory.
 * Do not unlock controls on isPlaying alone: autoplay can flip playing
 * before the first frame, which briefly shows Pause instead of loading.
 */
export function usePlayerBootPhase(
  isReady: boolean,
  _isPlaying: boolean,
  videoRef?: React.RefObject<HTMLVideoElement | null>,
) {
  const [phase, setPhase] = useState<PlayerBootPhase>("stream");

  useEffect(() => {
    if (phase !== "stream") {
      return;
    }

    if (isReady) {
      setPhase("controls");
    }
  }, [isReady, phase]);

  useEffect(() => {
    if (phase !== "controls") {
      return;
    }

    const advance = () => setPhase("progress");

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(advance, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(advance, 2500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "controls") {
      return;
    }

    const video = videoRef?.current;
    if (!video) {
      return;
    }

    const onTimeUpdate = () => {
      if (video.currentTime > 1) {
        setPhase("progress");
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [phase, videoRef]);

  return {
    phase,
    controlsEnabled: phase !== "stream",
    // Start persisting as soon as controls unlock so Back → Continue Watching
    // always has a fresh local resume point without requiring a home refresh.
    progressEnabled: phase !== "stream",
  };
}
