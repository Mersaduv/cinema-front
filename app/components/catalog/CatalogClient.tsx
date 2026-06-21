"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CatalogPage from "./CatalogPage";
import CatalogFiltersBar from "./CatalogFiltersBar";
import ActiveFilterChips from "./ActiveFilterChips";
import { useIsTv } from "../../hooks/useTvCapabilities";
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
import {
  LATEST_CATALOG_FILTERS,
  LATEST_FETCH_POOL,
  pickLatestSliderItems,
} from "../../lib/catalog/latest";
import type { FilterOptions } from "../../lib/filter-options";

export default function CatalogClient({
  kind,
  initialItems,
  initialLatestItems,
  initialMeta,
  initialFilters,
  filterOptions,
  initialError,
}: {
  kind: "movie" | "series";
  initialItems: CatalogListItem[];
  initialLatestItems: CatalogListItem[];
  initialMeta: PaginationMeta;
  initialFilters: CatalogFiltersState;
  filterOptions: FilterOptions;
  initialError: string;
}) {
  return (
    <Suspense fallback={null}>
      <CatalogClientInner
        kind={kind}
        initialItems={initialItems}
        initialLatestItems={initialLatestItems}
        initialMeta={initialMeta}
        initialFilters={initialFilters}
        filterOptions={filterOptions}
        initialError={initialError}
      />
    </Suspense>
  );
}

function CatalogClientInner({
  kind,
  initialItems,
  initialLatestItems,
  initialMeta,
  initialFilters,
  filterOptions,
  initialError,
}: {
  kind: "movie" | "series";
  initialItems: CatalogListItem[];
  initialLatestItems: CatalogListItem[];
  initialMeta: PaginationMeta;
  initialFilters: CatalogFiltersState;
  filterOptions: FilterOptions;
  initialError: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTv = useIsTv();
  const tvReplace = useTvDebouncedReplace();

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
      keepPreviousData: true,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      dedupingInterval: 0,
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

      if (isTv) {
        tvReplace(target, true);
        return;
      }

      router.replace(target, { scroll: false });
    },
    [isTv, pathname, queryString, router, tvReplace],
  );

  const onPageChange = useCallback(
    (nextPage: number) => {
      const query = buildCatalogQueryString(filters, nextPage);
      const target = query ? `${pathname}?${query}` : pathname;

      if (isTv) {
        tvReplace(target, true);
        return;
      }

      router.replace(target, { scroll: false });
    },
    [filters, isTv, pathname, router, tvReplace],
  );

  const loadMore =
    page < meta.last_page
      ? () => onPageChange(page + 1)
      : undefined;

  const { data: latestData, isLoading: latestLoading } = useSWR(
    `${kind}:latest-slider`,
    async () => {
      const fetcher =
        kind === "movie" ? fetchMoviesCatalogRest : fetchSeriesCatalogRest;
      const result = await fetcher(LATEST_CATALOG_FILTERS, 1, LATEST_FETCH_POOL);
      return {
        ...result,
        items: pickLatestSliderItems(result.items),
      };
    },
    {
      fallbackData: { items: initialLatestItems, meta: initialMeta, error: "" },
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  const latestItems = latestData?.items ?? initialLatestItems;

  const clearAllFilters = useCallback(() => {
    applyFilters(EMPTY_CATALOG_FILTERS);
  }, [applyFilters]);

  return (
    <CatalogPage
      kind={kind}
      items={items}
      latestItems={latestItems}
      latestLoading={latestLoading && latestItems.length === 0}
      loading={loading}
      error={error}
      meta={meta}
      filtersSlot={
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
      }
      onPageChange={onPageChange}
      onLoadMore={loadMore}
    />
  );
}
