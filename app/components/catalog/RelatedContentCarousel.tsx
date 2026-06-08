"use client";

import Image from "next/image";
import Link from "next/link";
import type { CatalogListItem } from "../../lib/catalog/rest";

export default function RelatedContentCarousel({
  title,
  items,
  kind,
  loading,
}: {
  title: string;
  items: CatalogListItem[];
  kind: "movie" | "series";
  loading: boolean;
}) {
  if (!loading && items.length === 0) {
    return null;
  }

  const basePath = kind === "movie" ? "/movies" : "/series";

  return (
    <section
      dir="rtl"
      role="region"
      aria-label={title}
      className="space-y-5"
    >
      <h2 className="text-2xl font-black text-white">{title}</h2>

      <div className="relative">
        <div
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [scroll-snap-type:x_mandatory]"
          style={{ scrollbarWidth: "thin" }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`related-skeleton-${index}`}
                  className="min-w-[calc(50%-0.5rem)] shrink-0 snap-start overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] sm:min-w-[calc(25%-0.75rem)]"
                >
                  <div className="aspect-[2/3] animate-pulse bg-white/8" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-white/8" />
                  </div>
                </div>
              ))
            : items.map((item) => {
                const href = `${basePath}/${item.slug}`;
                const visual = item.poster_url || item.backdrop_url || item.details.backdrop_url;

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="min-w-[calc(50%-0.5rem)] shrink-0 snap-start overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/16 sm:min-w-[calc(25%-0.75rem)]"
                  >
                    <div className="relative aspect-[2/3] bg-white/5">
                      {visual ? (
                        <Image
                          src={visual}
                          alt={`${item.title} poster`}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          loading="lazy"
                          className="object-cover"
                        />
                      ) : null}
                      {item.rating != null ? (
                        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">
                          {item.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2 p-4">
                      <h3 className="line-clamp-1 text-sm font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-white/50">
                        {item.release_year
                          ? item.release_year.toLocaleString("fa-IR")
                          : "—"}
                      </p>
                      {item.details.genres.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.details.genres.slice(0, 2).map((genre) => (
                            <span
                              key={`${item.id}-${genre}`}
                              className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/70"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
