import { cacheLife, cacheTag } from "next/cache";
import HomeCatalogRail from "../HomeCatalogRail";
import {
  HOME_POPULAR_HYBRID_MOVIES_FILTERS,
  toCarouselMeta,
} from "../../../lib/catalog/home";
import { fetchMoviesCatalogRest } from "../../../lib/catalog/rest";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "../../../lib/catalog/carousel-config";

export default async function PopularHybridMoviesRail() {
  "use cache";
  cacheLife("catalog");
  cacheTag("home-rails", "catalog-movies");

  const result = await fetchMoviesCatalogRest(
    HOME_POPULAR_HYBRID_MOVIES_FILTERS,
    1,
    HOME_RAIL_CAROUSEL_PER_PAGE,
  );

  if (result.items.length === 0) {
    return null;
  }

  return (
    <HomeCatalogRail
      title="محبوب در سینما"
      initialItems={result.items}
      initialMeta={toCarouselMeta(result.meta, result.items.length)}
      sort="popular_hybrid"
      kind="movies"
      filters={HOME_POPULAR_HYBRID_MOVIES_FILTERS}
    />
  );
}
