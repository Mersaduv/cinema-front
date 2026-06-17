export type TvFocusDirection = "up" | "down" | "left" | "right";

export const TV_FOCUSABLE_SELECTOR =
  '[data-tv-focusable], [data-player-controls], [data-player-menu-item], a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

export const TV_FOCUS_RING_CLASS =
  "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]";

export const TV_CARD_FOCUS_CLASS =
  "focus-within:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100";

export function isBackKey(event: KeyboardEvent): boolean {
  return (
    event.key === "Escape" ||
    event.key === "BrowserBack" ||
    event.key === "GoBack" ||
    event.keyCode === 461 ||
    event.keyCode === 10009 ||
    event.keyCode === 4
  );
}

export function isActivateKey(event: KeyboardEvent): boolean {
  return (
    event.key === "Enter" ||
    event.key === " " ||
    event.keyCode === 13 ||
    event.keyCode === 32
  );
}

export function isArrowKey(event: KeyboardEvent): boolean {
  return (
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight" ||
    event.key === "ArrowUp" ||
    event.key === "ArrowDown"
  );
}

export function arrowKeyToDirection(key: string): TvFocusDirection | null {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    default:
      return null;
  }
}

export function isFocusableElement(element: HTMLElement): boolean {
  if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  const tabIndex = element.tabIndex;

  if (tabIndex < 0 && element.tagName !== "A" && element.tagName !== "BUTTON") {
    return false;
  }

  const style = window.getComputedStyle(element);

  if (style.visibility === "hidden" || style.display === "none") {
    return false;
  }

  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

export function getFocusableElements(
  root: HTMLElement,
  selector = TV_FOCUSABLE_SELECTOR,
): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(isFocusableElement);
}

const ROW_TOLERANCE_PX = 14;

/**
 * Cluster grid items into rows sorted left→right (screen coordinates; RTL-safe).
 */
export function clusterGridRows(items: HTMLElement[]): HTMLElement[][] {
  if (items.length === 0) {
    return [];
  }

  const sorted = [...items].sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    const dy = ra.top - rb.top;

    if (Math.abs(dy) > ROW_TOLERANCE_PX) {
      return dy;
    }

    return ra.left - rb.left;
  });

  const rows: HTMLElement[][] = [];

  for (const item of sorted) {
    const top = item.getBoundingClientRect().top;
    const lastRow = rows[rows.length - 1];

    if (!lastRow || Math.abs(top - lastRow[0]!.getBoundingClientRect().top) > ROW_TOLERANCE_PX) {
      rows.push([item]);
      continue;
    }

    lastRow.push(item);
  }

  for (const row of rows) {
    row.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
  }

  return rows;
}

export function inferGridColumns(gridRoot: HTMLElement): number {
  const explicit = gridRoot.getAttribute("data-tv-cols");

  if (explicit) {
    const parsed = Number.parseInt(explicit, 10);

    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const items = getFocusableElements(gridRoot).filter((el) =>
    el.hasAttribute("data-tv-grid-item"),
  );

  const rows = clusterGridRows(items);

  return rows[0]?.length ?? 1;
}

function locateInGrid(
  current: HTMLElement,
  gridRoot: HTMLElement,
): { rows: HTMLElement[][]; row: number; col: number } | null {
  const items = getFocusableElements(gridRoot).filter((el) =>
    el.hasAttribute("data-tv-grid-item"),
  );
  const rows = clusterGridRows(items);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const colIndex = rows[rowIndex]!.indexOf(current);

    if (colIndex >= 0) {
      return { rows, row: rowIndex, col: colIndex };
    }
  }

  return null;
}

/**
 * Row×column grid navigation (Up/Down change row, Left/Right move within row by screen position).
 */
