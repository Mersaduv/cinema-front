"use client";

import { Suspense, useCallback, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CatalogPage from "./CatalogPage";
import CatalogFiltersBar from "./CatalogFiltersBar";
import ActiveFilterChips from "./ActiveFilterChips";
import { CatalogFiltersBarSkeleton } from "../skeletons/CatalogPageSkeleton";
import { useFilterOptions } from "../../hooks/useFilterOptions";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";
import { useTvDebouncedReplace } from "../../hooks/useTvDebouncedReplace";
import { useCatalogInfinite } from "../../hooks/useCatalogInfinite";
import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import {
  buildCatalogQueryString,
  EMPTY_CATALOG_FILTERS,
  parseCatalogFilters,
  parseSearchParamsRecord,
} from "../../lib/catalog/search-params";
import { canonicalizeGenreFilterValues } from "../../lib/catalog/genre-filter-options";
import type { CatalogListItem } from "../../lib/catalog/rest";
import type { CarouselMeta } from "../../types/carousel";

export default function CatalogClient({
  kind,
  initialItems,
  initialMeta,
  initialFilters,
  initialError,
  latestSliderSlot,
}: {
  kind: "movie" | "series";
  initialItems: CatalogListItem[];
  initialMeta:
    | CarouselMeta
    | {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
      };
  initialFilters: CatalogFiltersState;
  initialError: string;
  latestSliderSlot?: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <CatalogClientInner
        kind={kind}
        initialItems={initialItems}
        initialMeta={initialMeta}
        initialFilters={initialFilters}
        initialError={initialError}
        latestSliderSlot={latestSliderSlot}
      />
    </Suspense>
  );
}

function CatalogClientInner({
  kind,
  initialItems,
  initialMeta,
  initialFilters,
  initialError,
  latestSliderSlot,
}: {
  kind: "movie" | "series";
  initialItems: CatalogListItem[];
  initialMeta:
    | CarouselMeta
    | {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
      };
  initialFilters: CatalogFiltersState;
  initialError: string;
  latestSliderSlot?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTvCompat = useIsTvCompat();
  const tvReplace = useTvDebouncedReplace();
  const { filterOptions, filterOptionsLoading } = useFilterOptions();

  const queryString = searchParams.toString();

  const filters = useMemo(() => {
    const parsed = parseCatalogFilters(parseSearchParamsRecord(searchParams));
    return {
      ...parsed,
      genres: canonicalizeGenreFilterValues(
        parsed.genres,
        filterOptions.genre_id_aliases ?? {},
      ),
    };
  }, [queryString, filterOptions.genre_id_aliases, searchParams]);

  const {
    items,
    meta,
    error,
    isFilterLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useCatalogInfinite({
    kind,
    filters,
    initialItems,
    initialMeta,
    initialFilters,
    initialError,
    pageSize: 24,
  });

  const applyFilters = useCallback(
    (next: CatalogFiltersState) => {
      const query = buildCatalogQueryString(next);
      const target = query ? `${pathname}?${query}` : pathname;
      if (
        `${pathname}${query ? `?${query}` : ""}` ===
        `${pathname}${queryString ? `?${queryString}` : ""}`
      ) {
        return;
      }

      if (isTvCompat) {
        tvReplace(target, true);
        return;
      }

      router.replace(target, { scroll: false });
    },
    [isTvCompat, pathname, queryString, router, tvReplace],
  );

  const clearAllFilters = useCallback(() => {
    applyFilters(EMPTY_CATALOG_FILTERS);
  }, [applyFilters]);

  const filtersSlot = (
    <div className="space-y-4">
      {filterOptionsLoading ? (
        <CatalogFiltersBarSkeleton />
      ) : (
        <>
          <CatalogFiltersBar
            kind={kind}
            filters={filters}
            filterOptions={filterOptions}
            onFiltersChange={applyFilters}
            onClearAll={clearAllFilters}
          />
          <ActiveFilterChips
            filters={filters}
            filterOptions={filterOptions}
            onChange={applyFilters}
            onClearAll={clearAllFilters}
          />
        </>
      )}
    </div>
  );

  return (
    <CatalogPage
      kind={kind}
      items={items}
      loading={isFilterLoading}
      error={error}
      meta={meta}
      latestSliderSlot={latestSliderSlot}
      filtersSlot={filtersSlot}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={loadMore}
    />
  );
}
