import {
  HOME_POPULAR_HYBRID_MOVIES_FILTERS,
  HOME_POPULAR_SERIES_FILTERS,
  HOME_TOP_RATED_FILTERS,
  buildStaticCarouselMeta,
  toCarouselMeta,
} from "../../lib/catalog/home";
import { getCachedDeferredHomeRails } from "../../lib/catalog/home-deferred";
import { getCachedFilterOptions } from "../../lib/filter-options-cache";
import HomeCatalogRail from "./HomeCatalogRail";
import HomeLatestEpisodesRail from "./HomeLatestEpisodesRail";

export default async function HomeDeferredRails() {
  const filterOptions = await getCachedFilterOptions();
  const data = await getCachedDeferredHomeRails(filterOptions);

  return (
    <>
      {data.popularSeries ? (
        <HomeCatalogRail
          title="محبوب‌ترین سریال‌ها"
          initialItems={data.popularSeries.items}
          initialMeta={toCarouselMeta(
            data.popularSeries.meta,
            data.popularSeries.items.length,
          )}
          sort="popular"
          kind="series"
          filters={HOME_POPULAR_SERIES_FILTERS}
        />
      ) : null}

      <HomeLatestEpisodesRail items={data.latestEpisodes} />

      {data.popularHybrid ? (
        <HomeCatalogRail
          title="محبوب در سینما"
          initialItems={data.popularHybrid.items}
          initialMeta={toCarouselMeta(
            data.popularHybrid.meta,
            data.popularHybrid.items.length,
          )}
          sort="popular_hybrid"
          kind="movies"
          filters={HOME_POPULAR_HYBRID_MOVIES_FILTERS}
        />
      ) : null}

      {data.topRatedMovies ? (
        <HomeCatalogRail
          title="بهترین امتیاز — فیلم"
          initialItems={data.topRatedMovies.items}
          initialMeta={toCarouselMeta(
            data.topRatedMovies.meta,
            data.topRatedMovies.items.length,
          )}
          sort="top_rated"
          kind="movies"
          filters={HOME_TOP_RATED_FILTERS}
        />
      ) : null}

      {data.topRatedSeries ? (
        <HomeCatalogRail
          title="بهترین امتیاز — سریال"
          initialItems={data.topRatedSeries.items}
          initialMeta={toCarouselMeta(
            data.topRatedSeries.meta,
            data.topRatedSeries.items.length,
          )}
          sort="top_rated"
          kind="series"
          filters={HOME_TOP_RATED_FILTERS}
        />
      ) : null}

      {data.animation ? (
        <HomeCatalogRail
          title="انیمیشن و کارتون"
          initialItems={data.animation.items}
          initialMeta={buildStaticCarouselMeta(
            data.animation.meta.total,
            data.animation.items.length,
          )}
          sort="newest"
          kind="movies"
          progressive={false}
          useItemKind
        />
      ) : null}
    </>
  );
}
