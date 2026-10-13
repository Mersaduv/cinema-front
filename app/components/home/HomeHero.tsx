"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  HiChevronLeft,
  HiChevronRight,
  HiMiniInformationCircle,
  HiMiniPlay,
} from "react-icons/hi2";
import { BackdropImage, PosterImage } from "../images";
import {
  buildFeaturedDetailHref,
  buildFeaturedWatchHref,
  formatFeaturedMetadata,
  HOME_FEATURED_SLIDES,
  type FeaturedCatalogItem,
} from "../../lib/catalog/home";
import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import {
  viewerPrimaryButtonLgClass,
  VIEWER_ACCENT,
} from "../../lib/viewer-theme";

const AUTO_INTERVAL_MS = 8000;
const SWIPE_MIN_PX = 56;
const SWIPE_RATIO = 1.35;

const glassNavBtnClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-black/50 text-white shadow-[0_8px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-black/60 hover:border-white/22 active:scale-95";

export default function HomeHero({ items }: { items: FeaturedCatalogItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slides = items.slice(0, HOME_FEATURED_SLIDES);
  const touchRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    locked: "none" | "h" | "v";
  } | null>(null);

  const goNext = useCallback(() => {
    if (slides.length <= 1) {
      return;
    }
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length <= 1) {
      return;
    }
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const slideIds = slides.map((item) => `${item.catalogKind}-${item.id}`).join(",");

  useEffect(() => {
    setActiveIndex(0);
  }, [slideIds]);

  useEffect(() => {
    if (slides.length === 0) {
      return;
    }

    if (activeIndex >= slides.length) {
      setActiveIndex(Math.max(0, slides.length - 1));
    }
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(goNext, AUTO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused, slides.length]);

  useEffect(() => {
    let frame = 0;
    let resumeTimer = 0;

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setIsPaused(true);
        window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(() => setIsPaused(false), 1400);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.clearTimeout(resumeTimer);
    };
  }, []);

  const safeIndex =
    slides.length === 0 ? 0 : Math.min(activeIndex, slides.length - 1);

  useEffect(() => {
    if (slides.length <= 1 || typeof document === "undefined") {
      return;
    }

    const next = slides[(safeIndex + 1) % slides.length];
    const href =
      next?.poster_image?.src ||
      next?.poster_url ||
      next?.backdrop_image?.src ||
      next?.backdrop_image?.original ||
      next?.backdrop_url ||
      next?.details.backdrop_url;

    if (!href?.trim()) {
      return;
    }

    const existing = document.head.querySelector(
      `link[data-home-hero-prefetch="${CSS.escape(href)}"]`,
    );
    if (existing) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = href;
    link.setAttribute("data-home-hero-prefetch", href);
    document.head.appendChild(link);
  }, [safeIndex, slides]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    touchRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      locked: "none",
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const touch = touchRef.current;
    if (!touch || touch.pointerId !== event.pointerId || touch.locked !== "none") {
      return;
    }

    const dx = event.clientX - touch.startX;
    const dy = event.clientY - touch.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < 12 && absY < 12) {
      return;
    }

    // Prefer page scroll when gesture is mostly vertical.
    if (absY * SWIPE_RATIO >= absX) {
      touch.locked = "v";
      return;
    }

    touch.locked = "h";
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const touch = touchRef.current;
    touchRef.current = null;

    if (!touch || touch.pointerId !== event.pointerId || touch.locked === "v") {
      return;
    }

    const dx = event.clientX - touch.startX;
    const dy = event.clientY - touch.startY;

    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) {
      return;
    }

    // RTL: swipe toward start (finger moves left → positive dx in LTR coords means next visually)
    if (dx > 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  if (slides.length === 0) {
    return null;
  }

  const activeItem = slides[safeIndex] ?? slides[0];
  const metadata = formatFeaturedMetadata(activeItem);
  const statusLabel = activeItem.status_label_fa?.trim() || "اکنون در سینما";

  return (
    <section
      className="relative min-h-[68vh] touch-pan-y overflow-hidden md:min-h-[78vh] lg:min-h-[88vh]"
      dir="rtl"
      aria-label="محتوای ویژه"
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchRef.current = null;
      }}
    >
      {slides.map((item, index) => {
        const isActive = index === safeIndex;

        return (
          <div
            key={`${item.catalogKind}-${item.id}`}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            {/* Mobile: poster is clearer in portrait viewport */}
            <div className="absolute inset-0 md:hidden">
              <PosterImage
                title={item.title}
                image={item.poster_image}
                src={item.poster_url}
                fallbackUrl={item.backdrop_url ?? item.details.backdrop_url}
                usage="detail-poster"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                wrapperClassName="h-full w-full"
                className="object-cover object-center"
              />
            </div>
            <div className="absolute inset-0 hidden md:block">
              <BackdropImage
                title={item.title}
                image={item.backdrop_image}
                src={item.backdrop_url ?? item.details.backdrop_url}
                fallbackUrl={item.poster_url}
                usage="hero-backdrop"
                loading={index === 0 ? "eager" : "lazy"}
                wrapperClassName="h-full w-full"
                className="object-cover object-center"
              />
            </div>
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(270deg,transparent_0%,transparent_50%,rgba(5,7,11,0.18)_82%,rgba(5,7,11,0.4)_100%)] max-md:bg-[linear-gradient(180deg,rgba(5,7,11,0.15)_0%,transparent_28%,transparent_45%,rgba(5,7,11,0.55)_72%,rgba(5,7,11,0.92)_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,transparent_0%,rgba(5,7,11,0.12)_28%,rgba(5,7,11,0.55)_62%,rgba(5,7,11,0.92)_86%,#05070b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05070b] via-[#05070b]/80 to-transparent" />

      {slides.length > 1 ? (
        <div className="pointer-events-none absolute bottom-28 left-3 z-20 hidden items-center gap-2 md:bottom-32 md:left-6 md:flex">
          <button
            type="button"
            aria-label="اسلاید بعدی"
            data-tv-focusable
            onClick={goNext}
            className={`pointer-events-auto ${glassNavBtnClass} ${TV_FOCUS_RING_CLASS}`}
          >
            <HiChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="اسلاید قبلی"
            data-tv-focusable
            onClick={goPrev}
            className={`pointer-events-auto ${glassNavBtnClass} ${TV_FOCUS_RING_CLASS}`}
          >
            <HiChevronLeft className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-[68vh] flex-col justify-end md:min-h-[78vh] lg:min-h-[88vh]">
        <div className="mx-auto w-full max-w-[1820px] px-4 pb-24 pt-36 md:px-7 md:pb-28 lg:pb-32">
          <div className="ml-auto max-w-2xl space-y-4 text-right max-md:mx-auto max-md:text-center lg:max-w-3xl">
            <p
              className="text-sm font-bold tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] md:text-base"
              style={{ color: VIEWER_ACCENT }}
            >
              {statusLabel}
            </p>

            <h1 className="text-4xl font-black leading-tight text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.55)] md:text-5xl lg:text-6xl">
              {activeItem.title}
            </h1>

            {metadata ? (
              <p className="text-sm font-medium text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] md:text-base">
                {metadata}
              </p>
            ) : null}

            {activeItem.synopsis ? (
              <p className="line-clamp-3 text-sm leading-7 text-white/88 drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] max-md:mx-auto max-md:max-w-md md:text-base md:leading-8">
                {activeItem.synopsis}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-start gap-3 pt-1 max-md:justify-center">
              <Link
                href={buildFeaturedWatchHref(activeItem)}
                data-tv-focusable
                data-home-hero-play
                className={`${viewerPrimaryButtonLgClass} ${TV_FOCUS_RING_CLASS}`}
              >
                <HiMiniPlay className="h-6 w-6" />
                پخش
              </Link>
              <Link
                href={buildFeaturedDetailHref(activeItem)}
                data-tv-focusable
                className={`inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/12 px-6 py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md transition hover:bg-white/18 ${TV_FOCUS_RING_CLASS}`}
              >
                <HiMiniInformationCircle className="h-5 w-5" />
                اطلاعات بیشتر
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