export function findGridFocusTarget(
  current: HTMLElement,
  direction: TvFocusDirection,
  gridRoot: HTMLElement,
): HTMLElement | null {
  const located = locateInGrid(current, gridRoot);

  if (!located) {
    const items = getFocusableElements(gridRoot).filter((el) =>
      el.hasAttribute("data-tv-grid-item"),
    );

    return findSpatialFocusTarget(current, direction, items);
  }

  const { rows, row, col } = located;
  const currentRow = rows[row]!;

  switch (direction) {
    case "left": {
      if (col > 0) {
        return currentRow[col - 1] ?? null;
      }

      return null;
    }
    case "right": {
      if (col < currentRow.length - 1) {
        return currentRow[col + 1] ?? null;
      }

      return null;
    }
    case "up": {
      if (row > 0) {
        const targetRow = rows[row - 1]!;
        return targetRow[Math.min(col, targetRow.length - 1)] ?? null;
      }

      return null;
    }
    case "down": {
      if (row < rows.length - 1) {
        const targetRow = rows[row + 1]!;
        return targetRow[Math.min(col, targetRow.length - 1)] ?? null;
      }

      const pagination = gridRoot.parentElement?.querySelector<HTMLElement>(
        '[data-tv-focus-group="pagination"]',
      );

      if (pagination) {
        const pagItems = getFocusableElements(pagination);

        if (pagItems[0]) {
          return pagItems[0]!;
        }
      }

      return null;
    }
    default:
      return null;
  }
}

export function findPaginationFocusTarget(
  current: HTMLElement,
  direction: TvFocusDirection,
  paginationRoot: HTMLElement,
  gridRoot: HTMLElement | null,
): HTMLElement | null {
  const items = getFocusableElements(paginationRoot);
  const index = items.indexOf(current);

  if (index === -1) {
    return null;
  }

  if (direction === "left" && index > 0) {
    return items[index - 1] ?? null;
  }

  if (direction === "right" && index < items.length - 1) {
    return items[index + 1] ?? null;
  }

  if (direction === "up" && gridRoot) {
    const gridItems = getFocusableElements(gridRoot).filter((el) =>
      el.hasAttribute("data-tv-grid-item"),
    );
    const rows = clusterGridRows(gridItems);
    const lastRow = rows[rows.length - 1];

    if (lastRow?.length) {
      return lastRow[Math.min(index, lastRow.length - 1)] ?? lastRow[0] ?? null;
    }
  }

  return null;
}

function getCenter(rect: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Spatial D-pad navigation using screen coordinates (works correctly in RTL layouts).
 */
export function findSpatialFocusTarget(
  current: HTMLElement,
  direction: TvFocusDirection,
  candidates: HTMLElement[],
): HTMLElement | null {
  const currentRect = current.getBoundingClientRect();
  const currentCenter = getCenter(currentRect);
  const alignmentThreshold = Math.min(currentRect.width, currentRect.height) * 0.45;

  let best: { element: HTMLElement; score: number } | null = null;

  for (const candidate of candidates) {
    if (candidate === current) {
      continue;
    }

    const rect = candidate.getBoundingClientRect();
    const center = getCenter(rect);
    const dx = center.x - currentCenter.x;
    const dy = center.y - currentCenter.y;

    switch (direction) {
      case "right":
        if (dx <= 4) {
          continue;
        }
        break;
      case "left":
        if (dx >= -4) {
          continue;
        }
        break;
      case "down":
        if (dy <= 4) {
          continue;
        }
        break;
      case "up":
        if (dy >= -4) {
          continue;
        }
        break;
    }

    const primary =
      direction === "left" || direction === "right" ? Math.abs(dx) : Math.abs(dy);
    const secondary =
      direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);

    if (secondary > alignmentThreshold + Math.max(currentRect.height, rect.height)) {
      continue;
    }

    const score = primary * 1000 + secondary;

    if (!best || score < best.score) {
      best = { element: candidate, score };
    }
  }

  return best?.element ?? null;
}

export function getFocusGroupScope(
  target: HTMLElement,
  root: HTMLElement,
): HTMLElement {
  const group = target.closest<HTMLElement>("[data-tv-focus-group]");

  if (group && root.contains(group)) {
    return group;
  }

  return root;
}

export function focusFirstInRoot(root: HTMLElement, selector = TV_FOCUSABLE_SELECTOR): boolean {
  const items = getFocusableElements(root, selector);

  if (items.length === 0) {
    return false;
  }

  items[0].focus();
  return true;
}

export const DETAIL_PLAY_FOCUS_KEY = "cinema-detail-play-focus";
