"use client";

import { useState } from "react";
import useSWR from "swr";
import { useVisibilityTrigger } from "../../hooks/useVisibilityTrigger";
import {
  fetchHomeGenreRailByConfig,
  type HomeGenreRailConfig,
} from "../../lib/catalog/home-genre-rails";
import HomeCatalogRail from "./HomeCatalogRail";
import { RailSkeleton } from "./RailSkeleton";

export function LazyRail({ railConfig }: { railConfig: HomeGenreRailConfig }) {
  const [shouldFetch, setShouldFetch] = useState(false);

  const sentinelRef = useVisibilityTrigger(() => {
    setShouldFetch(true);
  });

  const { data, isLoading, isValidating } = useSWR(
    shouldFetch ? ["genre-rail", railConfig.definition.slug] : null,
    () => fetchHomeGenreRailByConfig(railConfig),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300_000,
      shouldRetryOnError: false,
    },
  );

  const sentinel = (
    <div ref={sentinelRef} className="h-px w-full shrink-0" aria-hidden="true" />
  );

  if (!shouldFetch) {
    return sentinel;
  }

  if (data && data.items.length > 0) {
    return (
      <>
        {sentinel}
        <HomeCatalogRail
          title={data.definition.title}
          initialItems={data.items}
          initialMeta={data.meta}
          sort="popular"
          kind={data.kind}
          filters={data.filters}
          progressive={data.progressive}
          useItemKind={data.useItemKind}
        />
      </>
    );
  }

  const awaitingData = isLoading || isValidating || data === undefined;

  if (awaitingData) {
    return (
      <>
        {sentinel}
        <RailSkeleton title={railConfig.definition.title} cardCount={6} animated />
      </>
    );
  }

  return sentinel;
}
