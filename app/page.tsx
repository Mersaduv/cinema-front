import { Suspense } from "react";
import ContinueWatching from "./components/ContinueWatching";
import { GenreRailsSection } from "./components/home/GenreRailsSection";
import HomeCatalogRail from "./components/home/HomeCatalogRail";
import HomeClient from "./components/home/HomeClient";
import HomeDeferredRails from "./components/home/HomeDeferredRails";
import HomeHero from "./components/home/HomeHero";
import HeroLcpPreload from "./components/home/HeroLcpPreload";
import { getCriticalHomeData } from "./lib/catalog/home-critical";
import {
  buildStaticCarouselMeta,
  HOME_POPULAR_MOVIES_FILTERS,
  toCarouselMeta,
} from "./lib/catalog/home";

export default async function Home() {
  const { filterOptions, heroSlides, trendingItems, trendingTotal, popularMovies } =
    await getCriticalHomeData();

  const hasHero = heroSlides.length > 0;

  return (
    <>
      {hasHero ? <HeroLcpPreload item={heroSlides[0]} /> : null}
      <HomeClient>
        {hasHero ? <HomeHero items={heroSlides} /> : null}

        <div
          className={`relative z-10 space-y-8 px-4 pb-16 md:px-7 md:pb-20 ${
            hasHero ? "-mt-16 md:-mt-20" : "pt-[138px] xl:pt-[81px]"
          }`}
        >
          <ContinueWatching mediaType="all" limit={16} layout="landscape" />

          <HomeCatalogRail
            title="جدید و محبوب"
            initialItems={trendingItems}
            initialMeta={buildStaticCarouselMeta(trendingTotal, trendingItems.length)}
            sort="trending"
            kind="movies"
            progressive={false}
            useItemKind
            isAboveFold
          />

          <HomeCatalogRail
            title="محبوب‌ترین فیلم‌ها"
            initialItems={popularMovies.items}
            initialMeta={toCarouselMeta(
              popularMovies.meta,
              popularMovies.items.length,
            )}
            sort="popular"
            kind="movies"
            filters={HOME_POPULAR_MOVIES_FILTERS}
            isAboveFold
          />

          <Suspense>
            <HomeDeferredRails filterOptions={filterOptions} />
          </Suspense>

          <GenreRailsSection filterOptions={filterOptions} />
        </div>
      </HomeClient>
    </>
  );
}
