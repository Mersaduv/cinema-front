"use client";

import { useState } from "react";
import type { Review } from "../../lib/reviews";
import { formatRelativeTimeFa } from "../../lib/reviews";

const BODY_TRUNCATE = 300;

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#f5c518]" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.5l2.63 5.33 5.88.86-4.25 4.14 1 5.86L12 16.9l-5.26 2.79 1-5.86-4.25-4.14 5.88-.86L12 2.5z"
      />
    </svg>
  );
}

export default function ReviewCard({
  review,
  onEdit,
  onDelete,
}: {
  review: Review;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const body = review.body?.trim() ?? "";
  const shouldTruncate = body.length > BODY_TRUNCATE;
  const displayBody =
    shouldTruncate && !expanded ? `${body.slice(0, BODY_TRUNCATE)}...` : body;
  const isPending = review.is_pending || review.status === "pending";

  return (
    <article
      dir="rtl"
      role="listitem"
      className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 transition hover:border-white/14"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-bold text-white">
            {review.user.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white">{review.user.name}</span>
              {review.is_own && isPending ? (
                <span className="rounded-full border border-[#f5c518]/30 bg-[#f5c518]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f8d977]">
                  در انتظار تایید
                </span>
              ) : null}
            </div>
            <div className="text-xs text-white/45">
              {formatRelativeTimeFa(review.created_at)}
            </div>
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#f5c518]/30 bg-[#f5c518]/10 px-3 py-1.5"
          aria-label={`امتیاز ${review.rating} از ۱۰`}
        >
          <span className="text-sm font-black text-[#f8d977]">
            {review.rating.toLocaleString("fa-IR")}
          </span>
          <span className="text-[10px] text-[#f5c518]/70">/۱۰</span>
        </div>
      </div>

      {body ? (
        <p className="mt-4 text-sm leading-7 text-white/78">
          {displayBody}
          {shouldTruncate ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mr-2 font-medium text-[#f8d977] hover:underline"
            >
              {expanded ? "نمایش کمتر" : "نمایش بیشتر"}
            </button>
          ) : null}
        </p>
      ) : null}

      {review.is_own && (onEdit || onDelete) ? (
        <div className="mt-4 flex gap-4 border-t border-white/8 pt-4">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="text-sm font-medium text-white/65 transition hover:text-white"
            >
              ویرایش
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm font-medium text-white/50 transition hover:text-[#f87171]"
            >
              حذف
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
