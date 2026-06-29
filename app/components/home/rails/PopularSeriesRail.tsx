import { cacheLife, cacheTag } from "next/cache";
import HomeCatalogRail from "../HomeCatalogRail";
import { HOME_POPULAR_SERIES_FILTERS, toCarouselMeta } from "../../../lib/catalog/home";
import { fetchSeriesCatalogRest } from "../../../lib/catalog/rest";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "../../../lib/catalog/carousel-config";

export default async function PopularSeriesRail() {
  "use cache";
  cacheLife("catalog");
  cacheTag("home-rails", "catalog-series");

  const result = await fetchSeriesCatalogRest(
    HOME_POPULAR_SERIES_FILTERS,
    1,
    HOME_RAIL_CAROUSEL_PER_PAGE,
  );

  if (result.items.length === 0) {
    return null;
  }

  return (
    <HomeCatalogRail
      title="محبوب‌ترین سریال‌ها"
      initialItems={result.items}
      initialMeta={toCarouselMeta(result.meta, result.items.length)}
      sort="popular"
      kind="series"
      filters={HOME_POPULAR_SERIES_FILTERS}
    />
  );
}
