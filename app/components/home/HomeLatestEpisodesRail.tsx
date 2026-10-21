"use client";

import Link from "next/link";
import ContentListSlider from "../catalog/ContentListSlider";
import { SeriesStackShell } from "../catalog/SeriesPosterStack";
import { EpisodeStillImage } from "../images";
import { useSequentialLoadGate } from "../../hooks/useSequentialLoadGate";
import { TV_CARD_FOCUS_CLASS, TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import { HiMiniPlay } from "react-icons/hi2";

export type LatestEpisodeCard = {
  id: number;
  title: string | null;
  season_number: number;
  episode_number: number;
  still_url: string | null;
  series: {
    slug: string;
    title: string;
  };
};

const LANDSCAPE_SLIDE_CLASS =
  "shrink-0 snap-start w-[62%] min-w-[220px] max-w-[340px] sm:w-[44%] md:w-[34%] lg:w-[26%] xl:w-[22%]";

export default function HomeLatestEpisodesRail({
  items,
}: {
  items: LatestEpisodeCard[];
}) {
  const gateTotal = Math.min(4, items.length);
  const { canLoad, markLoaded } = useSequentialLoadGate(gateTotal, {
    enabled: gateTotal > 1,
    stallMs: 3_500,
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" dir="rtl" aria-label="آخرین قسمت ها در سینما">
      <h2 className="text-right text-lg font-bold text-white md:text-xl">
        آخرین قسمت ها در سینما
      </h2>
      <ContentListSlider ariaLabel="آخرین قسمت ها در سینما">
        {items.map((item, index) => {
          const href = `/watch/${item.series.slug}?season=${item.season_number}&episode=${item.episode_number}`;
          const inBatch = index < gateTotal;
          const imageReady = !inBatch || canLoad(index);
          const label = item.title?.trim() || item.series.title;

          return (
            <div
              key={item.id}
              data-slider-slide
              className={LANDSCAPE_SLIDE_CLASS}
            >
              <Link
                href={href}
                aria-label={label}
                data-tv-focusable
                data-tv-carousel-item
                data-content-kind="series"
                className={`group block rounded-xl ${TV_FOCUS_RING_CLASS}`}
              >
                <SeriesStackShell variant="landscape">
                  <div
                    data-tv-landscape-shell
                    className="relative z-[1] aspect-video overflow-hidden rounded-xl bg-[#12161f] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
                  >
                    <EpisodeStillImage
                      seriesTitle={item.series.title}
                      seasonNumber={item.season_number}
                      episodeNumber={item.episode_number}
                      src={item.still_url}
                      usage="episode-card"
                      deferLoad={!imageReady}
                      loading={inBatch && imageReady ? "eager" : "lazy"}
                      fetchPriority={index === 0 && imageReady ? "high" : "auto"}
                      onLoadComplete={inBatch ? () => markLoaded(index) : undefined}
                      wrapperClassName="h-full transition duration-500 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.04]"
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 ${TV_CARD_FOCUS_CLASS}`}
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                        <HiMiniPlay className="h-7 w-7" />
                      </span>
                    </div>
                  </div>
                </SeriesStackShell>
                <p className="mt-2 line-clamp-2 text-right text-xs font-medium text-white/90 md:text-sm">
                  {item.series.title}
                </p>
                <p className="mt-0.5 text-right text-[11px] text-white/50">
                  فصل {item.season_number} — قسمت {item.episode_number}
                  {item.title ? ` · ${item.title}` : ""}
                </p>
              </Link>
            </div>
          );
        })}
      </ContentListSlider>
    </section>
  );
}
