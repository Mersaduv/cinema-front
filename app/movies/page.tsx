import { Suspense } from "react";
import CatalogClient from "../components/catalog/CatalogClient";
import CatalogDeferredLatestSlider from "../components/catalog/CatalogDeferredLatestSlider";
import { CatalogLatestSliderSkeleton } from "../components/skeletons/CatalogPageSkeleton";
import { getCachedMoviesCatalogPage } from "../lib/catalog/catalog-page-cache";
import { parseCatalogFilters } from "../lib/catalog/search-params";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MoviesCatalogPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const query = await searchParams;
  const filters = parseCatalogFilters(query);
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const catalogResult = await getCachedMoviesCatalogPage(filters, page);

  return (
    <CatalogClient
      kind="movie"
      initialItems={catalogResult.items}
      initialMeta={catalogResult.meta}
      initialFilters={filters}
      initialError={catalogResult.error}
      latestSliderSlot={
        <Suspense key="movies-latest-slider" fallback={<CatalogLatestSliderSkeleton />}>
          <CatalogDeferredLatestSlider kind="movie" />
        </Suspense>
      }
    />
  );
}
