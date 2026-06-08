"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CatalogPage from "./CatalogPage";
import CatalogFiltersBar from "./CatalogFiltersBar";
import ActiveFilterChips from "./ActiveFilterChips";
import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import {
  buildCatalogQueryString,
  catalogFiltersSignature,
  parseCatalogFilters,
  parseSearchParamsRecord,
} from "../../lib/catalog/search-params";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type CatalogListItem,
  type PaginationMeta,
} from "../../lib/catalog/rest";
import type { FilterOptions } from "../../lib/filter-options";

export default function CatalogClient({
  kind,
  title,
  description,
  initialItems,
  initialMeta,
  initialFilters,
  filterOptions,
  initialError,
}: {
  kind: "movie" | "series";
  title: string;
  description: string;
  initialItems: CatalogListItem[];
  initialMeta: PaginationMeta;
  initialFilters: CatalogFiltersState;
  filterOptions: FilterOptions;
  initialError: string;
}) {
  return (
    <Suspense fallback={null}>
      <CatalogClientInner
        kind={kind}
        title={title}
        description={description}
        initialItems={initialItems}
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
  title,
  description,
  initialItems,
  initialMeta,
  initialFilters,
  filterOptions,
  initialError,
}: {
  kind: "movie" | "series";
  title: string;
  description: string;
  initialItems: CatalogListItem[];
  initialMeta: PaginationMeta;
  initialFilters: CatalogFiltersState;
  filterOptions: FilterOptions;
  initialError: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryString = searchParams.toString();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const filters = useMemo(
    () => parseCatalogFilters(parseSearchParamsRecord(searchParams)),
    [queryString],
  );

  const fetchSignature = useMemo(
    () => catalogFiltersSignature(filters, page),
    [filters, page],
  );

  const initialSignature = useRef(
    catalogFiltersSignature(initialFilters, initialMeta.current_page || 1),
  );
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
      fallbackData:
        fetchSignature === initialSignature.current
          ? {
              items: initialItems,
              meta: initialMeta,
              error: initialError,
            }
          : undefined,
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
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
      router.replace(target, { scroll: false });
    },
    [pathname, queryString, router],
  );

  const onPageChange = useCallback(
    (nextPage: number) => {
      const query = buildCatalogQueryString(filters, nextPage);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const loadMore =
    page < meta.last_page
      ? () => onPageChange(page + 1)
      : undefined;

  return (
    <CatalogPage
      kind={kind}
      title={title}
      description={description}
      items={items}
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
          />
          <ActiveFilterChips
            filters={filters}
            filterOptions={filterOptions}
            onChange={applyFilters}
            onClearAll={() =>
              applyFilters({
                search: "",
                sort: "",
                genres: [],
                countries: [],
                languages: [],
                year_from: null,
                year_to: null,
                min_rating: "",
              })
            }
          />
        </>
      }
      onPageChange={onPageChange}
      onLoadMore={loadMore}
    />
  );
}
