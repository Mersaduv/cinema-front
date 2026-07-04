import type { ResponsiveImage } from "../cinema-image";
import type { CatalogListItem, PaginationMeta } from "../catalog/rest";
import { toCatalogItem } from "../catalog/rest";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

export type CollectionListItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  poster_url: string | null;
  poster_blur_url?: string | null;
  poster_srcset?: string | null;
  poster_image?: ResponsiveImage | null;
  backdrop_url?: string | null;
  backdrop_blur_url?: string | null;
  backdrop_srcset?: string | null;
  backdrop_image?: ResponsiveImage | null;
  movies_count: number;
};

export type CollectionDetail = CollectionListItem & {
  movies: CatalogListItem[];
};

function toCollectionItem(row: Record<string, unknown>): CollectionListItem {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    description: (row.description as string | null) ?? null,
    poster_url: (row.poster_url as string | null) ?? null,
    poster_blur_url: (row.poster_blur_url as string | null) ?? null,
    poster_srcset: (row.poster_srcset as string | null) ?? null,
    poster_image: (row.poster_image as ResponsiveImage | null) ?? null,
    backdrop_url: (row.backdrop_url as string | null) ?? null,
    backdrop_blur_url: (row.backdrop_blur_url as string | null) ?? null,
    backdrop_srcset: (row.backdrop_srcset as string | null) ?? null,
    backdrop_image: (row.backdrop_image as ResponsiveImage | null) ?? null,
    movies_count: Number(row.movies_count ?? 0),
  };
}

export type CollectionsFetchOptions = {
  /** When true, bypass Next fetch cache — parent `"use cache"` owns TTL. */
  skipFetchCache?: boolean;
};

export async function fetchCollectionsCatalogRest(
  page = 1,
  perPage = 24,
  search = "",
  signal?: AbortSignal,
  options?: CollectionsFetchOptions,
): Promise<{ items: CollectionListItem[]; meta: PaginationMeta; error: string }> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    if (search.trim()) params.set("search", search.trim());

    const isServer = typeof window === "undefined";
    const response = await fetch(`${API_BASE_URL}/collections?${params}`, {
      headers: { Accept: "application/json", "Accept-Encoding": "gzip" },
      ...(isServer
        ? options?.skipFetchCache
          ? { cache: "no-store" as const }
          : { next: { revalidate: 60, tags: ["catalog"] } }
        : { cache: "default" }),
      signal,
    });

    if (!response.ok) {
      return {
        items: [],
        meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 },
        error: "دریافت مجموعه‌ها انجام نشد.",
      };
    }

    const json = (await response.json()) as {
      success: boolean;
      data?: {
        collections: Record<string, unknown>[];
        pagination: PaginationMeta;
      };
    };

    return {
      items: (json.data?.collections ?? []).map(toCollectionItem),
      meta: json.data?.pagination ?? {
        total: 0,
        per_page: perPage,
        current_page: page,
        last_page: 1,
      },
      error: "",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return {
      items: [],
      meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 },
      error: error instanceof Error ? error.message : "دریافت مجموعه‌ها انجام نشد.",
    };
  }
}

export async function fetchCollectionDetailRest(
  slug: string,
  signal?: AbortSignal,
): Promise<{ collection: CollectionDetail | null; error: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json", "Accept-Encoding": "gzip" },
      ...(typeof window === "undefined"
        ? { next: { revalidate: 60, tags: ["catalog"] } }
        : { cache: "default" }),
      signal,
    });

    if (!response.ok) {
      return { collection: null, error: "مجموعه یافت نشد." };
    }

    const json = (await response.json()) as {
      success: boolean;
      data?: { collection: Record<string, unknown> };
    };

    const raw = json.data?.collection;
    if (!raw) return { collection: null, error: "مجموعه یافت نشد." };

    const movies = Array.isArray(raw.movies)
      ? (raw.movies as Record<string, unknown>[]).map((row) =>
          toCatalogItem(row, "has_dubbed_audio"),
        )
      : [];

    return {
      collection: { ...toCollectionItem(raw), movies },
      error: "",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return {
      collection: null,
      error: error instanceof Error ? error.message : "دریافت مجموعه انجام نشد.",
    };
  }
}
