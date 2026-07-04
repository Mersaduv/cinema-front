import { Suspense } from "react";
import AnimationCatalogClient from "../components/catalog/AnimationCatalogClient";
import AnimationDeferredLatestSlider from "../components/catalog/AnimationDeferredLatestSlider";
import { CatalogLatestSliderSkeleton } from "../components/skeletons/CatalogPageSkeleton";
import { getCachedAnimationCatalogPage } from "../lib/catalog/catalog-page-cache";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AnimationCatalogPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const query = await searchParams;
  const { subtypes, filters, catalogResult } = await getCachedAnimationCatalogPage(query);

  return (
    <AnimationCatalogClient
      initialSubtypes={subtypes}
      initialItems={catalogResult.items}
      initialMeta={catalogResult.meta}
      initialFilters={filters}
      initialError={catalogResult.error}
      latestSliderSlot={
        <Suspense key="animation-latest-slider" fallback={<CatalogLatestSliderSkeleton />}>
          <AnimationDeferredLatestSlider subtypes={subtypes} />
        </Suspense>
      }
    />
  );
}
