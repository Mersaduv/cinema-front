"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlinePencilAlt, HiOutlinePlus } from "react-icons/hi";
import {
  adminSeriesService,
  type AdminSeries,
  type AdminSeriesEpisode,
} from "../../../../lib/admin-series";
import { formatGregorianDate } from "../../../../lib/date-format";

type EpisodeRow = {
  series: AdminSeries;
  episode: AdminSeriesEpisode;
};

function playbackLabel(episode: AdminSeriesEpisode) {
  if (episode.hls_url) {
    return "HLS آماده";
  }
  if (episode.embed_url) {
    return "Embed";
  }
  if (episode.video_url) {
    return "Episode URL";
  }

  return "بدون لینک پخش";
}

export default function EpisodesPage() {
  const [rows, setRows] = useState<EpisodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      const response = await adminSeriesService.list({
        include_seasons: true,
        include_episodes: true,
        page: 1,
      });

      if (response.success && response.data) {
        const nextRows = response.data.series.flatMap((series) =>
          (series.seasons || []).flatMap((season) =>
            (season.episodes || []).map((episode) => ({
              series,
              episode,
            })),
          ),
        );

        setRows(nextRows);
      } else {
        setError(response.message || "دریافت قسمت ها انجام نشد.");
      }

      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_45%,rgba(56,189,248,0.14))] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
              Episodes
            </span>
            <h2 className="mt-5 text-3xl font-black text-white md:text-5xl">
              قسمت های سریال ها
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[#d8e5ec] md:text-base">
              قسمت ها از فرم سریال خوانده می شوند و روش پخش هر قسمت، لینک HLS، زیرنویس و وضعیت انتشار را نشان می دهند.
            </p>
          </div>
          <Link
            href="/admin/content-management/series/add"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#e1b400]"
          >
            <HiOutlinePlus className="h-4 w-4" />
            افزودن سریال
          </Link>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-white">لیست قسمت ها</h3>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#b6c5cf]">
            {rows.length} قسمت
          </span>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center text-[#8ea4b3]">
            هنوز قسمتی ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(({ series, episode }) => (
              <article
                key={`${series.id}-${episode.season_number}-${episode.episode_number}`}
                className="grid gap-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/16 md:grid-cols-[120px_1fr_auto]"
              >
                <div className="relative h-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  {episode.still_url || series.backdrop_url ? (
                    <img
                      src={episode.still_url || series.backdrop_url || ""}
                      alt={episode.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-[#f8d977]">{series.title}</p>
                  <h4 className="mt-1 text-lg font-black text-white">
                    فصل {episode.season_number}، قسمت {episode.episode_number}: {episode.title}
                  </h4>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#c7d5de]">
                    {episode.synopsis || "خلاصه ای برای این قسمت ثبت نشده است."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#d7e4eb]">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {playbackLabel(episode)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {formatGregorianDate(episode.air_date)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {episode.publish_status || "draft"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center md:justify-end">
                  <Link
                    href={`/admin/content-management/series/${series.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
                  >
                    <HiOutlinePencilAlt className="h-4 w-4" />
                    ویرایش
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
