"use client";

import { useEffect } from "react";

type KeyboardActions = {
  togglePlay: () => void;
  seekBy: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  toggleSubtitles: () => void;
  nextEpisode?: () => void;
  onBack?: () => void;
  volume: number;
  controlsVisible?: boolean;
  menuOpen?: boolean;
};

import { isBackKey } from "../../../lib/tv/focus";
function isMediaPlayKey(event: KeyboardEvent): boolean {
  return event.key === "MediaPlayPause" || event.key === "MediaPlay" || event.keyCode === 415;
}

function isMediaPauseKey(event: KeyboardEvent): boolean {
  return event.key === "MediaPause" || event.keyCode === 19;
}

function isInsidePlayerControls(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("[data-player-controls]"))
  );
}

/**
 * Keyboard and TV remote shortcuts for the player container.
 */
export function usePlayerKeyboard(
  containerRef: React.RefObject<HTMLElement | null>,
  actions: KeyboardActions,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const node = containerRef.current;
    if (!node) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isBackKey(event)) {
        event.preventDefault();
        actions.onBack?.();
        return;
      }

      if (isMediaPlayKey(event)) {
        event.preventDefault();
        actions.togglePlay();
        return;
      }

      if (isMediaPauseKey(event)) {
        event.preventDefault();
        actions.togglePlay();
        return;
      }

      const key = event.key.toLowerCase();
      const inControls = isInsidePlayerControls(target);
      const seekWithArrows =
        !inControls || !actions.controlsVisible || actions.menuOpen;

      if (event.key === " " || key === "k") {
        event.preventDefault();
        actions.togglePlay();
        return;
      }

      if (event.key === "ArrowRight" && seekWithArrows) {
        event.preventDefault();
        actions.seekBy(10);
        return;
      }

      if (event.key === "ArrowLeft" && seekWithArrows) {
        event.preventDefault();
        actions.seekBy(-10);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        actions.setVolume(Math.min(1, actions.volume + 0.1));
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        actions.setVolume(Math.max(0, actions.volume - 0.1));
        return;
      }

      if (key === "f") {
        event.preventDefault();
        actions.toggleFullscreen();
        return;
      }

      if (key === "m") {
        event.preventDefault();
        actions.toggleMute();
        return;
      }

      if (key === "c") {
        event.preventDefault();
        actions.toggleSubtitles();
        return;
      }

      if (key === "n" && actions.nextEpisode) {
        event.preventDefault();
        actions.nextEpisode();
      }
    };

    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
  }, [actions, containerRef, enabled]);
}
