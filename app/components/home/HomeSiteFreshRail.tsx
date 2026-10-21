"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CatalogPosterCard from "../catalog/CatalogPosterCard";
import CatalogPosterCardSkeleton from "../catalog/CatalogPosterCardSkeleton";
import ContentListSlider, { SLIDER_SLIDE_CLASS } from "../catalog/ContentListSlider";
import { useCarouselSentinel } from "../../hooks/useCarouselSentinel";
import { useSequentialLoadGate } from "../../hooks/useSequentialLoadGate";
import { getCatalogItemHref } from "../../lib/catalog/animation";
import {
  HOME_FRESH_MOVIES_FILTERS,
  HOME_FRESH_SERIES_FILTERS,
  HOME_SITE_FRESH_MAX,
  sortBySitePublishedAt,
} from "../../lib/catalog/home";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  isCarouselMeta,
  type CatalogListItem,
} from "../../lib/catalog/rest";

type FreshItem = CatalogListItem & { catalogKind: "movie" | "series" };

const BATCH = 6;

function mergeFresh(existing: FreshItem[], incoming: FreshItem[]): FreshItem[] {
  const seen = new Set(existing.map((item) => `${item.catalogKind}:${item.slug}`));
  const merged = [...existing];

  for (const item of incoming) {
    const key = `${item.catalogKind}:${item.slug}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }

  return sortBySitePublishedAt(merged).slice(0, HOME_SITE_FRESH_MAX);
}

export default function HomeSiteFreshRail({
  initialItems,
  reserveItems,
  moviesCursor,
  seriesCursor,
}: {
  initialItems: FreshItem[];
  reserveItems: FreshItem[];
  moviesCursor: string | null;
  seriesCursor: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const moviesCursorRef = useRef(moviesCursor);
  const seriesCursorRef = useRef(seriesCursor);
  const loadingRef = useRef(false);
  const [items, setItems] = useState(initialItems);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (reserveItems.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const reveal = () => {
      if (cancelled) {
        return;
      }
      setItems((current) => mergeFresh(current, reserveItems));
    };

    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(reveal, { timeout: 900 })
        : 0;
    const timerId = idleId ? 0 : window.setTimeout(reveal, 350);

    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [reserveItems]);

  const hasMore =
    items.length < HOME_SITE_FRESH_MAX &&
    Boolean(moviesCursorRef.current || seriesCursorRef.current);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || items.length >= HOME_SITE_FRESH_MAX) {
      return;
    }

    const movieCursor = moviesCursorRef.current;
    const seriesCursor = seriesCursorRef.current;

    if (!movieCursor && !seriesCursor) {
      return;
    }

    loadingRef.current = true;
    setIsLoadingMore(true);

    try {
      const [moviesResult, seriesResult] = await Promise.all([
        movieCursor
          ? fetchMoviesCatalogRest(HOME_FRESH_MOVIES_FILTERS, 1, BATCH, undefined, {
              cursor: movieCursor,
            })
          : null,
        seriesCursor
          ? fetchSeriesCatalogRest(HOME_FRESH_SERIES_FILTERS, 1, BATCH, undefined, {
              cursor: seriesCursor,
            })
          : null,
      ]);

      moviesCursorRef.current =
        moviesResult && isCarouselMeta(moviesResult.meta)
          ? moviesResult.meta.next_cursor
          : null;
      seriesCursorRef.current =
        seriesResult && isCarouselMeta(seriesResult.meta)
          ? seriesResult.meta.next_cursor
          : null;

      const incoming: FreshItem[] = [
        ...(moviesResult?.items ?? []).map((item) => ({
          ...item,
          catalogKind: "movie" as const,
        })),
        ...(seriesResult?.items ?? []).map((item) => ({
          ...item,
          catalogKind: "series" as const,
        })),
      ];

      setItems((current) => mergeFresh(current, incoming));
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [items.length]);

  const sentinelIndex = Math.max(0, items.length - 2);
  const { attachSentinelRef } = useCarouselSentinel({
    onTrigger: () => {
      void loadMore();
    },
    enabled: hasMore && !isLoadingMore && items.length > 0,
    rootRef: scrollRef,
    triggerAtIndex: sentinelIndex,
  });

  const gateTotal = Math.min(6, items.length);
  const { canLoad, markLoaded } = useSequentialLoadGate(gateTotal, {
    enabled: gateTotal > 1,
    stallMs: 3_500,
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" dir="rtl" role="region" aria-label="تازه‌های سینما">
      <h2 className="text-right text-lg font-bold text-white md:text-xl">تازه‌های سینما</h2>
      <ContentListSlider ariaLabel="تازه‌های سینما" containerRef={scrollRef}>
        {items.map((item, index) => {
          const inSequentialBatch = index < gateTotal;
          const imageReady = !inSequentialBatch || canLoad(index);

          return (
            <div
              key={`${item.catalogKind}-${item.id}-${item.slug}`}
              ref={hasMore && index === sentinelIndex ? attachSentinelRef : undefined}
              data-slider-slide
              className={SLIDER_SLIDE_CLASS}
            >
              <CatalogPosterCard
                item={item}
                href={getCatalogItemHref(item)}
                index={index}
                carouselItem
                deferImage={!imageReady}
                imageLoading={inSequentialBatch && imageReady ? "eager" : "lazy"}
                imageFetchPriority={index === 0 && imageReady ? "high" : "auto"}
                onImageLoad={inSequentialBatch ? () => markLoaded(index) : undefined}
              />
            </div>
          );
        })}
        {isLoadingMore
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`fresh-skeleton-${index}`}
                data-slider-slide
                className={SLIDER_SLIDE_CLASS}
                aria-hidden="true"
              >
                <CatalogPosterCardSkeleton />
              </div>
            ))
          : null}
      </ContentListSlider>
    </section>
  );
}
