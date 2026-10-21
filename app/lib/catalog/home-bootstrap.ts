import type { MoviesCarouselFetchResult, MoviesCatalogFetchResult } from "./rest";
import { filterHomeCatalogFetchResult } from "./home-visibility";
import {
  HOME_SITE_FRESH_MAX,
  pickFeaturedHeroSlides,
  pickTrendingHomeItems,
  splitSiteFreshRail,
} from "./home";
import type { HomeCriticalData } from "./home-critical";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

type PoolPayload = {
  items?: unknown[];
  meta?: Record<string, unknown>;
  error?: string;
};

type HomeCriticalApiPayload = {
  latest_movies: PoolPayload;
  latest_series: PoolPayload;
  editorial_featured_movies: PoolPayload;
  editorial_featured_series: PoolPayload;
  hero_hybrid_movies: PoolPayload;
  hero_hybrid_series: PoolPayload;
  trending_movies: PoolPayload;
  trending_series: PoolPayload;
  trending_fallback_movies: PoolPayload;
  trending_fallback_series: PoolPayload;
  popular_movies: PoolPayload;
  site_fresh_movies: PoolPayload;
  site_fresh_series: PoolPayload;
};

function toCarouselResult(pool: PoolPayload): MoviesCarouselFetchResult {
  return {
    items: (pool.items ?? []) as MoviesCarouselFetchResult["items"],
    meta: {
      current_page: Number(pool.meta?.current_page ?? 1),
      per_page: Number(pool.meta?.per_page ?? 0),
      total: Number(pool.meta?.total ?? 0),
      has_more: Boolean(pool.meta?.has_more),
      next_cursor: (pool.meta?.next_cursor as string | null) ?? null,
    },
    error: pool.error ?? "",
  };
}

function toCatalogResult(pool: PoolPayload): MoviesCatalogFetchResult {
  const meta = pool.meta ?? {};

  return {
    items: (pool.items ?? []) as MoviesCatalogFetchResult["items"],
    meta: {
      total: Number(meta.total ?? 0),
      per_page: Number(meta.per_page ?? 0),
      current_page: Number(meta.current_page ?? 1),
      last_page: Number(meta.last_page ?? 1),
    },
    error: pool.error ?? "",
  };
}

export async function fetchHomeCriticalBootstrap(): Promise<HomeCriticalData> {
  const response = await fetch(`${API_BASE_URL}/home/critical`, {
    next: {
      revalidate: 300,
      tags: ["home-critical", "catalog-movies", "catalog-series"],
    },
  });

  if (!response.ok) {
    throw new Error(`Home critical bootstrap failed (${response.status})`);
  }

  const json = (await response.json()) as {
    success?: boolean;
    data?: HomeCriticalApiPayload;
  };

  const data = json.data;
  if (!data) {
    throw new Error("Home critical bootstrap payload is empty.");
  }

  const latestMoviesResult = toCatalogResult(data.latest_movies);
  const latestSeriesResult = toCatalogResult(data.latest_series);
  const editorialFeaturedMoviesResult = toCatalogResult(data.editorial_featured_movies);
  const editorialFeaturedSeriesResult = toCatalogResult(data.editorial_featured_series);
  const heroHybridMoviesResult = toCatalogResult(data.hero_hybrid_movies);
  const heroHybridSeriesResult = toCatalogResult(data.hero_hybrid_series);
  const trendingMoviesResult = toCarouselResult(data.trending_movies);
  const trendingSeriesResult = toCarouselResult(data.trending_series);
  const trendingFallbackMoviesResult = toCarouselResult(data.trending_fallback_movies);
  const trendingFallbackSeriesResult = toCarouselResult(data.trending_fallback_series);
  const popularMoviesResult = toCarouselResult(data.popular_movies);
  const siteFreshMoviesResult = toCarouselResult(data.site_fresh_movies ?? {});
  const siteFreshSeriesResult = toCarouselResult(data.site_fresh_series ?? {});
  const siteFresh = splitSiteFreshRail(
    siteFreshMoviesResult.items,
    siteFreshSeriesResult.items,
  );

  const heroSlides = pickFeaturedHeroSlides(
    latestMoviesResult.items,
    latestSeriesResult.items,
    heroHybridMoviesResult.items,
    heroHybridSeriesResult.items,
    editorialFeaturedMoviesResult.items,
    editorialFeaturedSeriesResult.items,
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
    heroSlides,
    siteFreshVisible: siteFresh.visible,
    siteFreshReserve: siteFresh.reserve,
    siteFreshMoviesCursor: siteFreshMoviesResult.meta.next_cursor,
    siteFreshSeriesCursor: siteFreshSeriesResult.meta.next_cursor,
    siteFreshTotal: Math.min(
      HOME_SITE_FRESH_MAX,
      siteFreshMoviesResult.meta.total + siteFreshSeriesResult.meta.total,
    ),
    trendingItems,
    trendingTotal,
    popularMovies: filterHomeCatalogFetchResult(popularMoviesResult),
  };
}
