"use client";

import type { SeriesPublishStatus } from "../../lib/admin-series";
import { formatGregorianDateTime } from "../../lib/date-format";

function SummaryRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-[#8ea4b3]">{label}</span>
      <span className={`font-semibold text-white ${ltr ? "text-left" : "text-right"}`} dir={ltr ? "ltr" : "rtl"}>
        {value}
      </span>
    </div>
  );
}

export default function SeriesFormStatusPanel({
  title,
  originalTitle,
  synopsis,
  slug,
  posterUrl,
  backdropUrl,
  productionStatusLabel,
  publishStatusLabel,
  seasonsCount,
  episodesCount,
  genres,
  tags,
  scheduledFor,
  publishStatus,
  hasSubtitle = false,
  hasDubbed = false,
  fullWidth = false,
}: {
  title: string;
  originalTitle: string;
  synopsis: string;
  slug: string;
  posterUrl: string;
  backdropUrl: string;
  productionStatusLabel: string;
  publishStatusLabel: string;
  seasonsCount: number;
  episodesCount: number;
  genres: string[];
  tags: string[];
  scheduledFor: string;
  publishStatus: SeriesPublishStatus;
  hasSubtitle?: boolean;
  hasDubbed?: boolean;
  fullWidth?: boolean;
}) {
  const previewHeight = fullWidth ? "min-h-[28rem]" : "h-[24rem]";

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0b1720] p-5 md:p-6">
      <h3 className="text-xl font-black text-white md:text-2xl">وضعیت فرم</h3>
      <p className="mt-2 text-sm text-[#8ea4b3]">
        خلاصهٔ داده‌های ثبت‌شده قبل از انتشار نهایی
      </p>

      <div className={`mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] ${previewHeight}`}>
        {backdropUrl || posterUrl ? (
          <div className={`relative ${previewHeight} overflow-hidden`}>
            {backdropUrl ? (
              <img
                src={backdropUrl}
                alt={title || "Series backdrop"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,25,0.08),rgba(7,16,25,0.88)_62%,rgba(7,16,25,0.98))]" />
            <div className="relative flex h-full flex-col justify-end p-5 md:p-6">
              <div className="flex items-end gap-5">
                <div className="h-40 w-28 overflow-hidden rounded-[20px] border border-white/10 bg-[#071019] shadow-[0_20px_40px_rgba(0,0,0,0.32)] md:h-44 md:w-32">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={title || "Series poster"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-[#8ea4b3]">
                      No poster
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-2xl font-black text-white md:text-3xl">
                    {title || originalTitle || "عنوان سریال"}
                  </h4>
                  <p className="mt-3 line-clamp-5 text-sm leading-7 text-[#d6e2e9] md:text-base">
                    {synopsis || "خلاصه‌ای ثبت نشده است."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs md:text-sm">
                    <span className="rounded-full border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-3 py-1 text-[#7dd3fc]">
                      {productionStatusLabel}
                    </span>
                    <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-[#f8d977]">
                      {publishStatusLabel}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[#dde7ed]">
                      {seasonsCount} فصل
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[#dde7ed]">
                      {episodesCount} قسمت
                    </span>
                    {hasSubtitle ? (
                      <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 font-semibold text-[#f8d977]">
                        زیرنویس
                      </span>
                    ) : null}
                    {hasDubbed ? (
                      <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 font-semibold text-[#f8d977]">
                        دوبله
                      </span>
                    ) : null}
                    {genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[#dde7ed]"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-52 items-center justify-center px-6 text-center text-sm text-[#8ea4b3] md:h-64">
            پس از ثبت پوستر یا بک‌دراپ، پیش‌نمایش وضعیت فرم اینجا نمایش داده می‌شود.
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <SummaryRow label="عنوان" value={title || "ثبت نشده"} />
        <SummaryRow label="Slug" value={slug} ltr />
        <SummaryRow label="فصل‌ها" value={String(seasonsCount)} />
        <SummaryRow label="قسمت‌ها" value={String(episodesCount)} />
        <SummaryRow label="وضعیت تولید" value={productionStatusLabel} />
        <SummaryRow label="انتشار" value={publishStatusLabel} />
        <SummaryRow label="ژانرها" value={genres.join("، ") || "ثبت نشده"} />
        <SummaryRow label="برچسب‌ها" value={tags.join("، ") || "ثبت نشده"} />
        <SummaryRow
          label="زمان انتشار"
          value={
            publishStatus === "scheduled" && scheduledFor
              ? formatGregorianDateTime(scheduledFor)
              : "ثبت نشده"
          }
        />
      </div>
    </section>
  );
}
