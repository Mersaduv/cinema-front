"use client";

import { useEffect } from "react";

type MediaSessionActions = {
  title?: string;
  poster?: string | null;
  isPlaying: boolean;
  togglePlay: () => void;
  seekBy: (seconds: number) => void;
  enabled?: boolean;
};

/**
 * Wires OS / TV media keys through the Media Session API.
 */
export function useMediaSession({
  title,
  poster,
  isPlaying,
  togglePlay,
  seekBy,
  enabled = true,
}: MediaSessionActions) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    const session = navigator.mediaSession;

    try {
      session.metadata = new MediaMetadata({
        title: title || "Cinema",
        artist: "Cinema",
        artwork: poster
          ? [{ src: poster, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
    } catch {
      // Metadata is optional on some TV browsers.
    }

    session.playbackState = isPlaying ? "playing" : "paused";

    const setHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Some TV browsers only support a subset of actions.
      }
    };

    setHandler("play", () => {
      if (!isPlaying) {
        togglePlay();
      }
    });

    setHandler("pause", () => {
      if (isPlaying) {
        togglePlay();
      }
    });

    setHandler("seekbackward", () => seekBy(-10));
    setHandler("seekforward", () => seekBy(10));

    return () => {
      setHandler("play", null);
      setHandler("pause", null);
      setHandler("seekbackward", null);
      setHandler("seekforward", null);
    };
  }, [enabled, isPlaying, poster, seekBy, title, togglePlay]);
}
