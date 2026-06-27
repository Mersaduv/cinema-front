"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import type { CarouselMeta, CarouselRailOptions, UseCarouselRailReturn } from "../types/carousel";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type CatalogListItem,
} from "../lib/catalog/rest";
import type { CatalogFiltersState } from "../lib/catalog/search-params";
import { getCarouselConfig } from "../lib/catalog/carousel-config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

type CarouselFetchKey = {
  kind: "movies" | "series";
  sort: string;
  cursor: string;
  batchSize: number;
  filters: CatalogFiltersState;
};

function mergeUniqueItems(
  existing: CatalogListItem[],
  incoming: CatalogListItem[],
): CatalogListItem[] {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];

  for (const item of incoming) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}

async function fetchCarouselBatch(key: CarouselFetchKey): Promise<{
  items: CatalogListItem[];
  meta: CarouselMeta;
}> {
  const filters: CatalogFiltersState & { carousel: true } = {
    ...key.filters,
    sort: key.sort,
    carousel: true,
  };

  const perPage = key.batchSize;
  const fetcher =
    key.kind === "movies" ? fetchMoviesCatalogRest : fetchSeriesCatalogRest;

  const result = await fetcher(filters, 1, perPage, undefined, {
    cursor: key.cursor,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    items: result.items,
    meta: result.meta as CarouselMeta,
  };
}

export function useCarouselRail(opts: CarouselRailOptions): UseCarouselRailReturn {
  const config = useMemo(
    () => getCarouselConfig(opts.initialMeta.total),
    [opts.initialMeta.total],
  );

  const batchSize = opts.batchSize ?? config.batchSize;

  const baseFilters = useMemo<CatalogFiltersState>(
    () =>
      opts.filters ?? {
        search: "",
        sort: opts.sort,
        genres: [],
        countries: [],
        languages: [],
        year_from: null,
        year_to: null,
        min_rating: "",
      },
    [opts.filters, opts.sort],
  );

  const [items, setItems] = useState<CatalogListItem[]>(opts.initialItems);
  const [meta, setMeta] = useState<CarouselMeta>(opts.initialMeta);
  const [pendingCursor, setPendingCursor] = useState<string | null>(null);
  const isLoadingMoreRef = useRef(false);

  const swrKey = pendingCursor
    ? {
        kind: opts.kind,
        sort: opts.sort,
        cursor: pendingCursor,
        batchSize,
        filters: baseFilters,
      }
    : null;

  const { isValidating } = useSWR(swrKey, fetchCarouselBatch, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
    onSuccess: (data) => {
      setItems((current) => mergeUniqueItems(current, data.items));
      setMeta((current) => ({
        ...current,
        ...data.meta,
        total: Math.max(current.total, data.meta.total),
      }));
      setPendingCursor(null);
      isLoadingMoreRef.current = false;
    },
    onError: () => {
      setPendingCursor(null);
      isLoadingMoreRef.current = false;
    },
  });

  const hasMore = meta.has_more && items.length < config.maxItems && items.length < meta.total;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMoreRef.current || isValidating || pendingCursor) {
      return;
    }

    const nextCursor = meta.next_cursor;

    if (!nextCursor) {
      return;
    }

    isLoadingMoreRef.current = true;
    setPendingCursor(nextCursor);
  }, [hasMore, isValidating, meta.next_cursor, pendingCursor]);

  return {
    items,
    isLoadingMore: isValidating || pendingCursor !== null,
    hasMore,
    total: meta.total,
    loadMore,
  };
}

export function buildCarouselRestUrl(
  kind: "movies" | "series",
  filters: CatalogFiltersState,
  perPage: number,
  cursor?: string | null,
): string {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("per_page", String(perPage));
  params.set("carousel", "1");

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.genres.length) params.set("genre_ids", filters.genres.join(","));
  if (filters.countries.length) params.set("countries", filters.countries.join(","));
  if (filters.languages.length) params.set("languages", filters.languages.join(","));
  if (filters.year_from) params.set("year_from", String(filters.year_from));
  if (filters.year_to) params.set("year_to", String(filters.year_to));
  if (filters.min_rating) params.set("min_rating", filters.min_rating);
  if (cursor) params.set("cursor", cursor);

  const path = kind === "movies" ? "movies" : "series";

  return `${API_BASE_URL}/${path}?${params.toString()}`;
}
