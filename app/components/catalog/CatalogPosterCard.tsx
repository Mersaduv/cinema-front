"use client";

import Link from "next/link";
import { HiMiniPlay } from "react-icons/hi2";
import { PosterImage } from "../images";
import type { CatalogListItem } from "../../lib/catalog/rest";
import type { ResponsiveImageAsset } from "../../lib/cinema-image";
import { TV_CARD_FOCUS_CLASS, TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import {
  SeriesStackShell,
  isSeriesCatalogHref,
} from "./SeriesPosterStack";

function formatRating(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function resolvePosterImage(item: CatalogListItem): ResponsiveImageAsset | null | undefined {
  if (item.poster_image) {
    return item.poster_image;
  }

  if (!item.poster_url && !item.poster_blur_url && !item.poster_srcset) {
    return null;
  }

  return {
    original: item.poster_url ?? null,
    src: item.poster_url ?? null,
    blur: item.poster_blur_url ?? null,
    srcset_string: item.poster_srcset ?? null,
  };
}

const catalogBadgeFeature =
  "inline-flex items-center rounded-md border border-white/25 bg-white/18 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md";

const posterMetaText =
  "pointer-events-none inline-flex items-center text-[10px] font-semibold leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-[11px]";

export default function CatalogPosterCard({
  item,
  href,
  index = 0,
  carouselItem = false,
  imageLoading,
  imageFetchPriority,
  deferImage = false,
  onImageLoad,
  forceSeries,
}: {
  item: CatalogListItem;
  href: string;
  index?: number;
  carouselItem?: boolean;
  imageLoading?: "eager" | "lazy";
  imageFetchPriority?: "high" | "low" | "auto";
  deferImage?: boolean;
  onImageLoad?: () => void;
  forceSeries?: boolean;
}) {
  const rating = formatRating(item.rating ?? item.details.rating);
  const year = item.release_year ? String(item.release_year) : null;
  const genres = item.details.genres.slice(0, 3);
  const dubbed = item.has_dubbed ?? item.has_dubbed_audio;
  const hasSubtitle = Boolean(item.has_subtitle);
  const resolvedLoading = imageLoading ?? "lazy";
  const resolvedFetchPriority = imageFetchPriority ?? "auto";
  const posterImage = resolvePosterImage(item);
  const isSeries =
    forceSeries === true ||
    (forceSeries !== false && isSeriesCatalogHref(href, item.catalogKind));

  const posterShell = (
    <div
      data-tv-poster-shell
      className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-[#12161f] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${
        isSeries ? "z-[1]" : ""
      }`}
    >
      <PosterImage
        title={item.title}
        image={posterImage}
        src={item.poster_url}
        fallbackUrl={item.backdrop_url ?? item.details.backdrop_url}
        usage="poster-grid"
        loading={resolvedLoading}
        fetchPriority={resolvedFetchPriority}
        deferLoad={deferImage}
        onLoadComplete={onImageLoad}
        wrapperClassName="h-full transition duration-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.04] [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:scale-[1.04]"
      />

      {dubbed || hasSubtitle ? (
        <div
          data-tv-poster-badge
          className="absolute top-2 right-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-1.5"
        >
          {dubbed ? <span className={catalogBadgeFeature}>دوبله فارسی</span> : null}
          {hasSubtitle ? <span className={catalogBadgeFeature}>زیرنویس</span> : null}
        </div>
      ) : null}

      {/* Soft frosted glass — short band matching year/IMDb row, light gradient fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-8 bg-gradient-to-t from-black/40 via-black/12 to-transparent backdrop-blur-[1.5px] [mask-image:linear-gradient(to_top,black_35%,transparent)]"
      />

      {/* Year bottom-left, IMDb bottom-right — no chip background; hide on hover for genres */}
      {year ? (
        <span
          className={`absolute bottom-2 left-2 z-10 ${posterMetaText} transition duration-300 group-hover:opacity-0 group-focus-within:opacity-0 ${TV_CARD_FOCUS_CLASS}`}
        >
          {year}
        </span>
      ) : null}
      {rating ? (
        <span
          className={`absolute bottom-2 right-2 z-10 ${posterMetaText} gap-1 transition duration-300 group-hover:opacity-0 group-focus-within:opacity-0 ${TV_CARD_FOCUS_CLASS}`}
        >
          <span className="rounded-[3px] bg-[#f5c518] px-1.5 pb-[1px] pt-[3px] text-[9px] font-black leading-none tracking-tight text-black">
            IMDb
          </span>
          <span>{rating}</span>
        </span>
      ) : null}

      {genres.length > 0 ? (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2.5 pt-8 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100 ${TV_CARD_FOCUS_CLASS}`}
        >
          <p className="text-right text-xs font-medium leading-5 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-sm sm:leading-6">
            {genres.join("، ")}
          </p>
        </div>
      ) : null}

      <div
        className={`absolute inset-0 z-[5] flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 ${TV_CARD_FOCUS_CLASS}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
          <HiMiniPlay className="h-7 w-7" />
        </span>
      </div>
    </div>
  );

  return (
    <Link
      href={href}
      aria-label={item.title}
      data-tv-focusable
      data-tv-grid-item={carouselItem ? undefined : true}
      data-tv-carousel-item={carouselItem ? true : undefined}
      data-content-kind={isSeries ? "series" : "movie"}
      tabIndex={0}
      className={`group block w-full min-w-0 rounded-xl ${TV_FOCUS_RING_CLASS}`}
    >
      {isSeries ? <SeriesStackShell>{posterShell}</SeriesStackShell> : posterShell}

      <div className="mt-2.5 text-right">
        <p className="line-clamp-2 text-sm font-semibold leading-6 text-white">
          {item.title}
        </p>
      </div>
    </Link>
  );
}
