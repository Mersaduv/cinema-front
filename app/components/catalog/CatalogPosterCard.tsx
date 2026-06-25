"use client";

import Link from "next/link";
import { HiMiniPlay } from "react-icons/hi2";
import { PosterImage } from "../images";
import type { CatalogListItem } from "../../lib/catalog/rest";
import { TV_CARD_FOCUS_CLASS, TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";

function formatRating(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

const catalogBadgeFeature =
  "inline-flex items-center rounded-md border border-[#f5c518]/35 bg-black/75 px-2 py-2 text-[12px] font-semibold leading-none text-[#f8d977] backdrop-blur-sm";

export default function CatalogPosterCard({
  item,
  href,
  index = 0,
  carouselItem = false,
}: {
  item: CatalogListItem;
  href: string;
  index?: number;
  carouselItem?: boolean;
}) {
  const isTvCompat = useIsTvCompat();
  const rating = formatRating(item.rating ?? item.details.rating);
  const genres = item.details.genres.slice(0, 3);
  const dubbed = item.has_dubbed ?? item.has_dubbed_audio;
  const hasSubtitle = Boolean(item.has_subtitle);
  const eagerImage = isTvCompat && index < 8;

  return (
    <Link
      href={href}
      data-tv-focusable
      data-tv-grid-item={carouselItem ? undefined : true}
      data-tv-carousel-item={carouselItem ? true : undefined}
      tabIndex={0}
      className={`group block w-full min-w-0 rounded-xl ${TV_FOCUS_RING_CLASS}`}
    >
      <div
        data-tv-poster-shell
        className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#12161f]"
      >
        <PosterImage
          title={item.title}
          image={item.poster_image}
          src={item.poster_url}
          fallbackUrl={item.backdrop_url ?? item.details.backdrop_url}
          usage="poster-grid"
          loading={eagerImage ? "eager" : undefined}
          wrapperClassName="h-full transition duration-500 group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
        />

        {dubbed || hasSubtitle ? (
          <div
            data-tv-poster-badge
            className="absolute top-2 right-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-1.5"
          >
            {dubbed ? (
              <span className={catalogBadgeFeature}>دوبله فارسی</span>
            ) : null}
            {hasSubtitle ? (
              <span className={catalogBadgeFeature}>زیرنویس</span>
            ) : null}
          </div>
        ) : null}

        {genres.length > 0 ? (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2.5 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100 ${TV_CARD_FOCUS_CLASS}`}
          >
            <p className="text-right text-xs font-medium leading-5 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-sm sm:leading-6">
              {genres.join("، ")}
            </p>
          </div>
        ) : null}

        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 ${TV_CARD_FOCUS_CLASS}`}
        >
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
            <span className="rounded bg-[#f5c518] px-1.5 py-0.5 pt-1 text-[10px] font-black tracking-tight text-black">
              IMDb
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
