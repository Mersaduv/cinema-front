"use client";

import type { Review, ReviewSort } from "../../lib/reviews";
import ReviewCard from "./ReviewCard";

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">فهرست نظرات</h3>
        <label className="text-sm text-white/60">
          مرتب‌سازی
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as ReviewSort)}
            className="mr-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white outline-none"
            aria-label="مرتب‌سازی نظرات"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="top_rated">بیشترین امتیاز</option>
          </select>
        </label>
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
          className="w-full rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-bold text-white transition hover:border-white/20 disabled:opacity-60"
        >
          {loading ? "در حال بارگذاری..." : "نمایش بیشتر"}
        </button>
      ) : null}
    </div>
  );
}
