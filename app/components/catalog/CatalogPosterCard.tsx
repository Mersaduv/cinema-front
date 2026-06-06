"use client";

import Image from "next/image";
import Link from "next/link";
import { HiMiniPlay } from "react-icons/hi2";
import type { CatalogListItem } from "../../lib/catalog/rest";

function formatRating(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const catalogBadgeBase =
  "inline-flex items-center rounded-md px-2 py-2 text-[12px] font-semibold leading-none backdrop-blur-sm";
const catalogBadgeMuted = `${catalogBadgeBase} bg-black/70 text-white/90`;
const catalogBadgeFeature = `${catalogBadgeBase} border border-[#f5c518]/35 bg-black/75 text-[#f8d977]`;

export default function CatalogPosterCard({
  item,
  href,
}: {
  item: CatalogListItem;
  href: string;
}) {
  const poster = item.poster_url || item.backdrop_url || item.details.backdrop_url;
  const rating = formatRating(item.rating ?? item.details.rating);
  const genres = item.details.genres.slice(0, 3);
  const dubbed = item.has_dubbed ?? item.has_dubbed_audio;
  const audioLabel = dubbed ? "دوبله" : "زبان اصلی";
  const hasSubtitle = Boolean(item.has_subtitle);

  return (
    <Link href={href} className="group block w-full min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#12161f]">
        {poster ? (
          <Image
            src={poster}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1280px) 20vw, 14vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-white/40">
            {item.title}
          </div>
        )}

        <div className="absolute top-2 left-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center gap-1.5">
          <span className={dubbed ? catalogBadgeFeature : catalogBadgeMuted}>
            {audioLabel}
          </span>
          {hasSubtitle ? (
            <span className={catalogBadgeFeature}>زیرنویس</span>
          ) : null}
        </div>

        {genres.length > 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2.5 opacity-0 transition duration-300 group-hover:opacity-100">
            <p className="text-right text-xs font-medium leading-5 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-sm sm:leading-6">
              {genres.join("، ")}
            </p>
          </div>
        ) : null}

        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
            <HiMiniPlay className="h-7 w-7" />
          </span>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5 text-right">
        <p className="line-clamp-2 text-sm font-semibold leading-6 text-white">
          {item.title}
          {item.release_year ? (
            <span className="font-normal text-white/75"> ({item.release_year})</span>
          ) : null}
        </p>
        {rating ? (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-sm font-semibold text-white">{rating}</span>
            <span className="rounded bg-[#f5c518] px-1.5 py-0.5 text-[10px] font-black tracking-tight text-black">
              IMDb
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
