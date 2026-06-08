"use client";

import CatalogPosterCard from "../catalog/CatalogPosterCard";
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
    <section className="space-y-5" aria-label={title}>
      <h2 className="text-right text-2xl font-black text-white md:text-[1.65rem]">{title}</h2>

      <div
        className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scroll-smooth [scroll-snap-type:x_mandatory]"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((item) => (
          <div
            key={`${kind}-${item.id}`}
            className="w-[calc((100%-1rem)/2.2)] min-w-[140px] max-w-[180px] shrink-0 snap-start sm:w-[calc((100%-2rem)/4.5)] sm:min-w-[160px] md:max-w-[200px]"
          >
            <CatalogPosterCard item={item} href={`${basePath}/${item.slug}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
