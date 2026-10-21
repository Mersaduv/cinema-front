import type { AnimationCatalogItem } from "./animation";
import { getCatalogItemHref } from "./animation";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "./carousel-config";
import { filterHomeSliderItems } from "./home-visibility";
import { LATEST_CATALOG_FILTERS } from "./latest";
import type { CarouselMeta } from "../../types/carousel";
import type { CatalogFiltersState } from "./search-params";
import type { CatalogListItem, PaginationMeta } from "./rest";
import { isCarouselMeta } from "./rest";

export const HOME_RAIL_FETCH_COUNT = HOME_RAIL_CAROUSEL_PER_PAGE;
export const HOME_FEATURED_POOL = 7;
export const HOME_FEATURED_SLIDES = 7;
export const HOME_FEATURED_EDITORIAL_MAX = 7;
export const HOME_HERO_MIN_RATING = 6;
export const HOME_SITE_FRESH_MAX = 20;
export const HOME_SITE_FRESH_INITIAL = 6;

const carouselDefaults = { carousel: true } as const;

export const HOME_FEATURED_EDITORIAL_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "featured",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
};

/** Hero pools need full catalog DTO (backdrop, is_featured) — not carousel cards. */
export const HOME_HERO_HYBRID_MOVIES_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "popular_hybrid",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
};

export const HOME_HERO_HYBRID_SERIES_FILTERS: CatalogFiltersState = {
  ...HOME_HERO_HYBRID_MOVIES_FILTERS,
};

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
  sort: "updated",
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

export const HOME_POPULAR_HYBRID_SERIES_FILTERS: CatalogFiltersState = {
  ...HOME_POPULAR_HYBRID_MOVIES_FILTERS,
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

function itemRating(item: CatalogListItem): number | null {
  const rating = item.rating ?? item.details.rating;

  if (rating == null || Number.isNaN(rating)) {
    return null;
  }

  return rating;
}

function hasHeroBackdrop(item: CatalogListItem): boolean {
  return Boolean(
    item.backdrop_url ??
      item.details.backdrop_url ??
      item.backdrop_image ??
      item.poster_url ??
      item.poster_image,
  );
}

function dedupeFeaturedBySlug(items: FeaturedCatalogItem[]): FeaturedCatalogItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.slug)) {
      return false;
    }

    seen.add(item.slug);
    return true;
  });
}

export function pickFeaturedHeroSlides(
  newestMovies: CatalogListItem[],
  newestSeries: CatalogListItem[],
  hybridMovies: CatalogListItem[],
  hybridSeries: CatalogListItem[],
  featuredMovies: CatalogListItem[] = [],
  featuredSeries: CatalogListItem[] = [],
  limit = HOME_FEATURED_SLIDES,
): FeaturedCatalogItem[] {
  const editorialCandidates = dedupeFeaturedBySlug([
    ...withKind(filterHomeSliderItems(featuredMovies), "movie"),
    ...withKind(filterHomeSliderItems(featuredSeries), "series"),
    ...withKind(filterHomeSliderItems(newestMovies), "movie"),
    ...withKind(filterHomeSliderItems(newestSeries), "series"),
    ...withKind(filterHomeSliderItems(hybridMovies), "movie"),
    ...withKind(filterHomeSliderItems(hybridSeries), "series"),
  ]).filter(
    (item) => item.is_featured && hasHeroBackdrop(item),
  );

  const editorial = editorialCandidates.slice(0, HOME_FEATURED_EDITORIAL_MAX);
  const editorialSlugs = new Set(editorial.map((item) => item.slug));

  const algorithmPool = dedupeFeaturedBySlug([
    ...withKind(filterHomeSliderItems(hybridMovies), "movie"),
    ...withKind(filterHomeSliderItems(hybridSeries), "series"),
  ]).filter((item) => {
    if (editorialSlugs.has(item.slug)) {
      return false;
    }

    if (!hasHeroBackdrop(item)) {
      return false;
    }

    const rating = itemRating(item);

    return rating != null && rating >= HOME_HERO_MIN_RATING;
  });

  return [...editorial, ...algorithmPool].slice(0, limit);
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
    ...filterHomeSliderItems(movies).map((item) => ({ ...item, catalogKind: "movie" as const })),
    ...filterHomeSliderItems(series).map((item) => ({ ...item, catalogKind: "series" as const })),
  ];

  if (merged.length >= 6) {
    return merged.slice(0, limit);
  }

  const existingSlugs = new Set(merged.map((item) => item.slug));
  const fallback = [
    ...filterHomeSliderItems(fallbackMovies).map((item) => ({ ...item, catalogKind: "movie" as const })),
    ...filterHomeSliderItems(fallbackSeries).map((item) => ({ ...item, catalogKind: "series" as const })),
  ].filter((item) => !existingSlugs.has(item.slug));

  return [...merged, ...fallback].slice(0, limit);
}

export function sortBySitePublishedAt<
  T extends { updated_at?: string | null; published_at?: string | null },
>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.updated_at ?? left.published_at ?? "") || 0;
    const rightTime = Date.parse(right.updated_at ?? right.published_at ?? "") || 0;
    return rightTime - leftTime;
  });
}

/** Movies + series ordered by the latest site update (updated_at). */
export function pickFreshHomeItems(
  movies: CatalogListItem[],
  series: CatalogListItem[],
  limit = HOME_RAIL_CAROUSEL_PER_PAGE,
): Array<CatalogListItem & { catalogKind: "movie" | "series" }> {
  const merged = [
    ...filterHomeSliderItems(movies).map((item) => ({
      ...item,
      catalogKind: "movie" as const,
    })),
    ...filterHomeSliderItems(series).map((item) => ({
      ...item,
      catalogKind: "series" as const,
    })),
  ];

  return sortBySitePublishedAt(merged).slice(0, limit);
}

export function splitSiteFreshRail(
  movies: CatalogListItem[],
  series: CatalogListItem[],
  initial = HOME_SITE_FRESH_INITIAL,
): {
  visible: ReturnType<typeof pickFreshHomeItems>;
  reserve: ReturnType<typeof pickFreshHomeItems>;
} {
  const sorted = pickFreshHomeItems(movies, series, HOME_SITE_FRESH_MAX);

  return {
    visible: sorted.slice(0, initial),
    reserve: sorted.slice(initial),
  };
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
