import type { FilterGenreOption, FilterOptions } from "../filter-options";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "./carousel-config";
import { toCarouselMeta } from "./home";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type CatalogListItem,
} from "./rest";
import type { CatalogFiltersState } from "./search-params";
import type { CarouselMeta } from "../../types/carousel";

export type HomeGenreRailKind = "merged" | "movies" | "series";

export type HomeGenreRailDefinition = {
  slug: string;
  title: string;
  kind: HomeGenreRailKind;
};

/**
 * Home page genre rails — order matches catalog UX priority (popular genres first).
 * Slugs align with CatalogGenreManifest (backend).
 */
export const HOME_GENRE_RAIL_DEFINITIONS: HomeGenreRailDefinition[] = [
  { slug: "short", title: "سریال کوتاه", kind: "series" },
  { slug: "reality", title: "رئالیتی شو", kind: "series" },
  { slug: "action", title: "اکشن", kind: "merged" },
  { slug: "comedy", title: "کمدی", kind: "merged" },
  { slug: "horror", title: "ترسناک", kind: "merged" },
  { slug: "fantasy", title: "فانتزی", kind: "merged" },
  { slug: "drama", title: "درام", kind: "merged" },
  { slug: "science-fiction", title: "علمی تخیلی", kind: "merged" },
  { slug: "sci-fi-fantasy", title: "علمی تخیلی و فانتزی", kind: "series" },
  { slug: "mystery", title: "معمایی", kind: "merged" },
  { slug: "romance", title: "عاشقانه", kind: "merged" },
  { slug: "adventure", title: "ماجراجویی", kind: "merged" },
  { slug: "thriller", title: "هیجان‌انگیز", kind: "merged" },
  { slug: "history", title: "تاریخی", kind: "merged" },
  { slug: "war", title: "جنگی", kind: "merged" },
  { slug: "documentary", title: "مستند", kind: "merged" },
  { slug: "crime", title: "جنایی", kind: "merged" },
  { slug: "family", title: "خانوادگی", kind: "merged" },
  { slug: "anime-animation", title: "انیمه و انیمیشن", kind: "merged" },
  { slug: "western", title: "وسترن", kind: "merged" },
  { slug: "music", title: "موزیک", kind: "merged" },
  { slug: "biography", title: "زندگی‌نامه", kind: "merged" },
  { slug: "war-politics", title: "جنگ و سیاست", kind: "series" },
  { slug: "animation", title: "انیمیشن", kind: "merged" },
  { slug: "noir-mystery", title: "رازآلود", kind: "merged" },
  { slug: "tv-movie", title: "فیلم تلویزیونی", kind: "movies" },
];

export type HomeGenreRailData = {
  definition: HomeGenreRailDefinition;
  genreId: string;
  filters: CatalogFiltersState;
  items: CatalogListItem[];
  meta: CarouselMeta;
  useItemKind: boolean;
  kind: "movies" | "series";
  progressive: boolean;
};

function genrePool(filterOptions: FilterOptions): FilterGenreOption[] {
  const seen = new Set<number>();
  const pool: FilterGenreOption[] = [];

  for (const genre of [
    ...(filterOptions.catalog_genres ?? []),
    ...filterOptions.movie_genres,
    ...filterOptions.tv_genres,
  ]) {
    if (seen.has(genre.id)) {
      continue;
    }
    seen.add(genre.id);
    pool.push(genre);
  }

  return pool;
}

export function findGenreBySlug(
  filterOptions: FilterOptions,
  slug: string,
): FilterGenreOption | null {
  return genrePool(filterOptions).find((genre) => genre.slug === slug) ?? null;
}

export function buildGenrePopularFilters(genreId: string): CatalogFiltersState {
  return {
    search: "",
    sort: "popular",
    genres: [genreId],
    countries: [],
    languages: [],
    year_from: null,
    year_to: null,
    min_rating: "",
    carousel: true,
  };
}

function mergePopularItems(
  movies: CatalogListItem[],
  series: CatalogListItem[],
  limit = HOME_RAIL_CAROUSEL_PER_PAGE,
): Array<CatalogListItem & { catalogKind: "movie" | "series" }> {
  return [
    ...movies.map((item) => ({ ...item, catalogKind: "movie" as const })),
    ...series.map((item) => ({ ...item, catalogKind: "series" as const })),
  ]
    .sort((left, right) => {
      const leftScore = left.rating ?? left.details.rating ?? 0;
      const rightScore = right.rating ?? right.details.rating ?? 0;
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return right.id - left.id;
    })
    .slice(0, limit);
}

function combineCarouselMeta(
  moviesMeta: CarouselMeta | { total: number },
  seriesMeta: CarouselMeta | { total: number },
  itemCount: number,
): CarouselMeta {
  const total = moviesMeta.total + seriesMeta.total;

  return {
    current_page: 1,
    per_page: HOME_RAIL_CAROUSEL_PER_PAGE,
    total,
    has_more: itemCount < total,
    next_cursor: null,
  };
}

export async function fetchHomeGenreRail(
  filterOptions: FilterOptions,
  definition: HomeGenreRailDefinition,
): Promise<HomeGenreRailData | null> {
  const genre = findGenreBySlug(filterOptions, definition.slug);
  if (!genre) {
    return null;
  }

  const genreId = String(genre.id);
  const filters = buildGenrePopularFilters(genreId);

  if (definition.kind === "movies") {
    const result = await fetchMoviesCatalogRest(filters, 1, HOME_RAIL_CAROUSEL_PER_PAGE);
    if (result.items.length === 0) {
      return null;
    }

    return {
      definition,
      genreId,
      filters,
      items: result.items,
      meta: toCarouselMeta(result.meta, result.items.length),
      useItemKind: false,
      kind: "movies",
      progressive: true,
    };
  }

  if (definition.kind === "series") {
    const result = await fetchSeriesCatalogRest(filters, 1, HOME_RAIL_CAROUSEL_PER_PAGE);
    if (result.items.length === 0) {
      return null;
    }

    return {
      definition,
      genreId,
      filters,
      items: result.items,
      meta: toCarouselMeta(result.meta, result.items.length),
      useItemKind: false,
      kind: "series",
      progressive: true,
    };
  }

  const [moviesResult, seriesResult] = await Promise.all([
    fetchMoviesCatalogRest(filters, 1, HOME_RAIL_CAROUSEL_PER_PAGE),
    fetchSeriesCatalogRest(filters, 1, HOME_RAIL_CAROUSEL_PER_PAGE),
  ]);

  const items = mergePopularItems(moviesResult.items, seriesResult.items);
  if (items.length === 0) {
    return null;
  }

  return {
    definition,
    genreId,
    filters,
    items,
    meta: combineCarouselMeta(moviesResult.meta, seriesResult.meta, items.length),
    useItemKind: true,
    kind: "movies",
    progressive: false,
  };
}

export async function fetchAllHomeGenreRails(
  filterOptions: FilterOptions,
): Promise<HomeGenreRailData[]> {
  const results = await Promise.all(
    HOME_GENRE_RAIL_DEFINITIONS.map((definition) =>
      fetchHomeGenreRail(filterOptions, definition),
    ),
  );

  return results.filter((rail): rail is HomeGenreRailData => rail !== null);
}
