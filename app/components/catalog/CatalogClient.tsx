"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CatalogPage from "./CatalogPage";
import CatalogFiltersBar from "./CatalogFiltersBar";
import ActiveFilterChips from "./ActiveFilterChips";
import { CatalogFiltersBarSkeleton } from "../skeletons/CatalogPageSkeleton";
import { useFilterOptions } from "../../hooks/useFilterOptions";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";
import { useTvDebouncedReplace } from "../../hooks/useTvDebouncedReplace";
import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import {
  buildCatalogQueryString,
  catalogFiltersSignature,
  EMPTY_CATALOG_FILTERS,
  parseCatalogFilters,
  parseSearchParamsRecord,
} from "../../lib/catalog/search-params";
import { canonicalizeGenreFilterValues } from "../../lib/catalog/genre-filter-options";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type CatalogListItem,
  type PaginationMeta,
} from "../../lib/catalog/rest";
import { CATALOG_LIST_SWR_OPTIONS } from "../../lib/swr/public-cache";

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
  initialMeta: PaginationMeta;
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
  initialMeta: PaginationMeta;
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
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

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

  const fetchSignature = useMemo(
    () => catalogFiltersSignature(filters, page),
    [filters, page],
  );

  const initialSignature = useRef(
    catalogFiltersSignature(initialFilters, initialMeta.current_page || 1),
  );
  const isInitialQuery = fetchSignature === initialSignature.current;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const { data, isLoading, isValidating } = useSWR(
    `${kind}:${fetchSignature}`,
    async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const fetcher =
        kind === "movie" ? fetchMoviesCatalogRest : fetchSeriesCatalogRest;
      const result = await fetcher(filters, page, 24, controller.signal);
      return {
        items: result.items,
        meta: result.meta,
        error: result.error,
      };
    },
    {
      fallbackData: isInitialQuery
        ? {
            items: initialItems,
            meta: initialMeta,
            error: initialError,
          }
        : undefined,
      ...CATALOG_LIST_SWR_OPTIONS,
    },
  );

  const items = data?.items ?? initialItems;
  const meta = data?.meta ?? initialMeta;
  const error = data?.error ?? initialError;
  const loading = (isLoading || isValidating) && fetchSignature !== initialSignature.current;

  const applyFilters = useCallback(
    (next: CatalogFiltersState) => {
      const query = buildCatalogQueryString(next);
      const target = query ? `${pathname}?${query}` : pathname;
      if (`${pathname}${query ? `?${query}` : ""}` === `${pathname}${queryString ? `?${queryString}` : ""}`) {
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

  const onPageChange = useCallback(
    (nextPage: number) => {
      const query = buildCatalogQueryString(filters, nextPage);
      const target = query ? `${pathname}?${query}` : pathname;

      if (isTvCompat) {
        tvReplace(target, true);
        return;
      }

      router.replace(target, { scroll: false });
    },
    [filters, isTvCompat, pathname, router, tvReplace],
  );

  const loadMore =
    page < meta.last_page
      ? () => onPageChange(page + 1)
      : undefined;

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
      loading={loading}
      error={error}
      meta={meta}
      latestSliderSlot={latestSliderSlot}
      filtersSlot={filtersSlot}
      onPageChange={onPageChange}
      onLoadMore={loadMore}
    />
  );
}
