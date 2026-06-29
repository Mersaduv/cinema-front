import { cacheLife, cacheTag } from "next/cache";
import HomeCatalogRail from "../HomeCatalogRail";
import { HOME_TOP_RATED_FILTERS, toCarouselMeta } from "../../../lib/catalog/home";
import { fetchMoviesCatalogRest } from "../../../lib/catalog/rest";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "../../../lib/catalog/carousel-config";

export default async function TopRatedMoviesRail() {
  "use cache";
  cacheLife("catalog");
  cacheTag("home-rails", "catalog-movies");

  const result = await fetchMoviesCatalogRest(
    HOME_TOP_RATED_FILTERS,
    1,
    HOME_RAIL_CAROUSEL_PER_PAGE,
  );

  if (result.items.length === 0) {
    return null;
  }

  return (
    <HomeCatalogRail
      title="بهترین امتیاز — فیلم"
      initialItems={result.items}
      initialMeta={toCarouselMeta(result.meta, result.items.length)}
      sort="top_rated"
      kind="movies"
      filters={HOME_TOP_RATED_FILTERS}
    />
  );
}
