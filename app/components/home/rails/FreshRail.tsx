import { cacheLife, cacheTag } from "next/cache";
import HomeCatalogRail from "../HomeCatalogRail";
import {
  HOME_FRESH_MOVIES_FILTERS,
  HOME_FRESH_SERIES_FILTERS,
  buildStaticCarouselMeta,
  pickFreshHomeItems,
} from "../../../lib/catalog/home";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
} from "../../../lib/catalog/rest";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "../../../lib/catalog/carousel-config";

export default async function FreshRail() {
  "use cache";
  cacheLife("catalog");
  cacheTag("home-rails", "catalog-movies", "catalog-series");

  const [freshMoviesResult, freshSeriesResult] = await Promise.all([
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
  ]);

  const freshItems = pickFreshHomeItems(
    freshMoviesResult.items,
    freshSeriesResult.items,
  );

  if (freshItems.length === 0) {
    return null;
  }

  const freshTotal =
    freshMoviesResult.meta.total + freshSeriesResult.meta.total;

  return (
    <HomeCatalogRail
      title="تازه‌های سینما"
      initialItems={freshItems}
      initialMeta={buildStaticCarouselMeta(freshTotal, freshItems.length)}
      sort="newest"
      kind="movies"
      progressive={false}
      useItemKind
    />
  );
}
