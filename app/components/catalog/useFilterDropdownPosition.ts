"use client";

import { useCallback, useLayoutEffect, useState, type RefObject } from "react";

export type FilterDropdownPlacement = "bottom" | "top";

export type FilterDropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxWidth: number;
  maxHeight: number;
  placement: FilterDropdownPlacement;
  fitContent: boolean;
};

const VIEWPORT_PADDING = 12;
const PANEL_GAP = 8;

function resolvePanelWidth(minWidth: string, triggerWidth: number): number {
  const viewportMax = Math.max(240, window.innerWidth - VIEWPORT_PADDING * 2);

  if (minWidth.includes("min(")) {
    return Math.min(720, viewportMax, Math.max(triggerWidth, 280));
  }

  const match = minWidth.match(/(\d+(?:\.\d+)?)px/);
  const parsed = match ? Number(match[1]) : 220;

  return Math.min(Math.max(parsed, triggerWidth), viewportMax);
}

function measurePanelWidth(
  panel: HTMLElement | null,
  triggerWidth: number,
  maxWidth: number,
  fitContent: boolean,
  minWidth: string,
): number {
  if (fitContent && panel) {
    const scrollContainer = panel.firstElementChild as HTMLElement | null;
    const naturalWidth = Math.max(
      scrollContainer?.scrollWidth ?? 0,
      panel.scrollWidth,
      panel.offsetWidth,
      triggerWidth,
    );

    return Math.min(naturalWidth, maxWidth);
  }

  return resolvePanelWidth(minWidth, triggerWidth);
}

function clampHorizontalPosition(
  rect: DOMRect,
  panelWidth: number,
): { left: number; width: number } {
  const viewportWidth = window.innerWidth;
  const maxWidth = Math.max(160, viewportWidth - VIEWPORT_PADDING * 2);
  const width = Math.min(Math.max(panelWidth, rect.width), maxWidth);

  // RTL: ترجیحاً لبه راست پنل با لبه راست تریگر هم‌تراز شود.
  let left = rect.right - width;

  if (left < VIEWPORT_PADDING) {
    left = rect.left;
  }

  if (left + width > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - VIEWPORT_PADDING - width;
  }

  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, viewportWidth - width - VIEWPORT_PADDING),
  );

  return { left, width };
}

export function useFilterDropdownPosition({
  open,
  triggerRef,
  panelRef,
  minWidth,
  fitContent = false,
}: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  minWidth: string;
  fitContent?: boolean;
}) {
  const [position, setPosition] = useState<FilterDropdownPosition | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const maxWidth = Math.max(160, window.innerWidth - VIEWPORT_PADDING * 2);
    const panel = panelRef.current;
    const measuredWidth = measurePanelWidth(
      panel,
      rect.width,
      maxWidth,
      fitContent,
      minWidth,
    );
    const { left, width } = clampHorizontalPosition(rect, measuredWidth);
    const panelHeight = panel?.offsetHeight ?? 280;

    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const spaceAbove = rect.top - VIEWPORT_PADDING;
    const openBelow = spaceBelow >= Math.min(panelHeight, 200) || spaceBelow >= spaceAbove;

    if (openBelow) {
      setPosition({
        top: rect.bottom + PANEL_GAP,
        left,
        width,
        maxWidth,
        maxHeight: Math.max(160, spaceBelow - PANEL_GAP),
        placement: "bottom",
        fitContent,
      });
      return;
    }

    setPosition({
      top: Math.max(VIEWPORT_PADDING, rect.top - PANEL_GAP - panelHeight),
      left,
      width,
      maxWidth,
      maxHeight: Math.max(160, spaceAbove - PANEL_GAP),
      placement: "top",
      fitContent,
    });
  }, [fitContent, minWidth, panelRef, triggerRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }

    updatePosition();

    const panel = panelRef.current;
    const observer =
      panel && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updatePosition())
        : null;

    observer?.observe(panel);

    const rafId = window.requestAnimationFrame(() => {
      updatePosition();
      window.requestAnimationFrame(updatePosition);
    });

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, panelRef, updatePosition]);

  return position;
}
