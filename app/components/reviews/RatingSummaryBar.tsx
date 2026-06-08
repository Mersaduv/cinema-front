"use client";

import type { ReviewSummary } from "../../lib/reviews";

export default function RatingSummaryBar({
  cachedAvgRating,
  summary,
}: {
  cachedAvgRating: number | null;
  summary: ReviewSummary;
}) {
  const displayRating =
    cachedAvgRating ?? (summary.total_count > 0 ? summary.average_rating : null);
  const maxCount = Math.max(
    1,
    ...Object.values(summary.distribution).map((value) => Number(value)),
  );

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-end gap-3">
        <span className="text-5xl font-black text-white">
          {displayRating !== null ? displayRating.toFixed(1) : "—"}
        </span>
        <div className="pb-2 text-sm text-white/60">
          <div>از ۱۰</div>
          <div>{summary.total_count.toLocaleString("fa-IR")} نظر</div>
        </div>
      </div>

      <div className="space-y-2" aria-label="توزیع امتیازها">
        {Array.from({ length: 10 }, (_, index) => 10 - index).map((score) => {
          const count = summary.distribution[String(score)] ?? 0;
          const width = `${Math.round((count / maxCount) * 100)}%`;

          return (
            <div key={score} className="flex items-center gap-3 text-xs text-white/70">
              <span className="w-5 text-left">{score.toLocaleString("fa-IR")}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#ef4444]"
                  style={{ width }}
                  aria-hidden
                />
              </div>
              <span className="w-8 text-left">{count.toLocaleString("fa-IR")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
