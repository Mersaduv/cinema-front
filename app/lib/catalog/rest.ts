import type { ResponsiveImage } from "../cinema-image";
import type { CarouselMeta } from "../../types/carousel";
import type { CatalogFiltersState } from "./search-params";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

export type PaginationMeta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

export type CatalogListItem = {
  id: number;
  catalogKind?: "movie" | "series";
  title: string;
  slug: string;
  synopsis: string | null;
  release_year: number | null;
  published_at?: string | null;
  updated_at?: string | null;
  poster_url: string | null;
  poster_blur_url?: string | null;
  poster_srcset?: string | null;
  poster_image?: ResponsiveImage | null;
  backdrop_url?: string | null;
  backdrop_blur_url?: string | null;
  backdrop_srcset?: string | null;
  backdrop_image?: ResponsiveImage | null;
  status_label_fa?: string | null;
  has_subtitle?: boolean;
  has_dubbed?: boolean;
  has_dubbed_audio?: boolean;
  rating?: number | null;
  playback_quality?: string | null;
  content_type?: "movie" | "series";
  is_featured?: boolean;
  exclude_from_slider?: boolean;
  catalog_visibility?: string;
  details: {
    genres: string[];
    backdrop_url?: string | null;
    rating?: number | null;
  };
};

export type CatalogFetchOptions = {
  cursor?: string | null;
  /** When true, bypass Next fetch cache — parent `"use cache"` owns TTL. */
  skipFetchCache?: boolean;
};

export type CatalogFetchResult = {
  items: CatalogListItem[];
  error: string;
};

export type MoviesCatalogFetchResult = CatalogFetchResult & {
  meta: PaginationMeta;
};

export type MoviesCarouselFetchResult = CatalogFetchResult & {
  meta: CarouselMeta;
};

function buildQueryParams(
  filters: CatalogFiltersState,
  page: number,
  perPage: number,
  options?: CatalogFetchOptions,
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(perPage));

  if (filters.carousel) {
    params.set("carousel", "1");
  }

  if (options?.cursor) {
    params.set("cursor", options.cursor);
  }

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.sort) {
    params.set("sort", filters.sort);
  }
  if (filters.genres.length) params.set("genre_ids", filters.genres.join(","));
  if (filters.countries.length) params.set("countries", filters.countries.join(","));
  if (filters.languages.length) params.set("languages", filters.languages.join(","));
  if (filters.year_from) {
    params.set("year_from", String(filters.year_from));
  }
  if (filters.year_to) {
    params.set("year_to", String(filters.year_to));
  }
  if (filters.min_rating) {
    params.set("min_rating", filters.min_rating);
  }

  return params.toString();
}

export function toCatalogItem(
  row: Record<string, unknown>,
  dubbedKey: "has_dubbed" | "has_dubbed_audio",
): CatalogListItem {
  const details = (row.details as CatalogListItem["details"]) ?? { genres: [] };
  const genreNames = Array.isArray(row.genres)
    ? (row.genres as Array<{ name?: string }>).map((g) => g.name ?? "").filter(Boolean)
    : details.genres;

  const contentType = row.content_type as "movie" | "series" | undefined;

  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    synopsis: (row.synopsis as string | null) ?? null,
    release_year: (row.release_year as number | null) ?? null,
    published_at: typeof row.published_at === "string" ? row.published_at : null,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    poster_url: (row.poster_url as string | null) ?? null,
    poster_blur_url: (row.poster_blur_url as string | null) ?? null,
    poster_srcset: (row.poster_srcset as string | null) ?? null,
    poster_image: (row.poster_image as ResponsiveImage | null) ?? null,
    backdrop_url: (row.backdrop_url as string | null) ?? details.backdrop_url ?? null,
    backdrop_blur_url: (row.backdrop_blur_url as string | null) ?? null,
    backdrop_srcset: (row.backdrop_srcset as string | null) ?? null,
    backdrop_image: (row.backdrop_image as ResponsiveImage | null) ?? null,
    status_label_fa: (row.status_label_fa as string | null) ?? null,
    has_subtitle: Boolean(row.has_subtitle),
    has_dubbed: Boolean(row[dubbedKey]),
    rating:
      (row.rating as number | null) ??
      (row.filter_rating as number | null) ??
      (details.rating as number | null) ??
      null,
    playback_quality: (row.playback_quality as string | null) ?? null,
    content_type: contentType,
    is_featured: Boolean(row.is_featured),
    exclude_from_slider: Boolean(row.exclude_from_slider),
    catalog_visibility:
      typeof row.catalog_visibility === "string" ? row.catalog_visibility : undefined,
    catalogKind: contentType,
    details: {
      ...details,
      genres: genreNames.length > 0 ? genreNames : details.genres,
    },
  };
}

function emptyPaginationMeta(perPage: number, page: number): PaginationMeta {
  return { total: 0, per_page: perPage, current_page: page, last_page: 1 };
}

function emptyCarouselMeta(perPage: number, page: number): CarouselMeta {
  return {
    total: 0,
    per_page: perPage,
    current_page: page,
    has_more: false,
    next_cursor: null,
  };
}

export function isCarouselMeta(meta: PaginationMeta | CarouselMeta): meta is CarouselMeta {
  return "has_more" in meta && "next_cursor" in meta;
}

