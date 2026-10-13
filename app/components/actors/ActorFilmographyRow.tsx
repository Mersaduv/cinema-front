"use client";

import CatalogPosterCard from "../catalog/CatalogPosterCard";
import ContentListSlider, { SLIDER_SLIDE_CLASS } from "../catalog/ContentListSlider";
import type { CatalogListItem } from "../../lib/catalog/rest";

export default function ActorFilmographyRow({
  title,
  items,
  kind,
}: {
  title: string;
  items: CatalogListItem[];
  kind: "movie" | "series";
}) {
  if (items.length === 0) {
    return null;
  }

  const basePath = kind === "movie" ? "/movies" : "/series";

  return (
    <section className="space-y-4" aria-label={title}>
      <h2 className="text-right text-xl font-bold text-white md:text-2xl">{title}</h2>

      <ContentListSlider ariaLabel={title}>
        {items.map((item) => (
          <div key={`${kind}-${item.id}`} data-slider-slide className={SLIDER_SLIDE_CLASS}>
            <CatalogPosterCard
              item={{ ...item, catalogKind: kind }}
              href={`${basePath}/${item.slug}`}
            />
          </div>
        ))}
      </ContentListSlider>
    </section>
  );
}
