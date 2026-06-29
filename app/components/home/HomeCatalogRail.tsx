"use client";

import { useMemo, useRef } from "react";
import CatalogPosterCard from "../catalog/CatalogPosterCard";
import CatalogPosterCardSkeleton from "../catalog/CatalogPosterCardSkeleton";
import ContentListSlider, { SLIDER_SLIDE_CLASS } from "../catalog/ContentListSlider";
import { useCarouselRail } from "../../hooks/useCarouselRail";
import { useCarouselSentinel } from "../../hooks/useCarouselSentinel";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";
import { getCatalogItemHref } from "../../lib/catalog/animation";
import {
  getCarouselConfig,
} from "../../lib/catalog/carousel-config";
import type { CatalogListItem } from "../../lib/catalog/rest";
import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import type { CarouselMeta } from "../../types/carousel";

export default function HomeCatalogRail({
  title,
  initialItems,
  initialMeta,
  sort,
  kind,
  filters,
  isAboveFold = false,
  progressive = true,
  useItemKind = false,
}: {
  title: string;
  initialItems: CatalogListItem[];
  initialMeta: CarouselMeta;
  sort: string;
  kind: "movie" | "movies" | "series";
  filters?: CatalogFiltersState;
  isAboveFold?: boolean;
  progressive?: boolean;
  useItemKind?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefetchTriggeredRef = useRef(false);
  const isTvCompat = useIsTvCompat();
  const eagerImageCount = isTvCompat ? 8 : 6;
  const config = useMemo(
    () => getCarouselConfig(initialMeta.total),
    [initialMeta.total],
  );

  const normalizedKind = kind === "series" ? "series" : "movies";

  const rail = useCarouselRail({
    initialItems,
    initialMeta,
    sort,
    kind: normalizedKind,
    filters,
    batchSize: config.batchSize,
  });

  const items = progressive ? rail.items : initialItems;
  const hasMore = progressive ? rail.hasMore : false;
  const isLoadingMore = progressive ? rail.isLoadingMore : false;
  const loadMore = progressive ? rail.loadMore : () => undefined;

  const sentinelIndex = Math.min(
    config.sentinelAtIndex,
    Math.max(0, items.length - 1),
  );

  const { attachSentinelRef } = useCarouselSentinel({
    onTrigger: loadMore,
    enabled: progressive && hasMore && !isLoadingMore && items.length > 0,
    rootRef: scrollRef,
    triggerAtIndex: sentinelIndex,
  });

  if (items.length === 0) {
    return null;
  }

  const basePath = normalizedKind === "movies" ? "/movies" : "/series";
  const sectionId = `home-rail-${normalizedKind}-${title.replace(/\s+/g, "-")}`;

  const handleRailHover = () => {
    if (prefetchTriggeredRef.current || !progressive || !hasMore) {
      return;
    }

    prefetchTriggeredRef.current = true;
    loadMore();
  };

  return (
    <section
      className="space-y-4"
      dir="rtl"
      role="region"
      aria-label={title}
      aria-busy={isLoadingMore}
      onMouseEnter={handleRailHover}
    >
      <h2
        id={sectionId}
        className="text-right text-lg font-bold text-white md:text-xl"
      >
        {title}
      </h2>

      <ContentListSlider ariaLabel={title} containerRef={scrollRef}>
        {items.map((item, index) => {
          const href = useItemKind ? getCatalogItemHref(item) : `${basePath}/${item.slug}`;
          const isSentinelCard = progressive && hasMore && index === sentinelIndex;
          const eagerImage = isAboveFold && index < eagerImageCount;

          return (
            <div
              key={`${useItemKind ? getCatalogItemHref(item) : item.id}`}
              ref={isSentinelCard ? attachSentinelRef : undefined}
              data-slider-slide
              className={SLIDER_SLIDE_CLASS}
            >
              <CatalogPosterCard
                item={item}
                href={href}
                index={index}
                carouselItem
                imageLoading={eagerImage ? "eager" : "lazy"}
                imageFetchPriority={eagerImage ? "high" : "auto"}
              />
            </div>
          );
        })}

        {isLoadingMore
          ? Array.from({ length: config.skeletonCount }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
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
