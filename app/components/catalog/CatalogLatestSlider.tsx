"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BackdropImage } from "../images";
import { getCatalogItemHref } from "../../lib/catalog/animation";
import type { CatalogListItem } from "../../lib/catalog/rest";

const AUTO_INTERVAL_MS = 6500;
const MAX_SLIDES = 6;

function formatProductLine(item: CatalogListItem): string {
  const parts: string[] = [];
  if (item.release_year) {
    parts.push(String(item.release_year));
  }
  return parts.length > 0 ? `محصول: ${parts.join(" · ")}` : "";
}

export default function CatalogLatestSlider({
  items,
  kind,
  loading = false,
  useItemKind = false,
}: {
  items: CatalogListItem[];
  kind: "movie" | "series";
  loading?: boolean;
  useItemKind?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const basePath = kind === "movie" ? "/movies" : "/series";
  const itemHref = (item: CatalogListItem) =>
    useItemKind ? getCatalogItemHref(item) : `${basePath}/${item.slug}`;
  const slides = items.slice(0, MAX_SLIDES);

  const goNext = useCallback(() => {
    if (slides.length <= 1) {
      return;
    }
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const slideIds = slides
    .map((item) => `${item.catalogKind ?? kind}-${item.id}`)
    .join(",");
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

  if (!loading && slides.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-8"
      dir="rtl"
      aria-label="جدیدترین‌ها"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white md:text-xl">جدیدترین‌ها</h2>
        {slides.length > 1 ? (
          <div className="flex items-center gap-1.5">
            {slides.map((item, index) => (
              <button
                key={`${item.catalogKind ?? kind}-${item.id}`}
                type="button"
                aria-label={`اسلاید ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-6 bg-[#3b82f6]"
                    : "w-1.5 bg-white/25 hover:bg-white/45"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex h-[168px] gap-2.5 sm:h-[200px] md:h-[232px] md:gap-3 lg:h-[260px]">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`latest-skeleton-${index}`}
                className={`animate-pulse rounded-2xl bg-white/[0.06] ${
                  index === 0 ? "flex-[2.4]" : "flex-1"
                }`}
              />
            ))
          : slides.map((item, index) => {
              const isActive = index === activeIndex;
              const genres = item.details.genres;
              const productLine = formatProductLine(item);

              return (
                <Link
                  key={`${item.catalogKind ?? kind}-${item.id}`}
                  href={itemHref(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  className={[
                    "group relative min-w-0 overflow-hidden rounded-2xl border transition-all duration-500 ease-out",
                    isActive
                      ? "flex-[2.35] border-white/20 shadow-[0_20px_50px_-20px_rgba(59,130,246,0.45)]"
                      : "flex-[0.72] border-white/8 opacity-80 hover:opacity-100",
                  ].join(" ")}
                  aria-label={item.title}
                >
                  <div className="absolute inset-0 bg-[#0d1118]">
                    <BackdropImage
                      title={item.title}
                      image={item.backdrop_image}
                      src={item.backdrop_url ?? item.details.backdrop_url}
                      fallbackUrl={item.poster_url}
                      wrapperClassName="h-full w-full"
                      className={`transition-transform duration-700 ${
                        isActive ? "scale-105" : "scale-100 group-hover:scale-[1.03]"
                      }`}
                    />
                  </div>

                  <div
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      isActive
                        ? "bg-gradient-to-t from-black/90 via-black/35 to-black/10"
                        : "bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                    }`}
                  />

                  <div
                    className={`absolute inset-x-0 bottom-0 z-10 p-3 transition-all duration-500 md:p-4 ${
                      isActive
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                    }`}
                  >
                    <p className="line-clamp-1 text-right text-sm font-bold text-white md:text-base">
                      {item.title}
                    </p>
                    {productLine ? (
                      <p className="mt-1 line-clamp-1 text-right text-[11px] text-white/65 md:text-xs">
                        {productLine}
                      </p>
                    ) : null}
                    {genres.length > 0 ? (
                      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                        {genres.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-lg border border-white/15 bg-black/45 px-2 py-1 text-[10px] text-white/90 backdrop-blur-sm md:text-[11px]"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
