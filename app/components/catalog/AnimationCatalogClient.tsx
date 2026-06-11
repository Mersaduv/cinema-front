"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ActiveFilterChips from "./ActiveFilterChips";
import CatalogFiltersBar from "./CatalogFiltersBar";
import CatalogPage from "./CatalogPage";
import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import {
  animationCatalogSignature,
  buildAnimationCatalogQueryString,
  buildAnimationGenreLabels,
  DEFAULT_ANIMATION_SUBTYPES,
  fetchAnimationCatalogMerged,
  parseAnimationCatalogFilters,
  parseAnimationSubtypes,
  resolveAnimationSubtypeGenreValues,
  withAnimationGenreFilter,
  type AnimationCatalogItem,
  type SelectableAnimationSubtype,
} from "../../lib/catalog/animation";
import { EMPTY_CATALOG_FILTERS } from "../../lib/catalog/search-params";
import { LATEST_FETCH_POOL, pickLatestSliderItems } from "../../lib/catalog/latest";
import { parseSearchParamsRecord } from "../../lib/catalog/search-params";
import type { PaginationMeta } from "../../lib/catalog/rest";
import type { FilterOptions } from "../../lib/filter-options";

export default function AnimationCatalogClient({
  initialSubtypes,
  initialItems,
  initialLatestItems,
  initialMeta,
  initialFilters,
  filterOptions,
  initialError,
}: {
  initialSubtypes: SelectableAnimationSubtype[];
  initialItems: AnimationCatalogItem[];
  initialLatestItems: AnimationCatalogItem[];
  initialMeta: PaginationMeta;
  initialFilters: CatalogFiltersState;
  filterOptions: FilterOptions;
  initialError: string;
}) {
  return (
    <Suspense fallback={null}>
      <AnimationCatalogClientInner
        initialSubtypes={initialSubtypes}
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

function AnimationCatalogClientInner({
  initialSubtypes,
  initialItems,
  initialLatestItems,
  initialMeta,
  initialFilters,
  filterOptions,
  initialError,
}: {
  initialSubtypes: SelectableAnimationSubtype[];
  initialItems: AnimationCatalogItem[];
  initialLatestItems: AnimationCatalogItem[];
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
  const subtypes = parseAnimationSubtypes(parseSearchParamsRecord(searchParams));

  const filters = useMemo(
    () => parseAnimationCatalogFilters(parseSearchParamsRecord(searchParams)),
    [queryString],
  );

  const subtypeGenreValues = useMemo(
    () => resolveAnimationSubtypeGenreValues(filterOptions, subtypes),
    [filterOptions, subtypes],
  );

  const subtypeGenreLabels = useMemo(
    () => buildAnimationGenreLabels(filterOptions, subtypes),
    [filterOptions, subtypes],
  );

  const effectiveFilters = useMemo(
    () => withAnimationGenreFilter(filters, subtypeGenreValues),
    [filters, subtypeGenreValues],
  );

  const latestFilters = useMemo(
    () =>
      withAnimationGenreFilter(
        {
          search: "",
          sort: "release_year_desc",
          genres: [],
          countries: [],
          languages: [],
          year_from: null,
          year_to: null,
          min_rating: "",
        },
        subtypeGenreValues,
      ),
    [subtypeGenreValues],
  );

  const fetchSignature = useMemo(
    () => animationCatalogSignature(subtypes, filters, page),
    [filters, page, subtypes],
  );

  const initialSignature = useRef(
    animationCatalogSignature(
      initialSubtypes,
      initialFilters,
      initialMeta.current_page || 1,
    ),
  );
  const isInitialQuery = fetchSignature === initialSignature.current;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const { data, isLoading, isValidating } = useSWR(
    `animation:${fetchSignature}`,
    async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      return fetchAnimationCatalogMerged(effectiveFilters, page, 24, controller.signal);
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

  const { data: latestData, isLoading: latestLoading } = useSWR(
    `animation:latest-slider:${subtypes.join(",")}:${subtypeGenreValues.join(",")}`,
    async () => {
      const result = await fetchAnimationCatalogMerged(
        latestFilters,
        1,
        LATEST_FETCH_POOL,
      );
      return {
        ...result,
        items: pickLatestSliderItems(result.items),
      };
    },
    {
      fallbackData: {
        items: initialLatestItems,
        meta: initialMeta,
        error: "",
      },
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  );

  const items = data?.items ?? initialItems;
  const meta = data?.meta ?? initialMeta;
  const error = data?.error ?? initialError;
  const loading = (isLoading || isValidating) && fetchSignature !== initialSignature.current;
  const latestItems = latestData?.items ?? initialLatestItems;

  const replaceQuery = useCallback(
    (
      nextSubtypes: SelectableAnimationSubtype[],
      nextFilters: CatalogFiltersState,
      nextPage = 1,
    ) => {
      const query = buildAnimationCatalogQueryString(nextSubtypes, nextFilters, nextPage);
      const target = query ? `${pathname}?${query}` : pathname;
      const current = `${pathname}${queryString ? `?${queryString}` : ""}`;
      if (target === current) {
        return;
      }
      router.replace(target, { scroll: false });
    },
    [pathname, queryString, router],
  );

  const applyFilters = useCallback(
    (next: CatalogFiltersState) => {
      replaceQuery(subtypes, {
        ...next,
        genres: [],
      });
    },
    [replaceQuery, subtypes],
  );

  const onPageChange = useCallback(
    (nextPage: number) => {
      replaceQuery(subtypes, filters, nextPage);
    },
    [filters, replaceQuery, subtypes],
  );

  const onSubtypesChange = useCallback(
    (nextSubtypes: SelectableAnimationSubtype[]) => {
      replaceQuery(nextSubtypes, filters, 1);
    },
    [filters, replaceQuery],
  );

  const loadMore =
    page < meta.last_page ? () => onPageChange(page + 1) : undefined;

  const clearAllFilters = useCallback(() => {
    replaceQuery([...DEFAULT_ANIMATION_SUBTYPES], EMPTY_CATALOG_FILTERS, 1);
  }, [replaceQuery]);

  return (
    <CatalogPage
      kind="movie"
      items={items}
      latestItems={latestItems}
      latestLoading={latestLoading && latestItems.length === 0}
      loading={loading}
      error={error}
      meta={meta}
      useItemKind
      filtersSlot={
        <>
          <CatalogFiltersBar
            kind="movie"
            filters={filters}
            filterOptions={filterOptions}
            onFiltersChange={applyFilters}
            hideGenreFilter
            animationSubtypeMode
            animationSubtypes={subtypes}
            onAnimationSubtypesChange={onSubtypesChange}
            onClearAll={clearAllFilters}
          />
          <ActiveFilterChips
            filters={effectiveFilters}
            filterOptions={filterOptions}
            lockedGenres={subtypeGenreValues}
            lockedGenreLabels={subtypeGenreLabels}
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
