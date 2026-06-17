"use client";

import { useEffect, useRef } from "react";
import { tokenStorage } from "../../../lib/token-storage";
import {
  createDefaultTrackerConfig,
  ProgressTracker,
} from "../services/ProgressTracker";
import { PROGRESS_CONSTANTS, type WatchMediaInfo } from "../services/progress.types";

type UseWatchProgressOptions = {
  media: WatchMediaInfo | null;
  userId: string | null;
  isAuthenticated: boolean;
  enabled: boolean;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onServerResumeSeek?: (time: number) => void;
};

function mediaSessionKey(media: WatchMediaInfo): string {
  const identity = media.slug || media.mediaId;
  return `${identity}:${media.episodeId ?? "movie"}`;
}

export function useWatchProgress({
  media,
  userId,
  isAuthenticated,
  enabled,
  currentTime,
  duration,
  isPlaying,
  onServerResumeSeek,
}: UseWatchProgressOptions) {
  const trackerRef = useRef<ProgressTracker | null>(null);
  const prevTimeRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const sessionKeyRef = useRef<string | null>(null);
  const serverReconcileDoneRef = useRef(false);
  const currentTimeRef = useRef(currentTime);
  const onServerResumeSeekRef = useRef(onServerResumeSeek);

  currentTimeRef.current = currentTime;
  onServerResumeSeekRef.current = onServerResumeSeek;

  useEffect(() => {
    const tracker = ProgressTracker.getInstance();
    tracker.init(
      createDefaultTrackerConfig({
        userId,
        isAuthenticated,
        getAuthToken: () => tokenStorage.getToken(),
      }),
    );
    trackerRef.current = tracker;
  }, [userId, isAuthenticated]);

  useEffect(() => {
    return () => {
      trackerRef.current?.end();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !media) {
      return;
    }

    const sessionKey = mediaSessionKey(media);
    const isNewSession = sessionKeyRef.current !== sessionKey;

    if (isNewSession) {
      sessionKeyRef.current = sessionKey;
      wasPlayingRef.current = false;
      prevTimeRef.current = 0;
      serverReconcileDoneRef.current = false;
    }

    const tracker = trackerRef.current ?? ProgressTracker.getInstance();
    tracker.attachMedia(media);
  }, [enabled, media?.slug, media?.mediaId, media?.episodeId]);

  useEffect(() => {
    if (!enabled || !media || !isAuthenticated || serverReconcileDoneRef.current) {
      return;
    }

    serverReconcileDoneRef.current = true;
    const tracker = trackerRef.current ?? ProgressTracker.getInstance();

    void tracker.reconcileResume().then((decision) => {
      if (decision.source !== "server") {
        return;
      }

      const localTime = currentTimeRef.current;
      if (
        decision.resumeTime >
        localTime + PROGRESS_CONSTANTS.RECONCILE_TOLERANCE_SECONDS
      ) {
        onServerResumeSeekRef.current?.(decision.resumeTime);
      }
    });
  }, [enabled, isAuthenticated, media?.slug, media?.mediaId, media?.episodeId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tracker = trackerRef.current;
    if (!tracker || !media) {
      return;
    }

    if (duration > 0) {
      tracker.updateDuration(duration);
    }
  }, [duration, enabled, media?.slug, media?.mediaId, media?.episodeId]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tracker = trackerRef.current;
    if (!tracker || !media) {
      return;
    }

    if (isPlaying) {
      wasPlayingRef.current = true;
    }

    const delta = Math.abs(currentTime - prevTimeRef.current);

    if (delta > 2 && wasPlayingRef.current) {
      tracker.seek(currentTime);
    } else if (isPlaying) {
      tracker.tick(currentTime, duration);
    } else if (wasPlayingRef.current) {
      tracker.pause();
      wasPlayingRef.current = false;
    }

    prevTimeRef.current = currentTime;
  }, [currentTime, duration, enabled, isPlaying, media]);
}
