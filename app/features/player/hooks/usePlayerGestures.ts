"use client";

import { useCallback, useRef } from "react";
import { clamp } from "../utils/format";
import { isPlayerChromeTarget } from "../utils/gesture-target";

type GestureActions = {
  pause: () => void;
  isPlaying: boolean;
  seekBy: (seconds: number) => void;
  setVolume: (volume: number) => void;
  volume: number;
  revealControls: () => void;
  toggleControls: () => void;
};

/**
 * Touch gestures: double-tap seek, vertical swipe volume, single-tap toggle controls.
 */
export function usePlayerGestures(actions: GestureActions, enabled = true) {
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || isPlayerChromeTarget(event.target)) {
        return;
      }

      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent, containerWidth: number) => {
      if (!enabled || isPlayerChromeTarget(event.target)) {
        touchStartRef.current = null;
        return;
      }

      const touch = event.changedTouches[0];
      const start = touchStartRef.current;
      if (!start) {
        return;
      }

      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const dt = Date.now() - start.time;

      if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) && dt < 500) {
        const delta = dy < 0 ? 0.05 : -0.05;
        actions.setVolume(clamp(actions.volume + delta, 0, 1));
        actions.revealControls();
        touchStartRef.current = null;
        return;
      }

      if (dt < 300 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        const now = Date.now();
        const last = lastTapRef.current;

        if (last && now - last.time < 350) {
          const isLeft = touch.clientX < containerWidth / 2;
          actions.seekBy(isLeft ? -10 : 10);
          actions.revealControls();
          lastTapRef.current = null;
        } else {
          lastTapRef.current = { time: now, x: touch.clientX };
          window.setTimeout(() => {
            if (lastTapRef.current?.time === now) {
              actions.toggleControls();
              lastTapRef.current = null;
            }
          }, 320);
        }
      }

      touchStartRef.current = null;
    },
    [actions, enabled],
  );

  return { onTouchStart, onTouchEnd };
}
