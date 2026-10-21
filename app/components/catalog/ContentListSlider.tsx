"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { arrowKeyToDirection, isArrowKey } from "../../lib/tv/focus";
import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";

export const SLIDER_SLIDE_CLASS =
  "shrink-0 snap-start w-[46%] min-w-[132px] max-w-[168px] sm:w-[31%] sm:max-w-[184px] md:w-[24%] md:max-w-[196px] lg:w-[19%] lg:max-w-[208px] xl:w-[16%] xl:max-w-[220px] 2xl:w-[14%] 2xl:max-w-[232px]";

const DRAG_THRESHOLD_PX = 8;
const TOUCH_TAP_SLOP_PX = 12;
const TOUCH_SCROLL_SLOP_PX = 6;
/** iOS can synthesize click after snap/momentum settles — keep suppress longer. */
const CLICK_SUPPRESS_MS = 450;

type ContentListSliderProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  step?: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  active: boolean;
  moved: boolean;
};

type TouchGuard = {
  scrollLeft: number;
  x: number;
  y: number;
  href: string | null;
  moved: boolean;
};

function getSlides(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-slider-slide]"));
}

function getScrollState(element: HTMLElement): {
  hasOverflow: boolean;
  canScrollStart: boolean;
  canScrollEnd: boolean;
} {
  const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);

  if (maxScroll <= 8) {
    return { hasOverflow: false, canScrollStart: false, canScrollEnd: false };
  }

  const isRtl = getComputedStyle(element).direction === "rtl";
  let offset = 0;

  if (isRtl) {
    if (element.scrollLeft <= 0) {
      offset = Math.abs(element.scrollLeft);
    } else {
      offset = maxScroll - element.scrollLeft;
    }
  } else {
    offset = element.scrollLeft;
  }

  return {
    hasOverflow: true,
    canScrollStart: offset > 8,
    canScrollEnd: offset < maxScroll - 8,
  };
}

function getVisibleIndexRange(
  slides: HTMLElement[],
  containerRect: DOMRect,
): { first: number; last: number } {
  let first = -1;
  let last = -1;

  slides.forEach((slide, index) => {
    const rect = slide.getBoundingClientRect();

    if (rect.right <= containerRect.left + 2 || rect.left >= containerRect.right - 2) {
      return;
    }

    if (first === -1) {
      first = index;
    }

    last = index;
  });

  return { first, last };
}

function resolveLinkHref(node: EventTarget | null): string | null {
  if (!(node instanceof Element)) {
    return null;
  }

  const anchor = node.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) {
    return null;
  }

  // Prefer path for Next client navigation; keep query/hash.
  try {
    const url = new URL(anchor.href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return url.href;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return anchor.getAttribute("href");
  }
}

