"use client";

import CatalogPosterCard from "./CatalogPosterCard";
import CatalogPosterCardSkeleton from "./CatalogPosterCardSkeleton";
import ContentListSlider, { SLIDER_SLIDE_CLASS } from "./ContentListSlider";
import type { CatalogListItem } from "../../lib/catalog/rest";

export default function RelatedContentSlider({
  title,
  items,
  kind,
  loading = false,
}: {
  title: string;
  items: CatalogListItem[];
  kind: "movie" | "series";
  loading?: boolean;
}) {
  if (!loading && items.length === 0) {
    return null;
  }

  const basePath = kind === "movie" ? "/movies" : "/series";

  return (
    <section className="related-content space-y-4" aria-labelledby={`related-${kind}-heading`}>
      <h2
        id={`related-${kind}-heading`}
        className="text-right text-xl font-bold text-white md:text-2xl"
      >
        {title}
      </h2>

      <ContentListSlider ariaLabel={title}>
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`related-skeleton-${index}`}
                data-slider-slide
                className={SLIDER_SLIDE_CLASS}
              >
                <CatalogPosterCardSkeleton isSeries={kind === "series"} />
              </div>
            ))
          : items.map((item) => (
              <div key={item.id} data-slider-slide className={SLIDER_SLIDE_CLASS}>
                <CatalogPosterCard
                  item={{ ...item, catalogKind: kind }}
                  href={`${basePath}/${item.slug}`}
                  carouselItem
                />
              </div>
            ))}
      </ContentListSlider>
    </section>
  );
}
