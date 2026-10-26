"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { resolveVisibleCatalogError } from "../../lib/catalog/catalog-error";

const PAGE_SIZE = 24;

function mergeAnimationItems(
  existing: AnimationCatalogItem[],
  incoming: AnimationCatalogItem[],
): AnimationCatalogItem[] {
  const seen = new Set(existing.map((item) => `${item.catalogKind}:${item.id}`));
  const merged = [...existing];

  for (const item of incoming) {
    const key = `${item.catalogKind}:${item.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

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
  const subtypes = parseAnimationSubtypes(parseSearchParamsRecord(searchParams));

  const filters = useMemo(
    () => parseAnimationCatalogFilters(parseSearchParamsRecord(searchParams)),
    [queryString, searchParams],
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

  // Infinite scroll: signature ignores page (always accumulate from page 1).
  const fetchSignature = useMemo(
    () => animationCatalogSignature(subtypes, filters, 1),
    [filters, subtypes],
  );

  const initialSignature = useRef(
    animationCatalogSignature(initialSubtypes, initialFilters, 1),
  );
  const isInitialQuery = fetchSignature === initialSignature.current;
  const abortRef = useRef<AbortController | null>(null);

  const [extraItems, setExtraItems] = useState<AnimationCatalogItem[]>([]);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(
    () => (initialMeta.current_page || 1) < (initialMeta.last_page || 1),
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setExtraItems([]);
    setNextPage(2);
    setLoadMoreError("");
    setIsLoadingMore(false);
  }, [fetchSignature]);

  const { data, isLoading, isValidating } = useSWR(
    `animation:infinite:${fetchSignature}`,
    async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const result = await fetchAnimationCatalogMerged(
        effectiveFilters,
        1,
        PAGE_SIZE,
        controller.signal,
      );

      if (result.error && result.items.length === 0) {
        throw new Error(result.error);
      }

      return result;
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
      onSuccess: (result) => {
        setHasMore(result.meta.current_page < result.meta.last_page);
        setNextPage(2);
        setExtraItems([]);
      },
    },
  );

  const baseItems = (data?.items ?? (isInitialQuery ? initialItems : [])) as AnimationCatalogItem[];
  const meta = data?.meta ?? initialMeta;
  const items = useMemo(
    () => mergeAnimationItems(baseItems, extraItems),
    [baseItems, extraItems],
  );
  const error = resolveVisibleCatalogError({
    loadMoreError,
    dataError: data?.error,
    initialError,
    hasSettledData: data !== undefined,
    itemCount: items.length,
    isInitialQuery,
  });
  const loading =
    (isLoading || isValidating) &&
    extraItems.length === 0 &&
    (fetchSignature !== initialSignature.current || baseItems.length === 0);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isValidating) {
      return;
    }

    const pageToLoad = nextPage;
    if (pageToLoad > meta.last_page) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError("");

    void fetchAnimationCatalogMerged(effectiveFilters, pageToLoad, PAGE_SIZE)
      .then((result) => {
        if (result.error) {
          setLoadMoreError(result.error);
          return;
        }

        setExtraItems((current) =>
          mergeAnimationItems(current, result.items as AnimationCatalogItem[]),
        );
        const following = pageToLoad + 1;
        setNextPage(following);
        setHasMore(following <= result.meta.last_page);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setLoadMoreError(
          err instanceof Error ? err.message : "بارگذاری ادامه فهرست انجام نشد.",
        );
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [
    effectiveFilters,
    hasMore,
    isLoadingMore,
    isValidating,
    meta.last_page,
    nextPage,
  ]);

  const replaceQuery = useCallback(
    (nextSubtypes: SelectableAnimationSubtype[], nextFilters: CatalogFiltersState) => {
      const query = buildAnimationCatalogQueryString(nextSubtypes, nextFilters);
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

  const onSubtypesChange = useCallback(
    (nextSubtypes: SelectableAnimationSubtype[]) => {
      replaceQuery(nextSubtypes, filters);
    },
    [filters, replaceQuery],
  );

  const clearAllFilters = useCallback(() => {
    replaceQuery([...DEFAULT_ANIMATION_SUBTYPES], EMPTY_CATALOG_FILTERS);
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
      meta={{
        total: meta.total,
        per_page: meta.per_page,
        has_more: hasMore,
        current_page: meta.current_page,
        last_page: meta.last_page,
      }}
      useItemKind
      latestSliderSlot={latestSliderSlot}
      filtersSlot={filtersSlot}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={loadMore}
    />
  );
}
