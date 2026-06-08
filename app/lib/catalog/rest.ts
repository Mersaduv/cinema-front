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
  title: string;
  slug: string;
  synopsis: string | null;
  release_year: number | null;
  poster_url: string | null;
  backdrop_url?: string | null;
  status_label_fa?: string | null;
  has_subtitle?: boolean;
  has_dubbed?: boolean;
  has_dubbed_audio?: boolean;
  rating?: number | null;
  playback_quality?: string | null;
  details: {
    genres: string[];
    backdrop_url?: string | null;
    rating?: number | null;
  };
};

function buildQueryParams(
  filters: CatalogFiltersState,
  page: number,
  perPage: number,
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(perPage));

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.sort) {
    params.set("sort", filters.sort);
  }
  filters.genres.forEach((genreId) => params.append("genre_ids", genreId));
  filters.countries.forEach((iso) => params.append("countries", iso));
  filters.languages.forEach((iso) => params.append("languages", iso));
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

  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    synopsis: (row.synopsis as string | null) ?? null,
    release_year: (row.release_year as number | null) ?? null,
    poster_url: (row.poster_url as string | null) ?? null,
    backdrop_url: (row.backdrop_url as string | null) ?? details.backdrop_url ?? null,
    status_label_fa: (row.status_label_fa as string | null) ?? null,
    has_subtitle: Boolean(row.has_subtitle),
    has_dubbed: Boolean(row[dubbedKey]),
    rating: (row.rating as number | null) ?? (details.rating as number | null) ?? null,
    playback_quality: (row.playback_quality as string | null) ?? null,
    details: {
      ...details,
      genres: genreNames.length > 0 ? genreNames : details.genres,
    },
  };
}

export async function fetchMoviesCatalogRest(
  filters: CatalogFiltersState,
  page = 1,
  perPage = 24,
  signal?: AbortSignal,
): Promise<{ items: CatalogListItem[]; meta: PaginationMeta; error: string }> {
  try {
    const query = buildQueryParams(filters, page, perPage);
    const isServer = typeof window === "undefined";
    const response = await fetch(`${API_BASE_URL}/movies?${query}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
      ...(isServer ? { next: { revalidate: 300 } } : { cache: "no-store" }),
      signal,
    });
    if (!response.ok) {
      return {
        items: [],
        meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 },
        error: "دریافت فیلم‌ها انجام نشد.",
      };
    }
    const json = (await response.json()) as {
      success: boolean;
      data?: {
        movies: Record<string, unknown>[];
        pagination: PaginationMeta;
      };
    };
    return {
      items: (json.data?.movies ?? []).map((row) =>
        toCatalogItem(row, "has_dubbed_audio"),
      ),
      meta: json.data?.pagination ?? {
        total: 0,
        per_page: perPage,
        current_page: page,
        last_page: 1,
      },
      error: "",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        items: [],
        meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 },
        error: "",
      };
    }
    return {
      items: [],
      meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 },
      error: error instanceof Error ? error.message : "دریافت فیلم‌ها انجام نشد.",
    };
  }
}

export async function fetchSeriesCatalogRest(
  filters: CatalogFiltersState,
  page = 1,
  perPage = 24,
  signal?: AbortSignal,
): Promise<{ items: CatalogListItem[]; meta: PaginationMeta; error: string }> {
  try {
    const query = buildQueryParams(filters, page, perPage);
    const isServer = typeof window === "undefined";
    const response = await fetch(`${API_BASE_URL}/series?${query}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
      ...(isServer ? { next: { revalidate: 300 } } : { cache: "no-store" }),
      signal,
    });
    if (!response.ok) {
      return {
        items: [],
        meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 },
        error: "دریافت سریال‌ها انجام نشد.",
      };
    }
    const json = (await response.json()) as {
      success: boolean;
      data?: {
        series: Record<string, unknown>[];
        pagination: PaginationMeta;
      };
    };
    return {
      items: (json.data?.series ?? []).map((row) => toCatalogItem(row, "has_dubbed")),
      meta: json.data?.pagination ?? {
        total: 0,
        per_page: perPage,
        current_page: page,
        last_page: 1,
      },
      error: "",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        items: [],
        meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 },
        error: "",
      };
    }
    return {
      items: [],
      meta: { total: 0, per_page: perPage, current_page: page, last_page: 1 },
      error: error instanceof Error ? error.message : "دریافت سریال‌ها انجام نشد.",
    };
  }
}
