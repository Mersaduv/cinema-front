import ContinueWatching from "./components/ContinueWatching";
import HomeCatalogRail from "./components/home/HomeCatalogRail";
import HomeClient from "./components/home/HomeClient";
import HomeHero from "./components/home/HomeHero";
import {
  DEFAULT_ANIMATION_SUBTYPES,
  fetchAnimationCatalogMerged,
  resolveAnimationSubtypeGenreValues,
  withAnimationGenreFilter,
} from "./lib/catalog/animation";
import { HOME_RAIL_CAROUSEL_PER_PAGE } from "./lib/catalog/carousel-config";
import { fetchAllHomeGenreRails } from "./lib/catalog/home-genre-rails";
import {
  HOME_FEATURED_POOL,
  HOME_FRESH_MOVIES_FILTERS,
  HOME_FRESH_SERIES_FILTERS,
  HOME_LATEST_MOVIES_FILTERS,
  HOME_LATEST_SERIES_FILTERS,
  HOME_POPULAR_HYBRID_MOVIES_FILTERS,
  HOME_POPULAR_MOVIES_FILTERS,
  HOME_POPULAR_SERIES_FILTERS,
  HOME_TOP_RATED_FILTERS,
  HOME_TRENDING_FALLBACK_MOVIES_FILTERS,
  HOME_TRENDING_FALLBACK_SERIES_FILTERS,
  HOME_TRENDING_MOVIES_FILTERS,
  HOME_TRENDING_SERIES_FILTERS,
  buildStaticCarouselMeta,
  pickFeaturedHeroSlides,
  pickFreshHomeItems,
  pickTrendingHomeItems,
  toCarouselMeta,
} from "./lib/catalog/home";
import { LATEST_CATALOG_FILTERS } from "./lib/catalog/latest";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
} from "./lib/catalog/rest";
import { fetchFilterOptions } from "./lib/filter-options";

export const dynamic = "force-dynamic";

export default async function Home() {
  const filterOptions = await fetchFilterOptions({ cache: "force-cache" });
  const animationGenreValues = resolveAnimationSubtypeGenreValues(
    filterOptions,
    DEFAULT_ANIMATION_SUBTYPES,
  );
  const animationFilters = withAnimationGenreFilter(
    { ...LATEST_CATALOG_FILTERS, carousel: true },
    animationGenreValues,
  );

  const [
    featuredMoviesResult,
    featuredSeriesResult,
    popularMoviesResult,
    popularSeriesResult,
    popularHybridMoviesResult,
    freshMoviesResult,
    freshSeriesResult,
    trendingMoviesResult,
    trendingSeriesResult,
    trendingFallbackMoviesResult,
    trendingFallbackSeriesResult,
    topRatedMoviesResult,
    topRatedSeriesResult,
    animationResult,
    genreRails,
  ] = await Promise.all([
    fetchMoviesCatalogRest(HOME_LATEST_MOVIES_FILTERS, 1, HOME_FEATURED_POOL),
    fetchSeriesCatalogRest(HOME_LATEST_SERIES_FILTERS, 1, HOME_FEATURED_POOL),
    fetchMoviesCatalogRest(
      HOME_POPULAR_MOVIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchSeriesCatalogRest(
      HOME_POPULAR_SERIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
    fetchMoviesCatalogRest(
      HOME_POPULAR_HYBRID_MOVIES_FILTERS,
      1,
      HOME_RAIL_CAROUSEL_PER_PAGE,
    ),
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
    fetchMoviesCatalogRest(HOME_TOP_RATED_FILTERS, 1, HOME_RAIL_CAROUSEL_PER_PAGE),
    fetchSeriesCatalogRest(HOME_TOP_RATED_FILTERS, 1, HOME_RAIL_CAROUSEL_PER_PAGE),
    fetchAnimationCatalogMerged(animationFilters, 1, HOME_RAIL_CAROUSEL_PER_PAGE),
    fetchAllHomeGenreRails(filterOptions),
  ]);

  const featuredItems = pickFeaturedHeroSlides(
    featuredMoviesResult.items,
    featuredSeriesResult.items,
  );

  const trendingItems = pickTrendingHomeItems(
    trendingMoviesResult.items,
    trendingSeriesResult.items,
    trendingFallbackMoviesResult.items,
    trendingFallbackSeriesResult.items,
  );

  const freshItems = pickFreshHomeItems(
    freshMoviesResult.items,
    freshSeriesResult.items,
  );

  const trendingTotal =
    trendingMoviesResult.meta.total + trendingSeriesResult.meta.total;
  const freshTotal = freshMoviesResult.meta.total + freshSeriesResult.meta.total;

  return (
    <HomeClient>
      <HomeHero items={featuredItems} />

      <div className="relative z-10 -mt-16 space-y-8 px-4 pb-16 md:-mt-20 md:px-7 md:pb-20">
        <ContinueWatching mediaType="all" limit={16} layout="landscape" />

        <HomeCatalogRail
          title="جدید و محبوب"
          initialItems={trendingItems}
          initialMeta={buildStaticCarouselMeta(trendingTotal, trendingItems.length)}
          sort="trending"
          kind="movies"
          progressive={false}
          useItemKind
        />

        <HomeCatalogRail
          title="محبوب‌ترین فیلم‌ها"
          initialItems={popularMoviesResult.items}
          initialMeta={toCarouselMeta(popularMoviesResult.meta, popularMoviesResult.items.length)}
          sort="popular"
          kind="movies"
          filters={HOME_POPULAR_MOVIES_FILTERS}
        />

        <HomeCatalogRail
          title="محبوب‌ترین سریال‌ها"
          initialItems={popularSeriesResult.items}
          initialMeta={toCarouselMeta(popularSeriesResult.meta, popularSeriesResult.items.length)}
          sort="popular"
          kind="series"
          filters={HOME_POPULAR_SERIES_FILTERS}
        />

        <HomeCatalogRail
          title="محبوب در سینما"
          initialItems={popularHybridMoviesResult.items}
          initialMeta={toCarouselMeta(
            popularHybridMoviesResult.meta,
            popularHybridMoviesResult.items.length,
          )}
          sort="popular_hybrid"
          kind="movies"
          filters={HOME_POPULAR_HYBRID_MOVIES_FILTERS}
        />

        <HomeCatalogRail
          title="تازه‌های سینما"
          initialItems={freshItems}
          initialMeta={buildStaticCarouselMeta(freshTotal, freshItems.length)}
          sort="newest"
          kind="movies"
          progressive={false}
          useItemKind
        />

        <HomeCatalogRail
          title="بهترین امتیاز — فیلم"
          initialItems={topRatedMoviesResult.items}
          initialMeta={toCarouselMeta(topRatedMoviesResult.meta, topRatedMoviesResult.items.length)}
          sort="top_rated"
          kind="movies"
          filters={HOME_TOP_RATED_FILTERS}
        />

        <HomeCatalogRail
          title="بهترین امتیاز — سریال"
          initialItems={topRatedSeriesResult.items}
          initialMeta={toCarouselMeta(topRatedSeriesResult.meta, topRatedSeriesResult.items.length)}
          sort="top_rated"
          kind="series"
          filters={HOME_TOP_RATED_FILTERS}
        />

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

        {genreRails.map((rail) => (
          <HomeCatalogRail
            key={rail.definition.slug}
            title={rail.definition.title}
            initialItems={rail.items}
            initialMeta={rail.meta}
            sort="popular"
            kind={rail.kind}
            filters={rail.filters}
            progressive={rail.progressive}
            useItemKind={rail.useItemKind}
          />
        ))}
      </div>
    </HomeClient>
  );
}
