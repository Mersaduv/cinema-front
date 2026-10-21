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
  HOME_POPULAR_HYBRID_MOVIES_FILTERS,
  HOME_POPULAR_SERIES_FILTERS,
  HOME_TOP_RATED_FILTERS,
} from "./home";
import { filterHomeCatalogFetchResult, filterHomeSliderItems } from "./home-visibility";
import type { LatestEpisodeCard } from "../../components/home/HomeLatestEpisodesRail";
import { LATEST_CATALOG_FILTERS } from "./latest";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type MoviesCarouselFetchResult,
  type MoviesCatalogFetchResult,
  type CatalogFetchOptions,
} from "./rest";

const homeFetchOptions: CatalogFetchOptions = { skipFetchCache: true };

export type DeferredHomeRailsData = {
  popularSeries: MoviesCatalogFetchResult | MoviesCarouselFetchResult | null;
  popularHybrid: MoviesCatalogFetchResult | MoviesCarouselFetchResult | null;
  topRatedMovies: MoviesCatalogFetchResult | MoviesCarouselFetchResult | null;
  topRatedSeries: MoviesCatalogFetchResult | MoviesCarouselFetchResult | null;
  animation: Awaited<ReturnType<typeof fetchAnimationCatalogMerged>> | null;
  latestEpisodes: LatestEpisodeCard[];
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
    topRatedMoviesResult,
    topRatedSeriesResult,
    animationResult,
    latestEpisodes,
  ] = await Promise.all([
    fetchSeriesCatalogRest(
      HOME_POPULAR_SERIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
      undefined,
      homeFetchOptions,
    ),
    fetchMoviesCatalogRest(
      HOME_POPULAR_HYBRID_MOVIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
      undefined,
      homeFetchOptions,
    ),
    fetchMoviesCatalogRest(
      HOME_TOP_RATED_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
      undefined,
      homeFetchOptions,
    ),
    fetchSeriesCatalogRest(
      HOME_TOP_RATED_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
      undefined,
      homeFetchOptions,
    ),
    fetchAnimationCatalogMerged(
      animationFilters,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchLatestEpisodes(),
  ]);

  const popularSeries = filterHomeCatalogFetchResult(popularSeriesResult);
  const popularHybrid = filterHomeCatalogFetchResult(popularHybridResult);
  const topRatedMovies = filterHomeCatalogFetchResult(topRatedMoviesResult);
  const topRatedSeries = filterHomeCatalogFetchResult(topRatedSeriesResult);
  const animationItems = filterHomeSliderItems(animationResult.items);

  return {
    popularSeries: popularSeries.items.length > 0 ? popularSeries : null,
    popularHybrid: popularHybrid.items.length > 0 ? popularHybrid : null,
    topRatedMovies: topRatedMovies.items.length > 0 ? topRatedMovies : null,
    topRatedSeries: topRatedSeries.items.length > 0 ? topRatedSeries : null,
    animation:
      animationItems.length > 0
        ? { ...animationResult, items: animationItems }
        : null,
    latestEpisodes,
  };
}

async function fetchLatestEpisodes(): Promise<LatestEpisodeCard[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

  try {
    const response = await fetch(`${apiBase}/home/latest-episodes?limit=12`, {
      next: { revalidate: 180, tags: ["home-rails", "catalog-series"] },
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as {
      data?: { items?: LatestEpisodeCard[] };
    };

    return Array.isArray(json.data?.items) ? json.data.items : [];
  } catch {
    return [];
  }
}

export async function getCachedDeferredHomeRails(
  filterOptions: FilterOptions,
): Promise<DeferredHomeRailsData> {
  "use cache";
  cacheLife("catalog");
  cacheTag("home-rails", "catalog-movies", "catalog-series");

  return loadDeferredHomeRails(filterOptions);
}