export default function ContentListSlider({
  children,
  className = "",
  ariaLabel,
  step = 3,
  containerRef,
}: ContentListSliderProps) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const touchGuardRef = useRef<TouchGuard | null>(null);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isTvCompat = useIsTvCompat();

  const setTrackRef = useCallback(
    (node: HTMLDivElement | null) => {
      trackRef.current = node;
      if (containerRef) {
        containerRef.current = node;
      }
    },
    [containerRef],
  );

  const armClickSuppress = useCallback((ms = CLICK_SUPPRESS_MS) => {
    suppressClickRef.current = true;
    window.clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
    }, ms);
  }, []);

  const updateScrollState = useCallback(() => {
    const element = trackRef.current;

    if (!element) {
      return;
    }

    const state = getScrollState(element);

    setHasOverflow(state.hasOverflow);
    setCanScrollStart(state.canScrollStart);
    setCanScrollEnd(state.canScrollEnd);
  }, []);

  useEffect(() => {
    updateScrollState();

    const element = trackRef.current;

    if (!element) {
      return undefined;
    }

    const preventNativeDrag = (event: DragEvent) => {
      event.preventDefault();
    };

    element.addEventListener("scroll", updateScrollState, { passive: true });
    element.addEventListener("dragstart", preventNativeDrag);
    window.addEventListener("resize", updateScrollState);

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(element);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      element.removeEventListener("dragstart", preventNativeDrag);
      window.removeEventListener("resize", updateScrollState);
      observer.disconnect();
      window.clearTimeout(suppressTimerRef.current);
    };
  }, [updateScrollState, children]);

  const scrollByPage = useCallback(
    (direction: "start" | "end") => {
      const element = trackRef.current;

      if (!element) {
        return;
      }

      const slides = getSlides(element);

      if (slides.length === 0) {
        return;
      }

      const containerRect = element.getBoundingClientRect();
      const { first, last } = getVisibleIndexRange(slides, containerRect);
      const safeFirst = first === -1 ? 0 : first;
      const safeLast = last === -1 ? slides.length - 1 : last;

      const targetIndex =
        direction === "end"
          ? Math.min(slides.length - 1, safeLast + step)
          : Math.max(0, safeFirst - step);

      slides[targetIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });

      window.setTimeout(updateScrollState, 320);
    },
    [step, updateScrollState],
  );

  useEffect(() => {
    if (!isTvCompat) {
      return;
    }

    const element = trackRef.current;

    if (!element) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (!isArrowKey(event)) {
        return;
      }

      const target = event.target as HTMLElement | null;

      if (!target || !element.contains(target)) {
        return;
      }

      const slide = target.closest<HTMLElement>("[data-slider-slide]");

      if (!slide) {
        return;
      }

      const direction = arrowKeyToDirection(event.key);

      if (direction !== "left" && direction !== "right") {
        return;
      }

      event.preventDefault();
      scrollByPage(direction === "right" ? "end" : "start");
    };

    element.addEventListener("keydown", handler);
    return () => element.removeEventListener("keydown", handler);
  }, [isTvCompat, scrollByPage]);

  const resetDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const element = trackRef.current;
      const drag = dragRef.current;

      if (!element || !drag) {
        return;
      }

      if (drag.moved) {
        armClickSuppress();
      }

      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }

      dragRef.current = null;
      setIsDragging(false);
      element.style.scrollSnapType = "";
      window.setTimeout(updateScrollState, 50);
    },
    [armClickSuppress, updateScrollState],
  );

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    // Touch: native overflow scrolling only — JS drag hangs on mobile.
    if (event.pointerType === "touch" || event.button !== 0) {
      return;
    }

    const element = trackRef.current;

    if (!element) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: element.scrollLeft,
      active: false,
      moved: false,
    };
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const element = trackRef.current;
    const drag = dragRef.current;

    if (!element || !drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.active) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX && Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }

      // Vertical intent → let the page scroll; do not capture the pointer.
      if (Math.abs(deltaY) >= Math.abs(deltaX) * 0.85) {
        dragRef.current = null;
        return;
      }

      drag.active = true;
      drag.moved = true;
      element.setPointerCapture(event.pointerId);
      element.style.scrollSnapType = "none";
      setIsDragging(true);
    }

    event.preventDefault();
    drag.moved = true;
    element.scrollLeft = drag.startScrollLeft - deltaX;
  }, []);

  const handleTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    const element = trackRef.current;
    const touch = event.touches[0];

    if (!element || !touch) {
      return;
    }

    touchGuardRef.current = {
      scrollLeft: element.scrollLeft,
      x: touch.clientX,
      y: touch.clientY,
      href: resolveLinkHref(event.target),
      moved: false,
    };
  }, []);

  const handleTouchMove = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    const guard = touchGuardRef.current;
    const touch = event.touches[0];

    if (!guard || !touch || guard.moved) {
      return;
    }

    if (
      Math.abs(touch.clientX - guard.x) > TOUCH_TAP_SLOP_PX ||
      Math.abs(touch.clientY - guard.y) > TOUCH_TAP_SLOP_PX
    ) {
      guard.moved = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const element = trackRef.current;
    const guard = touchGuardRef.current;

    if (!element || !guard) {
      return;
    }

    const scrollDelta = Math.abs(element.scrollLeft - guard.scrollLeft);

    // Swipe or snap/momentum scroll — block the subsequent synthetic click.
    if (guard.moved || scrollDelta > TOUCH_SCROLL_SLOP_PX) {
      armClickSuppress();
    }
  }, [armClickSuppress]);

  const handleClickCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (suppressClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const element = trackRef.current;
      const guard = touchGuardRef.current;

      if (!element || !guard) {
        return;
      }

      const scrollDelta = Math.abs(element.scrollLeft - guard.scrollLeft);
      const clickHref = resolveLinkHref(event.target);

      // Horizontal fling / snap jump under the finger → do not navigate.
      if (guard.moved || scrollDelta > TOUCH_SCROLL_SLOP_PX) {
        event.preventDefault();
        event.stopPropagation();
        armClickSuppress();
        touchGuardRef.current = null;
        return;
      }

      // iOS Safari: click target can differ from the card that received touchstart.
      if (guard.href && clickHref && guard.href !== clickHref) {
        event.preventDefault();
        event.stopPropagation();
        touchGuardRef.current = null;
        armClickSuppress(200);

        if (guard.href.startsWith("http://") || guard.href.startsWith("https://")) {
          window.location.assign(guard.href);
        } else {
          router.push(guard.href);
        }
        return;
      }

      touchGuardRef.current = null;
    },
    [armClickSuppress, router],
  );

  const navShellClass =
    "pointer-events-none absolute top-0 z-30 flex h-full w-14 items-center justify-center opacity-0 transition-all duration-300 group-hover/slider:pointer-events-auto group-hover/slider:opacity-100";

  const navButtonInnerClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/80 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100";

  return (
    <div
      className={`group/slider relative overflow-visible ${className}`}
      dir="rtl"
      role="region"
      aria-label={ariaLabel}
    >
      <div
        ref={setTrackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={resetDrag}
        onPointerCancel={resetDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClickCapture={handleClickCapture}
        className={[
          // snap-proximity on small screens avoids iOS mandatory-snap jump under the finger.
          "flex gap-4 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-proximity md:snap-mandatory [&::-webkit-scrollbar]:hidden",
          "[-webkit-overflow-scrolling:touch] [scroll-behavior:auto] md:[scroll-behavior:smooth]",
          "[&_a]:touch-manipulation [&_img]:pointer-events-none [&_img]:select-none [&_img]:[-webkit-user-drag:none]",
          isDragging ? "cursor-grabbing select-none" : "cursor-grab",
        ].join(" ")}
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
      >
        {children}
      </div>

      {hasOverflow ? (
        <>
          <div
            className={`${navShellClass} right-0 justify-end bg-gradient-to-l from-black via-black/85 to-transparent pr-0.5`}
          >
            <button
              type="button"
              aria-label="مشاهده موارد قبلی"
              data-tv-focusable
              disabled={!canScrollStart}
              onClick={() => scrollByPage("start")}
              className={`${navButtonInnerClass} ${TV_FOCUS_RING_CLASS}`}
            >
              <HiChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div
            className={`${navShellClass} left-0 justify-start bg-gradient-to-r from-black via-black/85 to-transparent pl-0.5`}
          >
            <button
              type="button"
              aria-label="مشاهده موارد بعدی"
              data-tv-focusable
              disabled={!canScrollEnd}
              onClick={() => scrollByPage("end")}
              className={`${navButtonInnerClass} ${TV_FOCUS_RING_CLASS}`}
            >
              <HiChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
