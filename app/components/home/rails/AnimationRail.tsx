import { cacheLife, cacheTag } from "next/cache";
import type { FilterOptions } from "../../../lib/filter-options";
import {
  DEFAULT_ANIMATION_SUBTYPES,
  fetchAnimationCatalogMerged,
  resolveAnimationSubtypeGenreValues,
  withAnimationGenreFilter,
} from "../../../lib/catalog/animation";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "../../../lib/catalog/carousel-config";
import { buildStaticCarouselMeta } from "../../../lib/catalog/home";
import { LATEST_CATALOG_FILTERS } from "../../../lib/catalog/latest";
import HomeCatalogRail from "../HomeCatalogRail";

export default async function AnimationRail({
  filterOptions,
}: {
  filterOptions: FilterOptions;
}) {
  "use cache";
  cacheLife("catalog");
  cacheTag("home-rails", "catalog-movies", "catalog-series");

  const animationGenreValues = resolveAnimationSubtypeGenreValues(
    filterOptions,
    DEFAULT_ANIMATION_SUBTYPES,
  );
  const animationFilters = withAnimationGenreFilter(
    { ...LATEST_CATALOG_FILTERS, carousel: true },
    animationGenreValues,
  );

  const animationResult = await fetchAnimationCatalogMerged(
    animationFilters,
    1,
    HOME_RAIL_CAROUSEL_PER_PAGE,
  );

  if (animationResult.items.length === 0) {
    return null;
  }

  return (
    <HomeCatalogRail
      title="انیمیشن و کارتون"
      initialItems={animationResult.items}
      initialMeta={buildStaticCarouselMeta(
        animationResult.meta.total,
        animationResult.items.length,
      )}
      sort="newest"
      kind="movies"
      progressive={false}
      useItemKind
    />
  );
}
