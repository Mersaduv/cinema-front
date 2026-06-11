import type { CatalogFiltersState, CatalogSearchParamsInput } from "./search-params";
import { buildCatalogQueryString, parseCatalogFilters, toArray } from "./search-params";
import { sortCatalogByReleaseYear } from "./latest";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type CatalogListItem,
  type PaginationMeta,
} from "./rest";
import type { FilterOptions } from "../filter-options";

export const ANIMATION_GENRE_SLUG = "animation";
export const ANIMATION_TMDB_ID = 16;

export type SelectableAnimationSubtype = "animation" | "cartoon" | "anime";

export type AnimationCatalogItem = CatalogListItem & {
  catalogKind: "movie" | "series";
};

export const DEFAULT_ANIMATION_SUBTYPES: SelectableAnimationSubtype[] = [
  "animation",
  "cartoon",
  "anime",
];

export const ANIMATION_SUBTYPE_OPTIONS: Array<{
  value: SelectableAnimationSubtype;
  label: string;
  slug: string;
  tmdbId: number | null;
}> = [
  { value: "animation", label: "انیمیشن", slug: "animation", tmdbId: 16 },
  { value: "cartoon", label: "کارتون", slug: "cartoon", tmdbId: null },
  { value: "anime", label: "انیمه", slug: "anime", tmdbId: null },
];

export function parseAnimationSubtypes(
  query: CatalogSearchParamsInput,
): SelectableAnimationSubtype[] {
  const rawValues = toArray(query.subtype);
  const parsed = rawValues.filter(
    (value): value is SelectableAnimationSubtype =>
      value === "animation" || value === "cartoon" || value === "anime",
  );

  return parsed.length > 0 ? parsed : [...DEFAULT_ANIMATION_SUBTYPES];
}

export function animationSubtypesAreDefault(
  subtypes: SelectableAnimationSubtype[],
): boolean {
  return (
    subtypes.length === DEFAULT_ANIMATION_SUBTYPES.length &&
    DEFAULT_ANIMATION_SUBTYPES.every((subtype) => subtypes.includes(subtype))
  );
}

export function formatAnimationSubtypesLabel(
  subtypes: SelectableAnimationSubtype[],
): string {
  if (animationSubtypesAreDefault(subtypes)) {
    return "همه";
  }

  if (subtypes.length === 1) {
    return (
      ANIMATION_SUBTYPE_OPTIONS.find((option) => option.value === subtypes[0])?.label ??
      "دسته‌بندی"
    );
  }

  return `${subtypes.length} دسته انتخاب شده`;
}

function resolveSingleSubtypeGenreValue(
  filterOptions: FilterOptions,
  subtype: SelectableAnimationSubtype,
): string {
  const config = ANIMATION_SUBTYPE_OPTIONS.find((option) => option.value === subtype);
  if (!config) {
    return subtype;
  }

  const allGenres = [
    ...(filterOptions.catalog_genres ?? []),
    ...filterOptions.movie_genres,
    ...filterOptions.tv_genres,
  ];

  const match = allGenres.find(
    (genre) =>
      genre.slug === config.slug ||
      (config.tmdbId != null && genre.tmdb_id === config.tmdbId),
  );

  return match ? String(match.id) : config.slug;
}

export function resolveAnimationSubtypeGenreValues(
  filterOptions: FilterOptions,
  subtypes: SelectableAnimationSubtype[],
): string[] {
  return subtypes.map((subtype) =>
    resolveSingleSubtypeGenreValue(filterOptions, subtype),
  );
}

export function buildAnimationGenreLabels(
  filterOptions: FilterOptions,
  subtypes: SelectableAnimationSubtype[],
): Record<string, string> {
  const labels: Record<string, string> = {};

  subtypes.forEach((subtype) => {
    const genreValue = resolveSingleSubtypeGenreValue(filterOptions, subtype);
    const option = ANIMATION_SUBTYPE_OPTIONS.find((item) => item.value === subtype);
    labels[genreValue] = option?.label ?? genreValue;
  });

  return labels;
}

export function withAnimationGenreFilter(
  filters: CatalogFiltersState,
  animationGenreValues: string | string[],
): CatalogFiltersState {
  const lockedValues = Array.isArray(animationGenreValues)
    ? animationGenreValues
    : [animationGenreValues];

  const lockedSet = new Set([
    ...lockedValues,
    ANIMATION_GENRE_SLUG,
    ...ANIMATION_SUBTYPE_OPTIONS.flatMap((option) => [
      option.slug,
      String(option.tmdbId ?? ""),
    ]),
  ]);

  const extraGenres = filters.genres.filter((genre) => !lockedSet.has(genre));

  return {
    ...filters,
    genres: [...lockedValues, ...extraGenres].slice(0, 3),
  };
}

export function parseAnimationCatalogFilters(
  query: CatalogSearchParamsInput,
): CatalogFiltersState {
  const { genres: _ignored, ...rest } = parseCatalogFilters(query);
  return {
    ...rest,
    genres: [],
  };
}

export function buildAnimationCatalogQueryString(
  subtypes: SelectableAnimationSubtype[],
  filters: CatalogFiltersState,
  page?: number,
): string {
  const params = new URLSearchParams();

  if (!animationSubtypesAreDefault(subtypes)) {
    params.set("subtype", subtypes.join(","));
  }

  const catalogQuery = buildCatalogQueryString(filters, page);
  if (catalogQuery) {
    const catalogParams = new URLSearchParams(catalogQuery);
    catalogParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  return params.toString();
}

export function animationCatalogSignature(
  subtypes: SelectableAnimationSubtype[],
  filters: CatalogFiltersState,
  page = 1,
): string {
  return `${subtypes.join(",")}:${buildAnimationCatalogQueryString(subtypes, filters, page)}`;
}

export function getCatalogItemHref(item: CatalogListItem): string {
  const kind =
    "catalogKind" in item && (item as AnimationCatalogItem).catalogKind === "series"
      ? "series"
      : "movie";

  return kind === "series" ? `/series/${item.slug}` : `/movies/${item.slug}`;
}

export async function fetchAnimationCatalogMerged(
  filters: CatalogFiltersState,
  page = 1,
  perPage = 24,
  signal?: AbortSignal,
): Promise<{ items: AnimationCatalogItem[]; meta: PaginationMeta; error: string }> {
  const chunk = Math.ceil(perPage / 2);

  const [moviesResult, seriesResult] = await Promise.all([
    fetchMoviesCatalogRest(filters, page, chunk, signal),
    fetchSeriesCatalogRest(filters, page, chunk, signal),
  ]);

  const items = sortCatalogByReleaseYear([
    ...moviesResult.items.map((item) => ({ ...item, catalogKind: "movie" as const })),
    ...seriesResult.items.map((item) => ({ ...item, catalogKind: "series" as const })),
  ]).slice(0, perPage);

  const total = moviesResult.meta.total + seriesResult.meta.total;
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  return {
    items,
    meta: {
      total,
      per_page: perPage,
      current_page: page,
      last_page: lastPage,
    },
    error: moviesResult.error || seriesResult.error,
  };
}
