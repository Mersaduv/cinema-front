"use client";

import { useEffect, useRef } from "react";
import { recordContentView } from "../../../lib/content-views";
import { type WatchMediaInfo } from "../services/progress.types";

type UseRecordContentViewOptions = {
  media: WatchMediaInfo | null;
  currentTime: number;
  isPlaying: boolean;
  enabled: boolean;
};

function mediaSessionKey(media: WatchMediaInfo): string {
  return `${media.mediaType}:${media.mediaId}`;
}

/**
 * Registers a "view" after meaningful watch time (10s).
 *
 * Count rule requested:
 * - each distinct watch segment (pause/resume/restart) can increment once
 * - if the same device/viewer watches again later, it must increment again
 */
export function useRecordContentView({
  media,
  currentTime,
  isPlaying,
  enabled,
}: UseRecordContentViewOptions) {
  const sessionKeyRef = useRef<string | null>(null);
  const segmentStartTimeRef = useRef<number | null>(null);
  const segmentReachedRef = useRef(false);
  const lastIsPlayingRef = useRef(false);
  const viewSessionIdRef = useRef<string | null>(null);

  const newViewSessionId = () => {
    try {
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
      }
    } catch {
      // ignore
    }

    return `vs_${Date.now()}_${Math.random().toString(16).slice(2)}`.slice(
      0,
      64,
    );
  };

  const resetForNewMedia = () => {
    segmentStartTimeRef.current = null;
    segmentReachedRef.current = false;
    lastIsPlayingRef.current = false;
    viewSessionIdRef.current = null;
  };

  useEffect(() => {
    if (!enabled || !media) {
      return;
    }

    const sessionKey = mediaSessionKey(media);
    if (sessionKeyRef.current !== sessionKey) {
      sessionKeyRef.current = sessionKey;
      resetForNewMedia();
    }

    if (!isPlaying) {
      lastIsPlayingRef.current = false;
      resetForNewMedia();
      return;
    }

    // New playback segment starts when `isPlaying` toggles false -> true.
    if (lastIsPlayingRef.current === false) {
      lastIsPlayingRef.current = true;
      segmentStartTimeRef.current = currentTime;
      segmentReachedRef.current = false;
      viewSessionIdRef.current = newViewSessionId();
    }

    if (segmentReachedRef.current) {
      return;
    }

    if (segmentStartTimeRef.current === null || !viewSessionIdRef.current) {
      return;
    }

    // If user seeks back significantly while playing, treat it as a new segment.
    if (currentTime + 1 < segmentStartTimeRef.current) {
      segmentStartTimeRef.current = currentTime;
      segmentReachedRef.current = false;
      viewSessionIdRef.current = newViewSessionId();
    }

    const elapsed = currentTime - segmentStartTimeRef.current;
    if (elapsed >= 10) {
      segmentReachedRef.current = true;

      void recordContentView({
        media_type: media.mediaType,
        media_id: Number(media.mediaId),
        watch_seconds: Math.floor(elapsed),
        view_session_id: viewSessionIdRef.current,
      });
    }

  }, [currentTime, enabled, isPlaying, media]);
}
