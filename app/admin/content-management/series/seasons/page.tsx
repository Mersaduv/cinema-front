"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlinePencilAlt, HiOutlinePlus } from "react-icons/hi";
import { adminSeriesService, type AdminSeries } from "../../../../lib/admin-series";
import { formatGregorianDate } from "../../../../lib/date-format";

type SeasonRow = {
  series: AdminSeries;
  seasonNumber: number;
  name: string;
  synopsis: string | null;
  airDate: string | null;
  episodeCount: number;
  posterUrl: string | null;
};

export default function SeasonsPage() {
  const [rows, setRows] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      const response = await adminSeriesService.list({
        include_seasons: true,
        page: 1,
      });

      if (response.success && response.data) {
        const nextRows = response.data.series.flatMap((series) =>
          (series.seasons || []).map((season) => ({
            series,
            seasonNumber: season.season_number,
            name: season.name || `Season ${season.season_number}`,
            synopsis: season.synopsis || null,
            airDate: season.air_date || null,
            episodeCount: season.episodes?.length || season.episode_count || 0,
            posterUrl: season.poster_url || series.poster_url,
          })),
        );

        setRows(nextRows);
      } else {
        setError(response.message || "دریافت فصل ها انجام نشد.");
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
              Seasons
            </span>
            <h2 className="mt-5 text-3xl font-black text-white md:text-5xl">
              فصل های سریال ها
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-[#d8e5ec] md:text-base">
              این صفحه فصل های ثبت شده داخل فرم سریال را نشان می دهد و برای ویرایش، مستقیم به همان سریال وصل می شود.
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
          <h3 className="text-xl font-bold text-white">لیست فصل ها</h3>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#b6c5cf]">
            {rows.length} فصل
          </span>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center text-[#8ea4b3]">
            هنوز فصلی ثبت نشده است.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <article
                key={`${row.series.id}-${row.seasonNumber}`}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"
              >
                <div className="relative h-44 bg-white/[0.03]">
                  {row.posterUrl ? (
                    <img
                      src={row.posterUrl}
                      alt={row.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,25,0.1),rgba(7,16,25,0.84))]" />
                  <div className="relative flex h-full items-end p-4">
                    <div>
                      <p className="text-xs text-[#f8d977]">{row.series.title}</p>
                      <h4 className="mt-1 text-xl font-black text-white">{row.name}</h4>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  <p className="line-clamp-2 min-h-[48px] text-sm leading-6 text-[#c7d5de]">
                    {row.synopsis || "توضیحی برای این فصل ثبت نشده است."}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-[#d7e4eb]">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {row.episodeCount} قسمت
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {formatGregorianDate(row.airDate)}
                    </span>
                  </div>
                  <Link
                    href={`/admin/content-management/series/${row.series.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
                  >
                    <HiOutlinePencilAlt className="h-4 w-4" />
                    ویرایش سریال
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
