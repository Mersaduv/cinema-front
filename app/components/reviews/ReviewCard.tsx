"use client";

import { useState } from "react";
import type { Review } from "../../lib/reviews";
import { formatRelativeTimeFa } from "../../lib/reviews";

const BODY_TRUNCATE = 300;

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

  return (
    <article
      dir="rtl"
      role="listitem"
      className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            {review.user.name.slice(0, 1)}
          </div>
          <div>
            <div className="font-bold text-white">{review.user.name}</div>
            <div className="text-xs text-white/45">
              {formatRelativeTimeFa(review.created_at)}
            </div>
          </div>
        </div>
        <span
          className="rounded-full bg-[#ef4444]/20 px-3 py-1 text-sm font-bold text-[#fca5a5]"
          aria-label={`امتیاز ${review.rating} از ۱۰`}
        >
          {review.rating.toLocaleString("fa-IR")}/۱۰
        </span>
      </div>

      {body ? (
        <p className="mt-4 text-sm leading-7 text-white/75">
          {displayBody}
          {shouldTruncate ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mr-2 text-[#fca5a5] hover:underline"
            >
              {expanded ? "نمایش کمتر" : "نمایش بیشتر"}
            </button>
          ) : null}
        </p>
      ) : null}

      {review.is_own && (onEdit || onDelete) ? (
        <div className="mt-4 flex gap-3">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="text-sm text-white/70 transition hover:text-white"
            >
              ویرایش
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm text-[#f87171] transition hover:text-[#fca5a5]"
            >
              حذف
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
