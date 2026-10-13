"use client";

import { useRef } from "react";
import CatalogPosterCard from "./CatalogPosterCard";
import CatalogLatestSlider from "./CatalogLatestSlider";
import CatalogPosterCardSkeleton from "./CatalogPosterCardSkeleton";
import { getCatalogItemHref } from "../../lib/catalog/animation";
import type { CatalogListItem } from "../../lib/catalog/rest";
import type { CarouselMeta } from "../../types/carousel";
import { useTvGridColumns } from "../../hooks/useTvGridColumns";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";
import { useInfiniteScrollSentinel } from "../../hooks/useInfiniteScrollSentinel";

export type CatalogInfiniteMeta = Pick<CarouselMeta, "total" | "has_more" | "per_page"> & {
  current_page?: number;
  last_page?: number;
  next_cursor?: string | null;
};

export default function CatalogPage({
  kind,
  items,
  latestSliderSlot,
  latestItems = [],
  latestLoading = false,
  loading,
  error,
  meta,
  filtersSlot,
  topSlot,
  useItemKind = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: {
  kind: "movie" | "series";
  items: CatalogListItem[];
  latestSliderSlot?: React.ReactNode;
  latestItems?: CatalogListItem[];
  latestLoading?: boolean;
  loading: boolean;
  error: string;
  meta: CatalogInfiniteMeta;
  filtersSlot?: React.ReactNode;
  topSlot?: React.ReactNode;
  useItemKind?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const basePath = kind === "movie" ? "/movies" : "/series";
  const itemHref = (item: CatalogListItem) =>
    useItemKind ? getCatalogItemHref(item) : `${basePath}/${item.slug}`;
  const itemKey = (item: CatalogListItem) =>
    useItemKind
      ? `${item.catalogKind ?? kind}-${item.slug}`
      : `${kind}-${item.slug}`;
  const gridRef = useRef<HTMLDivElement>(null);
  const isTvCompat = useIsTvCompat();
  const gridCols = useTvGridColumns(gridRef, items.length);

  const sentinelRef = useInfiniteScrollSentinel(
    () => {
      onLoadMore?.();
    },
    Boolean(hasMore && onLoadMore && !loading && !isLoadingMore),
    {
      root: null,
      rootMargin: "1400px 0px",
      threshold: 0,
    },
  );

  const showStatus = meta.total > 0;

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <section className="mx-auto w-full max-w-[1820px] px-4 py-6 md:px-7 md:py-8">
        {latestSliderSlot ? (
          <div key="catalog-latest-slider">{latestSliderSlot}</div>
        ) : (
          <CatalogLatestSlider
            items={latestItems}
            kind={kind}
            loading={latestLoading}
            useItemKind={useItemKind}
          />
        )}

        {topSlot}

        {filtersSlot ? (
          <div
            className={`relative z-30 mb-6 rounded-2xl border border-white/[0.08] bg-[#12161f]/90 p-4 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm md:p-5 ${isTvCompat ? "overflow-hidden" : "overflow-visible"}`}
          >
            {filtersSlot}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}

        {showStatus ? (
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-white/55">
            <span>
              نمایش {items.length.toLocaleString("fa-IR")} از{" "}
              {meta.total.toLocaleString("fa-IR")} مورد
            </span>
          </div>
        ) : null}

        <div className="relative z-0">
          {loading ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-24">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#3b82f6]" />
            </div>
          ) : null}

          <div className={loading ? "opacity-50 transition-opacity" : ""}>
            {items.length === 0 && !loading ? (
              <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center text-white/50">
                هنوز موردی در این بخش منتشر نشده است.
              </div>
            ) : (
              <div
                ref={gridRef}
                className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
                data-tv-grid="poster"
                data-tv-cols={isTvCompat ? String(gridCols) : undefined}
              >
                {items.map((item, index) => {
                  const eagerCount = isTvCompat ? 8 : 14;
                  const imageLoading = index < eagerCount ? "eager" : "lazy";
                  const imageFetchPriority =
                    index < 2 ? "high" : index < eagerCount ? "auto" : "low";

                  return (
                  <CatalogPosterCard
                    key={itemKey(item)}
                    item={item}
                    href={itemHref(item)}
                    index={index}
                    imageLoading={imageLoading}
                    imageFetchPriority={imageFetchPriority}
                  />
                  );
                })}
                {hasMore ? (
                  <div
                    ref={sentinelRef}
                    className="col-span-full h-px w-full"
                    aria-hidden
                  />
                ) : null}
                {isLoadingMore
                  ? Array.from({ length: Math.min(7, gridCols || 7) }).map((_, index) => (
                      <CatalogPosterCardSkeleton
                        key={`catalog-more-skel-${index}`}
                        isSeries={kind === "series"}
                      />
                    ))
                  : null}
              </div>
            )}
          </div>
        </div>

        {!hasMore && items.length > 0 && !loading ? (
          <p className="mt-8 text-center text-sm text-white/40">همه موارد بارگذاری شد.</p>
        ) : null}
      </section>
    </div>
  );
}
