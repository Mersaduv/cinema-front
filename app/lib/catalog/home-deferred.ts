import { cacheLife, cacheTag } from "next/cache";
import type { FilterOptions } from "../filter-options";
import {
  DEFAULT_ANIMATION_SUBTYPES,
  fetchAnimationCatalogMerged,
  resolveAnimationSubtypeGenreValues,
  withAnimationGenreFilter,
} from "./animation";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "./carousel-config";
import {
  HOME_FRESH_MOVIES_FILTERS,
  HOME_FRESH_SERIES_FILTERS,
  HOME_POPULAR_HYBRID_MOVIES_FILTERS,
  HOME_POPULAR_SERIES_FILTERS,
  HOME_TOP_RATED_FILTERS,
  buildStaticCarouselMeta,
  pickFreshHomeItems,
  toCarouselMeta,
} from "./home";
import { filterHomeCatalogFetchResult, filterHomeSliderItems } from "./home-visibility";
import { LATEST_CATALOG_FILTERS } from "./latest";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type MoviesCarouselFetchResult,
  type MoviesCatalogFetchResult,
} from "./rest";

export type DeferredHomeRailsData = {
  popularSeries: MoviesCatalogFetchResult | MoviesCarouselFetchResult | null;
  popularHybrid: MoviesCatalogFetchResult | MoviesCarouselFetchResult | null;
  freshItems: ReturnType<typeof pickFreshHomeItems>;
  freshTotal: number;
  topRatedMovies: MoviesCatalogFetchResult | MoviesCarouselFetchResult | null;
  topRatedSeries: MoviesCatalogFetchResult | MoviesCarouselFetchResult | null;
  animation: Awaited<ReturnType<typeof fetchAnimationCatalogMerged>> | null;
};

export async function loadDeferredHomeRails(
  filterOptions: FilterOptions,
): Promise<DeferredHomeRailsData> {
  const animationGenreValues = resolveAnimationSubtypeGenreValues(
    filterOptions,
    DEFAULT_ANIMATION_SUBTYPES,
  );
  const animationFilters = withAnimationGenreFilter(
    { ...LATEST_CATALOG_FILTERS, carousel: true },
    animationGenreValues,
  );

  const [
    popularSeriesResult,
    popularHybridResult,
    freshMoviesResult,
    freshSeriesResult,
    topRatedMoviesResult,
    topRatedSeriesResult,
    animationResult,
  ] = await Promise.all([
    fetchSeriesCatalogRest(
      HOME_POPULAR_SERIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchMoviesCatalogRest(
      HOME_POPULAR_HYBRID_MOVIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchMoviesCatalogRest(
      HOME_FRESH_MOVIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchSeriesCatalogRest(
      HOME_FRESH_SERIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchMoviesCatalogRest(
      HOME_TOP_RATED_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchSeriesCatalogRest(
      HOME_TOP_RATED_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchAnimationCatalogMerged(
      animationFilters,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
  ]);

  const freshItems = pickFreshHomeItems(
    freshMoviesResult.items,
    freshSeriesResult.items,
  );

  const popularSeries = filterHomeCatalogFetchResult(popularSeriesResult);
  const popularHybrid = filterHomeCatalogFetchResult(popularHybridResult);
  const topRatedMovies = filterHomeCatalogFetchResult(topRatedMoviesResult);
  const topRatedSeries = filterHomeCatalogFetchResult(topRatedSeriesResult);
  const animationItems = filterHomeSliderItems(animationResult.items);

  return {
    popularSeries: popularSeries.items.length > 0 ? popularSeries : null,
    popularHybrid: popularHybrid.items.length > 0 ? popularHybrid : null,
    freshItems,
    freshTotal: freshMoviesResult.meta.total + freshSeriesResult.meta.total,
    topRatedMovies: topRatedMovies.items.length > 0 ? topRatedMovies : null,
    topRatedSeries: topRatedSeries.items.length > 0 ? topRatedSeries : null,
    animation:
      animationItems.length > 0
        ? { ...animationResult, items: animationItems }
        : null,
  };
}

export async function getCachedDeferredHomeRails(
  filterOptions: FilterOptions,
): Promise<DeferredHomeRailsData> {
  "use cache";
  cacheLife("catalog");
  cacheTag("home-rails", "catalog-movies", "catalog-series");

  return loadDeferredHomeRails(filterOptions);
}
