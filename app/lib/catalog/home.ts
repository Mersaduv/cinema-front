import type { AnimationCatalogItem } from "./animation";
import { getCatalogItemHref } from "./animation";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "./carousel-config";
import { LATEST_CATALOG_FILTERS, sortCatalogByReleaseYear } from "./latest";
import type { CarouselMeta } from "../../types/carousel";
import type { CatalogFiltersState } from "./search-params";
import type { CatalogListItem, PaginationMeta } from "./rest";
import { isCarouselMeta } from "./rest";

export const HOME_RAIL_FETCH_COUNT = HOME_RAIL_CAROUSEL_PER_PAGE;
export const HOME_FEATURED_POOL = 24;
export const HOME_FEATURED_SLIDES = 5;

const carouselDefaults = { carousel: true } as const;

export const HOME_LATEST_MOVIES_FILTERS: CatalogFiltersState = {
  ...LATEST_CATALOG_FILTERS,
};

export const HOME_LATEST_SERIES_FILTERS: CatalogFiltersState = {
  ...LATEST_CATALOG_FILTERS,
};

export const HOME_TOP_RATED_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "top_rated",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "7",
  ...carouselDefaults,
};

export const HOME_FRESH_MOVIES_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "newest",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
  ...carouselDefaults,
};

export const HOME_FRESH_SERIES_FILTERS: CatalogFiltersState = {
  ...HOME_FRESH_MOVIES_FILTERS,
};

export const HOME_POPULAR_MOVIES_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "popular",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
  ...carouselDefaults,
};

export const HOME_POPULAR_SERIES_FILTERS: CatalogFiltersState = {
  ...HOME_POPULAR_MOVIES_FILTERS,
};

export const HOME_TRENDING_MOVIES_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "trending",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
  ...carouselDefaults,
};

export const HOME_TRENDING_SERIES_FILTERS: CatalogFiltersState = {
  ...HOME_TRENDING_MOVIES_FILTERS,
};

export const HOME_TRENDING_FALLBACK_MOVIES_FILTERS: CatalogFiltersState = {
  ...HOME_TRENDING_MOVIES_FILTERS,
  sort: "trending_fallback",
};

export const HOME_TRENDING_FALLBACK_SERIES_FILTERS: CatalogFiltersState = {
  ...HOME_TRENDING_SERIES_FILTERS,
  sort: "trending_fallback",
};

export const HOME_POPULAR_HYBRID_MOVIES_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "popular_hybrid",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
  ...carouselDefaults,
};

export const HOME_LATEST_RAIL_MOVIES_FILTERS: CatalogFiltersState = {
  ...LATEST_CATALOG_FILTERS,
  ...carouselDefaults,
};

export const HOME_LATEST_RAIL_SERIES_FILTERS: CatalogFiltersState = {
  ...LATEST_CATALOG_FILTERS,
  ...carouselDefaults,
};

export type FeaturedCatalogItem = CatalogListItem & {
  catalogKind: "movie" | "series";
};

function withKind(
  items: CatalogListItem[],
  kind: "movie" | "series",
): FeaturedCatalogItem[] {
  return items.map((item) => ({ ...item, catalogKind: kind }));
}

export function pickFeaturedHeroSlides(
  movies: CatalogListItem[],
  series: CatalogListItem[],
  limit = HOME_FEATURED_SLIDES,
): FeaturedCatalogItem[] {
  const merged = sortCatalogByReleaseYear([
    ...withKind(movies, "movie"),
    ...withKind(series, "series"),
  ]);

  const withBackdrop = merged.filter(
    (item) => item.backdrop_url ?? item.details.backdrop_url ?? item.poster_url,
  );

  const pool = withBackdrop.length > 0 ? withBackdrop : merged;
  return pool.slice(0, limit);
}

export function sliceHomeRailItems<T extends CatalogListItem>(
  items: T[],
  limit = HOME_RAIL_FETCH_COUNT,
): T[] {
  return items.slice(0, limit);
}

export function toCarouselMeta(
  meta: PaginationMeta | CarouselMeta,
  itemCount: number,
): CarouselMeta {
  if (isCarouselMeta(meta)) {
    return meta;
  }

  const perPage = meta.per_page ?? HOME_RAIL_CAROUSEL_PER_PAGE;

  return {
    current_page: meta.current_page ?? 1,
    per_page: perPage,
    total: meta.total,
    has_more: itemCount < meta.total,
    next_cursor: null,
  };
}

export function buildStaticCarouselMeta(total: number, itemCount: number): CarouselMeta {
  return {
    current_page: 1,
    per_page: HOME_RAIL_CAROUSEL_PER_PAGE,
    total,
    has_more: false,
    next_cursor: null,
  };
}

export function pickTrendingHomeItems(
  movies: CatalogListItem[],
  series: CatalogListItem[],
  fallbackMovies: CatalogListItem[],
  fallbackSeries: CatalogListItem[],
  limit = HOME_RAIL_CAROUSEL_PER_PAGE,
): Array<CatalogListItem & { catalogKind: "movie" | "series" }> {
  const merged = [
    ...movies.map((item) => ({ ...item, catalogKind: "movie" as const })),
    ...series.map((item) => ({ ...item, catalogKind: "series" as const })),
  ];

  if (merged.length >= 6) {
    return merged.slice(0, limit);
  }

  const existingSlugs = new Set(merged.map((item) => item.slug));
  const fallback = [
    ...fallbackMovies.map((item) => ({ ...item, catalogKind: "movie" as const })),
    ...fallbackSeries.map((item) => ({ ...item, catalogKind: "series" as const })),
  ].filter((item) => !existingSlugs.has(item.slug));

  return [...merged, ...fallback].slice(0, limit);
}

export function pickFreshHomeItems(
  movies: CatalogListItem[],
  series: CatalogListItem[],
  limit = HOME_RAIL_CAROUSEL_PER_PAGE,
): Array<CatalogListItem & { catalogKind: "movie" | "series" }> {
  const merged: Array<CatalogListItem & { catalogKind: "movie" | "series" }> = [];
  const maxLen = Math.max(movies.length, series.length);

  for (let index = 0; index < maxLen; index += 1) {
    if (movies[index]) {
      merged.push({ ...movies[index], catalogKind: "movie" });
    }
    if (series[index]) {
      merged.push({ ...series[index], catalogKind: "series" });
    }
  }

  return merged.slice(0, limit);
}

export function buildFeaturedDetailHref(item: FeaturedCatalogItem | AnimationCatalogItem): string {
  return getCatalogItemHref(item);
}

export function buildFeaturedWatchHref(item: FeaturedCatalogItem): string {
  if (item.catalogKind === "series") {
    return `/watch/${item.slug}?season=1&episode=1`;
  }

  return `/watch/${item.slug}`;
}

export function formatFeaturedMetadata(item: FeaturedCatalogItem): string {
  const parts: string[] = [];

  if (item.release_year) {
    parts.push(String(item.release_year));
  }

  if (item.catalogKind === "series") {
    parts.push("سریال");
  } else {
    parts.push("فیلم");
  }

  const rating = item.rating ?? item.details.rating;
  if (rating != null && !Number.isNaN(rating)) {
    parts.push(`IMDb ${Math.round(rating * 10) / 10}`);
  }

  return parts.join(" · ");
}
