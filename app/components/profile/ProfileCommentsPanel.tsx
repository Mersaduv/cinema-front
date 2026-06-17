"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { HiOutlineChatAlt2, HiOutlineTrash } from "react-icons/hi";
import {
  deleteReview,
  fetchMyReviews,
  formatRelativeTimeFa,
  getCachedMyReviews,
  type ProfileReviewItem,
  type ReviewStatus,
} from "../../lib/reviews";

const statusLabels: Record<ReviewStatus | "all", string> = {
  all: "همه",
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
};

const statusBadgeClass: Record<ReviewStatus, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

function resolveReviewHref(review: ProfileReviewItem): string | null {
  if (!review.reviewable_slug || !review.reviewable_type) {
    return null;
  }
  return `/${review.reviewable_type === "movie" ? "movies" : "series"}/${review.reviewable_slug}`;
}

export default function ProfileCommentsPanel() {
  const cachedItems = useMemo(() => getCachedMyReviews(), []);
  const [items, setItems] = useState<ProfileReviewItem[]>(cachedItems);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState<ReviewStatus | "all">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { isLoading } = useSWR(
    "profile:comments",
    async () => {
      const response = await fetchMyReviews();
      if (!response.success || !response.data) {
        throw new Error(response.message ?? "خطا در دریافت دیدگاه‌ها");
      }
      return response.data.reviews;
    },
    {
      fallbackData: cachedItems,
      revalidateOnFocus: true,
      refreshInterval: 30_000,
      keepPreviousData: true,
      dedupingInterval: 10_000,
      onSuccess: (nextItems) => {
        setItems(nextItems);
        setError("");
      },
      onError: (nextError) => {
        if (cachedItems.length === 0) {
          setItems([]);
          setError(
            nextError instanceof Error ? nextError.message : "خطا در دریافت دیدگاه‌ها",
          );
        }
      },
    },
  );

  const counts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter((item) => item.status === "pending" || item.is_pending).length,
      approved: items.filter((item) => item.status === "approved").length,
      rejected: items.filter((item) => item.status === "rejected").length,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    if (activeStatus === "all") {
      return items;
    }
    return items.filter((item) => {
      const status = item.status ?? (item.is_pending ? "pending" : "approved");
      return status === activeStatus;
    });
  }, [activeStatus, items]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    const response = await deleteReview(id);
    setDeletingId(null);

    if (!response.success) {
      setError(response.message ?? "حذف دیدگاه انجام نشد.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <section className="rounded-2xl border border-[#2c2c2c] bg-[#111111] p-6">
      <div className="mb-6 flex items-center gap-2 text-white">
        <HiOutlineChatAlt2 className="h-5 w-5 text-[#f8d977]" />
        <h2 className="text-xl font-bold">دیدگاه‌های شما</h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(statusLabels) as Array<ReviewStatus | "all">).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveStatus(status)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeStatus === status
                ? "border-[#f5c518]/45 bg-[#f5c518]/15 text-[#f8d977]"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {statusLabels[status]} ({counts[status] ?? 0})
          </button>
        ))}
      </div>

      {isLoading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`comments-skeleton-${index}`}
              className="rounded-xl border border-white/10 bg-white/3 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex h-5 w-24 animate-pulse rounded bg-white/10" />
                <span className="inline-flex h-4 w-20 animate-pulse rounded bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-white/55">
          هنوز دیدگاهی ثبت نکرده‌اید.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((review) => {
            const status: ReviewStatus =
              review.status ?? (review.is_pending ? "pending" : "approved");
            const href = resolveReviewHref(review);
            return (
              <article
                key={review.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[#f5c518]/20 px-2 py-1 text-xs font-bold text-[#f8d977]">
                      امتیاز {review.rating}/10
                    </span>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs ${statusBadgeClass[status]}`}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>
                  <span className="text-xs text-white/45">
                    {formatRelativeTimeFa(review.created_at)}
                  </span>
                </div>

                <p className="mb-3 text-sm leading-7 text-white/85">{review.body ?? "-"}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/55">
                    {review.reviewable_title ?? "عنوان نامشخص"}
                  </span>
                  <div className="flex items-center gap-2">
                    {href ? (
                      <Link
                        href={href}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
                      >
                        مشاهده عنوان
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-400/35 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}
