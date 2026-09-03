"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type CatalogListItem,
} from "../lib/catalog/rest";
import {
  catalogFiltersSignature,
  type CatalogFiltersState,
} from "../lib/catalog/search-params";
import type { CarouselMeta } from "../types/carousel";
import { CATALOG_LIST_SWR_OPTIONS } from "../lib/swr/public-cache";

const DEFAULT_PAGE_SIZE = 24;

function mergeUniqueItems(
  existing: CatalogListItem[],
  incoming: CatalogListItem[],
  keyFn: (item: CatalogListItem) => string | number = (item) => item.id,
): CatalogListItem[] {
  const seen = new Set(existing.map(keyFn));
  const merged = [...existing];

  for (const item of incoming) {
    const key = keyFn(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

function toCarouselMeta(
  meta:
    | CarouselMeta
    | {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
      },
  pageSize: number,
): CarouselMeta {
  if ("has_more" in meta && "next_cursor" in meta) {
    return meta;
  }

  const currentPage = meta.current_page || 1;
  const lastPage = meta.last_page || 1;

  return {
    total: meta.total,
    per_page: meta.per_page || pageSize,
    current_page: currentPage,
    has_more: currentPage < lastPage,
    next_cursor: null,
  };
}

export type UseCatalogInfiniteOptions = {
  kind: "movie" | "series";
  filters: CatalogFiltersState;
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
  initialError?: string;
  pageSize?: number;
  itemKey?: (item: CatalogListItem) => string | number;
};

export type UseCatalogInfiniteReturn = {
  items: CatalogListItem[];
  meta: CarouselMeta;
  error: string;
  isFilterLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  loadedCount: number;
};

export function useCatalogInfinite({
  kind,
  filters,
  initialItems,
  initialMeta,
  initialFilters,
  initialError = "",
  pageSize = DEFAULT_PAGE_SIZE,
  itemKey,
}: UseCatalogInfiniteOptions): UseCatalogInfiniteReturn {
  const filterSignature = useMemo(() => catalogFiltersSignature(filters), [filters]);
  const initialSignature = useRef(catalogFiltersSignature(initialFilters));
  const isInitialQuery = filterSignature === initialSignature.current;

  const abortRef = useRef<AbortController | null>(null);
  const cursorCacheRef = useRef(
    new Map<string, { items: CatalogListItem[]; meta: CarouselMeta }>(),
  );
  const [extraItems, setExtraItems] = useState<CatalogListItem[]>([]);
  const [tailMeta, setTailMeta] = useState<CarouselMeta | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setExtraItems([]);
    setTailMeta(null);
    setLoadMoreError("");
    setIsLoadingMore(false);
    cursorCacheRef.current.clear();
  }, [filterSignature]);

  const { data, isLoading, isValidating, error: swrError } = useSWR(
    `${kind}:infinite:${filterSignature}`,
    async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const carouselFilters = { ...filters, carousel: true as const };
      const fetcher =
        kind === "movie" ? fetchMoviesCatalogRest : fetchSeriesCatalogRest;
      const result = await fetcher(carouselFilters, 1, pageSize, controller.signal);

      return {
        items: result.items,
        meta: result.meta as CarouselMeta,
        error: result.error,
      };
    },
    {
      fallbackData: isInitialQuery
        ? {
            items: initialItems,
            meta: toCarouselMeta(initialMeta, pageSize),
            error: initialError,
          }
        : undefined,
      ...CATALOG_LIST_SWR_OPTIONS,
    },
  );

  const baseItems = data?.items ?? (isInitialQuery ? initialItems : []);
  const baseMeta = toCarouselMeta(
    data?.meta ??
      (isInitialQuery
        ? initialMeta
        : { total: 0, per_page: pageSize, current_page: 1, last_page: 1 }),
    pageSize,
  );

  const items = useMemo(
    () => mergeUniqueItems(baseItems, extraItems, itemKey),
    [baseItems, extraItems, itemKey],
  );

  const meta = tailMeta ?? baseMeta;
  const hasMore = Boolean(meta.has_more && meta.next_cursor);
  const isFilterLoading =
    (isLoading || isValidating) &&
    filterSignature !== initialSignature.current &&
    extraItems.length === 0;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isValidating) {
      return;
    }

    const cursor = meta.next_cursor;
    if (!cursor) {
      return;
    }

    const cacheKey = `${filterSignature}:${cursor}`;
    const cached = cursorCacheRef.current.get(cacheKey);
    if (cached) {
      setExtraItems((current) => mergeUniqueItems(current, cached.items, itemKey));
      setTailMeta(cached.meta);
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError("");

    const carouselFilters = { ...filters, carousel: true as const };
    const fetcher =
      kind === "movie" ? fetchMoviesCatalogRest : fetchSeriesCatalogRest;

    void fetcher(carouselFilters, 1, pageSize, undefined, { cursor })
      .then((result) => {
        if (result.error) {
          setLoadMoreError(result.error);
          return;
        }

        setExtraItems((current) => mergeUniqueItems(current, result.items, itemKey));
        const nextMeta = result.meta as CarouselMeta;
        cursorCacheRef.current.set(cacheKey, {
          items: result.items,
          meta: nextMeta,
        });
        setTailMeta(nextMeta);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadMoreError(
          error instanceof Error ? error.message : "بارگذاری ادامه فهرست انجام نشد.",
        );
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [
    filters,
    hasMore,
    isLoadingMore,
    isValidating,
    itemKey,
    kind,
    meta.next_cursor,
    pageSize,
  ]);

  const error =
    loadMoreError ||
    data?.error ||
    (swrError instanceof Error ? swrError.message : "") ||
    (isInitialQuery ? initialError : "");

  return {
    items,
    meta,
    error,
    isFilterLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    loadedCount: items.length,
  };
}
