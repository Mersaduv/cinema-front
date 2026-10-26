import "./server-fetch-dns";
import { cacheLife, cacheTag } from "next/cache";
import type { CatalogFiltersState } from "./search-params";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type MoviesCatalogFetchResult,
  type MoviesCarouselFetchResult,
} from "./rest";
import {
  CATALOG_CACHE_TAG,
  CATALOG_MOVIES_CACHE_TAG,
  CATALOG_SERIES_CACHE_TAG,
} from "./cache-tags";
import {
  fetchAnimationCatalogMerged,
  parseAnimationCatalogFilters,
  parseAnimationSubtypes,
  resolveAnimationSubtypeGenreValues,
  withAnimationGenreFilter,
  type SelectableAnimationSubtype,
} from "./animation";
import type { CatalogSearchParamsInput } from "./search-params";
import { getCachedFilterOptions } from "../filter-options-cache";

const catalogFetchOptions = { skipFetchCache: true } as const;

export async function getCachedMoviesCatalogPage(
  filters: CatalogFiltersState,
  page: number,
): Promise<MoviesCatalogFetchResult | MoviesCarouselFetchResult> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CATALOG_CACHE_TAG, CATALOG_MOVIES_CACHE_TAG);

  // Infinite catalog: always seed from cursor page 1 (ignore legacy ?page=).
  void page;
  return fetchMoviesCatalogRest(
    { ...filters, carousel: true },
    1,
    24,
    undefined,
    catalogFetchOptions,
  );
}

export async function getCachedSeriesCatalogPage(
  filters: CatalogFiltersState,
  page: number,
): Promise<MoviesCatalogFetchResult | MoviesCarouselFetchResult> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CATALOG_CACHE_TAG, CATALOG_SERIES_CACHE_TAG);

  void page;
  return fetchSeriesCatalogRest(
    { ...filters, carousel: true },
    1,
    24,
    undefined,
    catalogFetchOptions,
  );
}

export async function getCachedAnimationCatalogPage(
  query: CatalogSearchParamsInput,
): Promise<{
  subtypes: SelectableAnimationSubtype[];
  filters: CatalogFiltersState;
  page: number;
  catalogResult: Awaited<ReturnType<typeof fetchAnimationCatalogMerged>>;
}> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CATALOG_CACHE_TAG);

  const subtypes = parseAnimationSubtypes(query);
  const filters = parseAnimationCatalogFilters(query);
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const filterOptions = await getCachedFilterOptions();
  const subtypeGenreValues = resolveAnimationSubtypeGenreValues(filterOptions, subtypes);
  const effectiveFilters = withAnimationGenreFilter(filters, subtypeGenreValues);
  const catalogResult = await fetchAnimationCatalogMerged(effectiveFilters, page, 24);

  return { subtypes, filters, page, catalogResult };
}
