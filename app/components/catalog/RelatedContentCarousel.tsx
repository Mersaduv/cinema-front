"use client";

import RelatedContentSlider from "./RelatedContentSlider";
import type { CatalogListItem } from "../../lib/catalog/rest";

/** @deprecated Use RelatedContentSlider */
export default function RelatedContentCarousel({
  title,
  items,
  kind,
  loading,
}: {
  title: string;
  items: CatalogListItem[];
  kind: "movie" | "series";
  loading?: boolean;
}) {
  return (
    <RelatedContentSlider
      title={title}
      items={items}
      kind={kind}
      loading={loading}
    />
  );
}
