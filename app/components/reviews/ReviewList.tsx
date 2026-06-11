"use client";

import type { Review, ReviewSort } from "../../lib/reviews";
import ReviewCard from "./ReviewCard";
import ReviewSortDropdown from "./ReviewSortDropdown";

export default function ReviewList({
  reviews,
  sort,
  loading,
  onSortChange,
  onLoadMore,
  hasMore,
  onEditOwn,
  onDeleteOwn,
}: {
  reviews: Review[];
  sort: ReviewSort;
  loading: boolean;
  onSortChange: (sort: ReviewSort) => void;
  onLoadMore?: () => void;
  hasMore: boolean;
  onEditOwn: () => void;
  onDeleteOwn: (review: Review) => void;
}) {
  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <h3 className="text-lg font-bold text-white">فهرست نظرات</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/45">مرتب‌سازی</span>
          <ReviewSortDropdown value={sort} onChange={onSortChange} disabled={loading} />
        </div>
      </div>

      <div role="list" className="space-y-4" aria-busy={loading}>
        {reviews.length === 0 && !loading ? (
          <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-12 text-center text-white/45">
            هنوز نظری ثبت نشده است.
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={review.is_own ? onEditOwn : undefined}
              onDelete={review.is_own ? () => onDeleteOwn(review) : undefined}
            />
          ))
        )}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="w-full rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-bold text-white/85 transition hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-60"
        >
          {loading ? "در حال بارگذاری..." : "نمایش بیشتر"}
        </button>
      ) : null}
    </div>
  );
}
