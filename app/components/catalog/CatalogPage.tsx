"use client";

import { useRef } from "react";
import CatalogPosterCard from "./CatalogPosterCard";
import CatalogLatestSlider from "./CatalogLatestSlider";
import { getCatalogItemHref } from "../../lib/catalog/animation";
import type { CatalogListItem, PaginationMeta } from "../../lib/catalog/rest";
import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import { useTvGridColumns } from "../../hooks/useTvGridColumns";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";

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
  onPageChange,
  onLoadMore,
}: {
  kind: "movie" | "series";
  items: CatalogListItem[];
  latestSliderSlot?: React.ReactNode;
  latestItems?: CatalogListItem[];
  latestLoading?: boolean;
  loading: boolean;
  error: string;
  meta: PaginationMeta;
  filtersSlot?: React.ReactNode;
  topSlot?: React.ReactNode;
  useItemKind?: boolean;
  onPageChange?: (page: number) => void;
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
                {items.map((item, index) => (
                  <CatalogPosterCard
                    key={itemKey(item)}
                    item={item}
                    href={itemHref(item)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {meta.last_page > 1 ? (
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
            data-tv-focus-group="pagination"
            role="navigation"
            aria-label="صفحه‌بندی کاتالوگ"
          >
            <button
              type="button"
              data-tv-focusable
              data-tv-pagination="prev"
              disabled={meta.current_page <= 1 || loading}
              onClick={() => onPageChange?.(meta.current_page - 1)}
              className={`rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-40 ${TV_FOCUS_RING_CLASS}`}
            >
              قبلی
            </button>
            <span
              className="px-2 text-sm text-white/60"
              data-tv-pagination="label"
              aria-live="polite"
            >
              صفحه {meta.current_page} از {meta.last_page} ({meta.total} مورد)
            </span>
            <button
              type="button"
              data-tv-focusable
              data-tv-pagination="next"
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => onPageChange?.(meta.current_page + 1)}
              className={`rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-40 ${TV_FOCUS_RING_CLASS}`}
            >
              بعدی
            </button>
          </div>
        ) : null}

        {onLoadMore ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              بارگذاری بیشتر
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
