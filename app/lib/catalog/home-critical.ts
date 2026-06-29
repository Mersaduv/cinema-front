import { cacheLife, cacheTag } from "next/cache";
import type { FilterOptions } from "../filter-options";
import { fetchFilterOptions } from "../filter-options";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "./carousel-config";
import {
  HOME_FEATURED_POOL,
  HOME_LATEST_MOVIES_FILTERS,
  HOME_LATEST_SERIES_FILTERS,
  HOME_POPULAR_HYBRID_MOVIES_FILTERS,
  HOME_POPULAR_HYBRID_SERIES_FILTERS,
  HOME_POPULAR_MOVIES_FILTERS,
  HOME_TRENDING_FALLBACK_MOVIES_FILTERS,
  HOME_TRENDING_FALLBACK_SERIES_FILTERS,
  HOME_TRENDING_MOVIES_FILTERS,
  HOME_TRENDING_SERIES_FILTERS,
  pickFeaturedHeroSlides,
  pickTrendingHomeItems,
  type FeaturedCatalogItem,
} from "./home";
import { filterHomeCatalogFetchResult } from "./home-visibility";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type MoviesCarouselFetchResult,
  type MoviesCatalogFetchResult,
} from "./rest";

export type HomeCriticalData = {
  filterOptions: FilterOptions;
  heroSlides: FeaturedCatalogItem[];
  trendingItems: ReturnType<typeof pickTrendingHomeItems>;
  trendingTotal: number;
  popularMovies: MoviesCatalogFetchResult | MoviesCarouselFetchResult;
};

export async function loadCriticalHomeData(): Promise<HomeCriticalData> {
  const [
    filterOptions,
    featuredMoviesResult,
    featuredSeriesResult,
    heroHybridMoviesResult,
    heroHybridSeriesResult,
    trendingMoviesResult,
    trendingSeriesResult,
    trendingFallbackMoviesResult,
    trendingFallbackSeriesResult,
    popularMoviesResult,
  ] = await Promise.all([
    fetchFilterOptions({ cache: "force-cache" }),
    fetchMoviesCatalogRest(HOME_LATEST_MOVIES_FILTERS, 1, HOME_FEATURED_POOL),
    fetchSeriesCatalogRest(HOME_LATEST_SERIES_FILTERS, 1, HOME_FEATURED_POOL),
    fetchMoviesCatalogRest(
      HOME_POPULAR_HYBRID_MOVIES_FILTERS,
      1,
      HOME_FEATURED_POOL,
    ),
    fetchSeriesCatalogRest(
      HOME_POPULAR_HYBRID_SERIES_FILTERS,
      1,
      HOME_FEATURED_POOL,
    ),
    fetchMoviesCatalogRest(
      HOME_TRENDING_MOVIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchSeriesCatalogRest(
      HOME_TRENDING_SERIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchMoviesCatalogRest(
      HOME_TRENDING_FALLBACK_MOVIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchSeriesCatalogRest(
      HOME_TRENDING_FALLBACK_SERIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchMoviesCatalogRest(
      HOME_POPULAR_MOVIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
  ]);

  const heroSlides = pickFeaturedHeroSlides(
    featuredMoviesResult.items,
    featuredSeriesResult.items,
    heroHybridMoviesResult.items,
    heroHybridSeriesResult.items,
  );

  const trendingItems = pickTrendingHomeItems(
    trendingMoviesResult.items,
    trendingSeriesResult.items,
    trendingFallbackMoviesResult.items,
    trendingFallbackSeriesResult.items,
  );

  const trendingTotal =
    trendingMoviesResult.meta.total + trendingSeriesResult.meta.total;

  return {
    filterOptions,
    heroSlides,
    trendingItems,
    trendingTotal,
    popularMovies: filterHomeCatalogFetchResult(popularMoviesResult),
  };
}

export async function getCachedCriticalHomePayload(): Promise<HomeCriticalData> {
  "use cache";
  cacheLife("hero");
  cacheTag("home-critical", "catalog-movies", "catalog-series");

  return loadCriticalHomeData();
}

export async function getCriticalHomeData(): Promise<HomeCriticalData> {
  "use cache";
  cacheLife("hero");
  cacheTag("home-critical");

  // Direct call — avoids HTTP loopback to /api/home-critical during `next build`
  // when the Next server is not listening (ECONNREFUSED).
  return getCachedCriticalHomePayload();
}
