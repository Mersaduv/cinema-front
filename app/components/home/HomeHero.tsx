"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HiMiniInformationCircle, HiMiniPlay } from "react-icons/hi2";
import { BackdropImage } from "../images";
import {
  buildFeaturedDetailHref,
  buildFeaturedWatchHref,
  formatFeaturedMetadata,
  type FeaturedCatalogItem,
} from "../../lib/catalog/home";
import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import {
  viewerPrimaryButtonLgClass,
  VIEWER_ACCENT,
} from "../../lib/viewer-theme";

const AUTO_INTERVAL_MS = 8000;

export default function HomeHero({ items }: { items: FeaturedCatalogItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slides = items.slice(0, 5);

  const goNext = useCallback(() => {
    if (slides.length <= 1) {
      return;
    }
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const slideIds = slides.map((item) => `${item.catalogKind}-${item.id}`).join(",");

  useEffect(() => {
    setActiveIndex(0);
  }, [slideIds]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(goNext, AUTO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const activeItem = slides[activeIndex] ?? slides[0];
  const metadata = formatFeaturedMetadata(activeItem);
  const statusLabel = activeItem.status_label_fa?.trim() || "اکنون در سینما";

  return (
    <section
      className="relative min-h-[52vh] overflow-hidden md:min-h-[58vh] lg:min-h-[62vh]"
      dir="rtl"
      aria-label="محتوای ویژه"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      {slides.map((item, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={`${item.catalogKind}-${item.id}`}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            <BackdropImage
              title={item.title}
              image={item.backdrop_image}
              src={item.backdrop_url ?? item.details.backdrop_url}
              fallbackUrl={item.poster_url}
              usage="hero-backdrop"
              wrapperClassName="h-full w-full"
              className="scale-105 object-cover"
            />
          </div>
        );
      })}

      <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(5,7,11,0.05)_0%,rgba(5,7,11,0.45)_38%,rgba(5,7,11,0.88)_68%,rgba(5,7,11,0.97)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.2)_0%,rgba(5,7,11,0.15)_45%,rgba(5,7,11,0.92)_88%,rgba(5,7,11,1)_100%)]" />

      <div className="relative z-10 flex min-h-[52vh] flex-col justify-end md:min-h-[58vh] lg:min-h-[62vh]">
        <div className="mx-auto w-full max-w-[1820px] px-4 pb-28 pt-32 md:px-7 md:pb-32 lg:pb-36">
          <div className="ml-auto max-w-2xl space-y-4 text-right lg:max-w-3xl">
            <p
              className="text-sm font-bold tracking-wide md:text-base"
              style={{ color: VIEWER_ACCENT }}
            >
              {statusLabel}
            </p>

            <h1 className="text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
              {activeItem.title}
            </h1>

            {metadata ? (
              <p className="text-sm font-medium text-white/72 md:text-base">{metadata}</p>
            ) : null}

            {activeItem.synopsis ? (
              <p className="line-clamp-3 text-sm leading-7 text-white/78 md:text-base md:leading-8">
                {activeItem.synopsis}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
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
                className={`inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/16 ${TV_FOCUS_RING_CLASS}`}
              >
                <HiMiniInformationCircle className="h-5 w-5" />
                اطلاعات بیشتر
              </Link>
            </div>
          </div>

          {slides.length > 1 ? (
            <div className="mt-8 flex justify-end gap-2">
              {slides.map((item, index) => (
                <button
                  key={`dot-${item.catalogKind}-${item.id}`}
                  type="button"
                  aria-label={`اسلاید ${index + 1}: ${item.title}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  data-tv-focusable
                  onClick={() => setActiveIndex(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${TV_FOCUS_RING_CLASS} ${
                    index === activeIndex
                      ? "w-8 bg-[#f5c518]"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
