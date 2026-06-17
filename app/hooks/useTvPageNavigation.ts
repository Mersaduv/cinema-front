"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  arrowKeyToDirection,
  findGridFocusTarget,
  findPaginationFocusTarget,
  findSpatialFocusTarget,
  focusFirstInRoot,
  getFocusGroupScope,
  getFocusableElements,
  isActivateKey,
  isArrowKey,
  isBackKey,
  TV_FOCUSABLE_SELECTOR,
} from "../lib/tv/focus";

type UseTvPageNavigationOptions = {
  enabled?: boolean;
  onBack?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  initialFocusSelector?: string;
  autoFocus?: boolean;
};

/**
 * D-pad spatial focus navigation for public (non-player) pages.
 */
export function useTvPageNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseTvPageNavigationOptions = {},
) {
  const router = useRouter();
  const {
    enabled = true,
    onBack,
    initialFocusRef,
    initialFocusSelector,
    autoFocus = false,
  } = options;
  const didAutoFocus = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const root = containerRef.current;

    if (!root) {
      return;
    }

    if (autoFocus && !didAutoFocus.current) {
      const timer = window.setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
          didAutoFocus.current = true;
          return;
        }

        if (initialFocusSelector) {
          const target = root.querySelector<HTMLElement>(initialFocusSelector);

          if (target) {
            target.focus();
            didAutoFocus.current = true;
            return;
          }
        }

        if (focusFirstInRoot(root)) {
          didAutoFocus.current = true;
        }
      }, 120);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [autoFocus, containerRef, enabled, initialFocusRef, initialFocusSelector]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const root = containerRef.current;

    if (!root) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (isBackKey(event)) {
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
          return;
        }

        event.preventDefault();

        if (onBack) {
          onBack();
        } else {
          router.back();
        }

        return;
      }

      if (!target || !root.contains(target)) {
        return;
      }

      if (isActivateKey(event)) {
        const interactive =
          target.closest<HTMLElement>("[data-tv-focusable]") ??
          (target.tagName === "BUTTON" || target.tagName === "A" ? target : null);

        if (interactive && interactive !== target && target.tagName === "A") {
          return;
        }

        if (
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.getAttribute("role") === "tab" ||
          target.getAttribute("role") === "option" ||
          target.hasAttribute("data-tv-focusable")
        ) {
          event.preventDefault();
          target.click();
        }

        return;
      }

      if (!isArrowKey(event)) {
        return;
      }

      const direction = arrowKeyToDirection(event.key);

      if (!direction) {
        return;
      }

      const scope = getFocusGroupScope(target, root);
      const isTabGroup = scope.hasAttribute("data-tv-focus-group");

      if (isTabGroup && (direction === "up" || direction === "down")) {
        if (scope.getAttribute("data-tv-focus-group") !== "pagination") {
          return;
        }
      }

      if (
        isTabGroup &&
        scope.getAttribute("data-tv-focus-group") === "tabs" &&
        direction !== "left" &&
        direction !== "right"
      ) {
        return;
      }

      const paginationRoot = target.closest<HTMLElement>('[data-tv-focus-group="pagination"]');

      if (paginationRoot && root.contains(paginationRoot)) {
        const gridRoot = root.querySelector<HTMLElement>('[data-tv-grid="poster"]');
        const pagNext = findPaginationFocusTarget(
          target,
          direction,
          paginationRoot,
          gridRoot,
        );

        if (pagNext) {
          event.preventDefault();
          pagNext.focus();
          return;
        }
      }

      const gridRoot = target.closest<HTMLElement>("[data-tv-grid]");

      if (gridRoot && gridRoot.contains(target) && target.hasAttribute("data-tv-grid-item")) {
        const gridNext = findGridFocusTarget(target, direction, gridRoot);

        if (gridNext) {
          event.preventDefault();
          gridNext.focus();
          gridNext.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          return;
        }
      }

      const items = getFocusableElements(scope, TV_FOCUSABLE_SELECTOR);

      if (items.length === 0) {
        return;
      }

      const next = findSpatialFocusTarget(target, direction, items);

      if (!next) {
        if (direction === "down" || direction === "right") {
          const currentIndex = items.indexOf(target);

          if (currentIndex >= 0 && currentIndex < items.length - 1) {
            event.preventDefault();
            items[currentIndex + 1]?.focus();
          }
        }

        return;
      }

      event.preventDefault();
      event.stopPropagation();
      next.focus();

      if (next.hasAttribute("data-tv-carousel-item")) {
        next.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    };

    root.addEventListener("keydown", handler, true);
    return () => root.removeEventListener("keydown", handler, true);
  }, [containerRef, enabled, onBack, router]);
}
