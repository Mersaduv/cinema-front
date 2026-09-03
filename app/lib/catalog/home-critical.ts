import { cacheLife, cacheTag } from "next/cache";
import type { FilterOptions } from "../filter-options";
import {
  pickFeaturedHeroSlides,
  pickTrendingHomeItems,
  type FeaturedCatalogItem,
} from "./home";
import { fetchHomeCriticalBootstrap } from "./home-bootstrap";
import type { MoviesCarouselFetchResult, MoviesCatalogFetchResult } from "./rest";

export type HomeCriticalData = {
  filterOptions: FilterOptions;
  heroSlides: FeaturedCatalogItem[];
  trendingItems: ReturnType<typeof pickTrendingHomeItems>;
  trendingTotal: number;
  popularMovies: MoviesCatalogFetchResult | MoviesCarouselFetchResult;
};

export async function loadCriticalHomeData(): Promise<HomeCriticalData> {
  return fetchHomeCriticalBootstrap();
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

  return getCachedCriticalHomePayload();
}
