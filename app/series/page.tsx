import { Suspense } from "react";
import CatalogClient from "../components/catalog/CatalogClient";
import CatalogDeferredLatestSlider from "../components/catalog/CatalogDeferredLatestSlider";
import { CatalogLatestSliderSkeleton } from "../components/skeletons/CatalogPageSkeleton";
import { getCachedSeriesCatalogPage } from "../lib/catalog/catalog-page-cache";
import { parseCatalogFilters } from "../lib/catalog/search-params";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SeriesCatalogPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const query = await searchParams;
  const filters = parseCatalogFilters(query);
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const catalogResult = await getCachedSeriesCatalogPage(filters, page);

  return (
    <CatalogClient
      kind="series"
      initialItems={catalogResult.items}
      initialMeta={catalogResult.meta}
      initialFilters={filters}
      initialError={catalogResult.error}
      latestSliderSlot={
        <Suspense key="series-latest-slider" fallback={<CatalogLatestSliderSkeleton />}>
          <CatalogDeferredLatestSlider kind="series" />
        </Suspense>
      }
    />
  );
}
