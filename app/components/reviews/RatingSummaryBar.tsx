"use client";

import { useMemo, useState } from "react";
import type { ReviewSummary } from "../../lib/reviews";

const IMDB_GOLD = "#f5c518";
const IMDB_GOLD_DIM = "#c9a227";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.5l2.63 5.33 5.88.86-4.25 4.14 1 5.86L12 16.9l-5.26 2.79 1-5.86-4.25-4.14 5.88-.86L12 2.5z"
      />
    </svg>
  );
}

export default function RatingSummaryBar({
  cachedAvgRating,
  summary,
}: {
  cachedAvgRating: number | null;
  summary: ReviewSummary;
}) {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  const displayRating =
    cachedAvgRating ?? (summary.total_count > 0 ? summary.average_rating : null);

  const buckets = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const score = 10 - index;
        const count = summary.distribution[String(score)] ?? 0;
        const percent =
          summary.total_count > 0
            ? Math.round((count / summary.total_count) * 100)
            : 0;

        return { score, count, percent };
      }),
    [summary],
  );

  const maxPercent = Math.max(1, ...buckets.map((bucket) => bucket.percent));
  const hoveredBucket = buckets.find((bucket) => bucket.score === hoveredScore);

  return (
    <div
      dir="rtl"
      className="relative overflow-hidden rounded-[28px] border border-[#f5c518]/20 bg-[linear-gradient(135deg,rgba(245,197,24,0.08)_0%,rgba(9,14,20,0.95)_45%,rgba(9,14,20,1)_100%)] p-5 sm:p-6"
      aria-label="امتیاز کاربران"
    >
      <div
        className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-[#f5c518]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-[#f5c518]/6 blur-2xl"
        aria-hidden
      />

      <div className="relative grid gap-6 lg:items-center">
        

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-white/55">توزیع امتیازها</p>
            {hoveredBucket ? (
              <p className="text-xs text-[#f8d977]">
                امتیاز {hoveredBucket.score.toLocaleString("fa-IR")}:{" "}
                {hoveredBucket.percent.toLocaleString("fa-IR")}% (
                {hoveredBucket.count.toLocaleString("fa-IR")} رأی)
              </p>
            ) : (
              <p className="text-xs text-white/35">روی هر میله بایستید</p>
            )}
          </div>

          <div
            className="space-y-[7px]"
            role="img"
            aria-label={`نمودار توزیع امتیاز از ۱ تا ۱۰، مجموع ${summary.total_count} رأی`}
          >
            {buckets.map((bucket) => {
              const width = `${Math.max(bucket.percent > 0 ? 6 : 0, (bucket.percent / maxPercent) * 100)}%`;
              const isHovered = hoveredScore === bucket.score;
              const isActive = bucket.count > 0;

              return (
                <button
                  key={bucket.score}
                  type="button"
                  className="group grid w-full grid-cols-[28px_1fr_36px] items-center gap-2 rounded-lg px-1 py-0.5 text-left transition hover:bg-[#f5c518]/5"
                  onMouseEnter={() => setHoveredScore(bucket.score)}
                  onMouseLeave={() => setHoveredScore(null)}
                  onFocus={() => setHoveredScore(bucket.score)}
                  onBlur={() => setHoveredScore(null)}
                  aria-label={`امتیاز ${bucket.score}، ${bucket.percent} درصد، ${bucket.count} رأی`}
                >
                  <span
                    className={`text-xs font-bold tabular-nums transition ${
                      isHovered ? "text-[#f8d977]" : "text-[#f5c518]/80"
                    }`}
                  >
                    {bucket.score.toLocaleString("fa-IR")}
                  </span>

                  <div className="relative h-[10px] overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="absolute inset-y-0 right-0 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width,
                        background: isActive
                          ? `linear-gradient(90deg, ${IMDB_GOLD_DIM} 0%, ${IMDB_GOLD} 55%, #ffe08a 100%)`
                          : "transparent",
                        boxShadow: isHovered
                          ? "0 0 14px rgba(245,197,24,0.45)"
                          : isActive
                            ? "0 0 6px rgba(245,197,24,0.2)"
                            : "none",
                        opacity: isHovered ? 1 : isActive ? 0.92 : 0.35,
                      }}
                    />
                    {isHovered && isActive ? (
                      <div
                        className="absolute inset-y-0 right-0 rounded-full bg-white/20"
                        style={{ width }}
                        aria-hidden
                      />
                    ) : null}
                  </div>

                  <span
                    className={`text-[10px] tabular-nums transition ${
                      isHovered ? "text-[#f8d977]" : "text-white/35"
                    }`}
                  >
                    {bucket.percent > 0 ? `${bucket.percent}%` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
