"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ActiveFilterChips from "./ActiveFilterChips";
import CatalogFiltersBar from "./CatalogFiltersBar";
import CatalogPage from "./CatalogPage";
import { CatalogFiltersBarSkeleton } from "../skeletons/CatalogPageSkeleton";
import { useFilterOptions } from "../../hooks/useFilterOptions";
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
import { parseSearchParamsRecord } from "../../lib/catalog/search-params";
import type { PaginationMeta } from "../../lib/catalog/rest";
import { CATALOG_LIST_SWR_OPTIONS } from "../../lib/swr/public-cache";

export default function AnimationCatalogClient({
  initialSubtypes,
  initialItems,
  initialMeta,
  initialFilters,
  initialError,
  latestSliderSlot,
}: {
  initialSubtypes: SelectableAnimationSubtype[];
  initialItems: AnimationCatalogItem[];
  initialMeta: PaginationMeta;
  initialFilters: CatalogFiltersState;
  initialError: string;
  latestSliderSlot?: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AnimationCatalogClientInner
        initialSubtypes={initialSubtypes}
        initialItems={initialItems}
        initialMeta={initialMeta}
        initialFilters={initialFilters}
        initialError={initialError}
        latestSliderSlot={latestSliderSlot}
      />
    </Suspense>
  );
}

function AnimationCatalogClientInner({
  initialSubtypes,
  initialItems,
  initialMeta,
  initialFilters,
  initialError,
  latestSliderSlot,
}: {
  initialSubtypes: SelectableAnimationSubtype[];
  initialItems: AnimationCatalogItem[];
  initialMeta: PaginationMeta;
  initialFilters: CatalogFiltersState;
  initialError: string;
  latestSliderSlot?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filterOptions, filterOptionsLoading } = useFilterOptions();

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
      ...CATALOG_LIST_SWR_OPTIONS,
    },
  );

  const items = data?.items ?? initialItems;
  const meta = data?.meta ?? initialMeta;
  const error = data?.error ?? initialError;
  const loading = (isLoading || isValidating) && fetchSignature !== initialSignature.current;

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

  const filtersSlot = (
    <div className="space-y-4">
      {filterOptionsLoading ? (
        <CatalogFiltersBarSkeleton />
      ) : (
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
      )}
    </div>
  );

  return (
    <CatalogPage
      kind="movie"
      items={items}
      loading={loading}
      error={error}
      meta={meta}
      useItemKind
      latestSliderSlot={latestSliderSlot}
      filtersSlot={filtersSlot}
      onPageChange={onPageChange}
      onLoadMore={loadMore}
    />
  );
}
