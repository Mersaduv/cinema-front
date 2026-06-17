"use client";

import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore";
import {
  arrowKeyToDirection,
  findSpatialFocusTarget,
  getFocusGroupScope,
  getFocusableElements,
  isActivateKey,
  isArrowKey,
  TV_FOCUSABLE_SELECTOR,
} from "../../../lib/tv/focus";

/**
 * D-pad / 5-way focus navigation inside player controls (webOS, Tizen, Android TV).
 */
export function useTvFocusNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  controlsRef: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  const isTv = usePlayerStore((state) => state.isTv);

  useEffect(() => {
    if (!enabled || !isTv) {
      return;
    }

    const root = containerRef.current;
    if (!root) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (!isArrowKey(event) && !isActivateKey(event)) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target || !root.contains(target)) {
        return;
      }

      if (isActivateKey(event)) {
        if (target.tagName === "BUTTON" || target.getAttribute("role") === "option") {
          event.preventDefault();
          target.click();
        }
        return;
      }

      const direction = arrowKeyToDirection(event.key);

      if (!direction) {
        return;
      }

      const scope = controlsRef.current?.contains(target)
        ? controlsRef.current
        : getFocusGroupScope(target, root);
      const items = getFocusableElements(scope, TV_FOCUSABLE_SELECTOR);

      if (items.length === 0) {
        return;
      }

      const next = findSpatialFocusTarget(target, direction, items);

      if (!next) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      next.focus();
    };

    root.addEventListener("keydown", handler);
    return () => root.removeEventListener("keydown", handler);
  }, [containerRef, controlsRef, enabled, isTv]);
}