export async function fetchMoviesCatalogRest(
  filters: CatalogFiltersState & { carousel: true },
  page?: number,
  perPage?: number,
  signal?: AbortSignal,
  options?: CatalogFetchOptions,
): Promise<MoviesCarouselFetchResult>;
export async function fetchMoviesCatalogRest(
  filters: CatalogFiltersState,
  page?: number,
  perPage?: number,
  signal?: AbortSignal,
  options?: CatalogFetchOptions,
): Promise<MoviesCatalogFetchResult>;
export async function fetchMoviesCatalogRest(
  filters: CatalogFiltersState,
  page = 1,
  perPage = 24,
  signal?: AbortSignal,
  options?: CatalogFetchOptions,
): Promise<MoviesCatalogFetchResult | MoviesCarouselFetchResult> {
  try {
    const query = buildQueryParams(filters, page, perPage, options);
    const isServer = typeof window === "undefined";
    const response = await fetch(`${API_BASE_URL}/movies?${query}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
      ...(isServer
        ? options?.skipFetchCache
          ? { cache: "no-store" as const }
          : { next: { revalidate: 60, tags: ["catalog", "catalog-movies"] } }
        : { cache: "default" }),
      signal,
    });
    if (!response.ok) {
      if (filters.carousel) {
        return {
          items: [],
          meta: emptyCarouselMeta(perPage, page),
          error: "دریافت فیلم‌ها انجام نشد.",
        };
      }

      return {
        items: [],
        meta: emptyPaginationMeta(perPage, page),
        error: "دریافت فیلم‌ها انجام نشد.",
      };
    }

    const json = (await response.json()) as {
      success: boolean;
      data?:
        | Record<string, unknown>[]
        | {
            movies: Record<string, unknown>[];
            pagination: PaginationMeta;
          };
      meta?: CarouselMeta;
    };

    if (filters.carousel && Array.isArray(json.data)) {
      return {
        items: json.data.map((row) => toCatalogItem(row, "has_dubbed_audio")),
        meta: json.meta ?? emptyCarouselMeta(perPage, page),
        error: "",
      };
    }

    const payload = json.data as {
      movies: Record<string, unknown>[];
      pagination: PaginationMeta;
    };

    return {
      items: (payload?.movies ?? []).map((row) => toCatalogItem(row, "has_dubbed_audio")),
      meta: payload?.pagination ?? emptyPaginationMeta(perPage, page),
      error: "",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (filters.carousel) {
      return {
        items: [],
        meta: emptyCarouselMeta(perPage, page),
        error: error instanceof Error ? error.message : "دریافت فیلم‌ها انجام نشد.",
      };
    }

    return {
      items: [],
      meta: emptyPaginationMeta(perPage, page),
      error: error instanceof Error ? error.message : "دریافت فیلم‌ها انجام نشد.",
    };
  }
}

export async function fetchSeriesCatalogRest(
  filters: CatalogFiltersState & { carousel: true },
  page?: number,
  perPage?: number,
  signal?: AbortSignal,
  options?: CatalogFetchOptions,
): Promise<MoviesCarouselFetchResult>;
export async function fetchSeriesCatalogRest(
  filters: CatalogFiltersState,
  page?: number,
  perPage?: number,
  signal?: AbortSignal,
  options?: CatalogFetchOptions,
): Promise<MoviesCatalogFetchResult>;
export async function fetchSeriesCatalogRest(
  filters: CatalogFiltersState,
  page = 1,
  perPage = 24,
  signal?: AbortSignal,
  options?: CatalogFetchOptions,
): Promise<MoviesCatalogFetchResult | MoviesCarouselFetchResult> {
  try {
    const query = buildQueryParams(filters, page, perPage, options);
    const isServer = typeof window === "undefined";
    const response = await fetch(`${API_BASE_URL}/series?${query}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
      ...(isServer
        ? options?.skipFetchCache
          ? { cache: "no-store" as const }
          : { next: { revalidate: 60, tags: ["catalog", "catalog-series"] } }
        : { cache: "default" }),
      signal,
    });
    if (!response.ok) {
      if (filters.carousel) {
        return {
          items: [],
          meta: emptyCarouselMeta(perPage, page),
          error: "دریافت سریال‌ها انجام نشد.",
        };
      }

      return {
        items: [],
        meta: emptyPaginationMeta(perPage, page),
        error: "دریافت سریال‌ها انجام نشد.",
      };
    }

    const json = (await response.json()) as {
      success: boolean;
      data?:
        | Record<string, unknown>[]
        | {
            series: Record<string, unknown>[];
            pagination: PaginationMeta;
          };
      meta?: CarouselMeta;
    };

    if (filters.carousel && Array.isArray(json.data)) {
      return {
        items: json.data.map((row) => toCatalogItem(row, "has_dubbed")),
        meta: json.meta ?? emptyCarouselMeta(perPage, page),
        error: "",
      };
    }

    const payload = json.data as {
      series: Record<string, unknown>[];
      pagination: PaginationMeta;
    };

    return {
      items: (payload?.series ?? []).map((row) => toCatalogItem(row, "has_dubbed")),
      meta: payload?.pagination ?? emptyPaginationMeta(perPage, page),
      error: "",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (filters.carousel) {
      return {
        items: [],
        meta: emptyCarouselMeta(perPage, page),
        error: error instanceof Error ? error.message : "دریافت سریال‌ها انجام نشد.",
      };
    }

    return {
      items: [],
      meta: emptyPaginationMeta(perPage, page),
      error: error instanceof Error ? error.message : "دریافت سریال‌ها انجام نشد.",
    };
  }
}
