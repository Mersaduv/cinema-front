"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  defaultReviewPaginator,
  defaultReviewSummary,
  deleteReview,
  fetchReviews,
  type Review,
  type ReviewSort,
  type ReviewSummary,
} from "../../lib/reviews";
import RatingSummaryBar from "./RatingSummaryBar";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";

export default function ReviewsSection({
  contentType,
  slug,
  initialReviews,
  initialSummary,
  initialPaginator,
  userReview: initialUserReview,
  cachedAvgRating,
}: {
  contentType: "movie" | "series";
  slug: string;
  initialReviews: Review[];
  initialSummary: ReviewSummary;
  initialPaginator: { currentPage: number; lastPage: number; total: number };
  userReview: Review | null;
  cachedAvgRating: number | null;
}) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [userReview, setUserReview] = useState<Review | null>(initialUserReview);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Review | null>(null);
  const [actionError, setActionError] = useState("");
  const [accumulatedReviews, setAccumulatedReviews] = useState(initialReviews);

  const swrKey = `reviews:${contentType}:${slug}:${page}:${sort}`;

  const { data, mutate, isValidating } = useSWR(
    swrKey,
    () => fetchReviews(contentType, slug, { page, sort }),
    {
      fallbackData:
        page === 1 && sort === "newest"
          ? {
              reviews: initialReviews,
              summary: initialSummary,
              user_review: initialUserReview,
              paginatorInfo: initialPaginator,
            }
          : undefined,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    if (!data?.reviews) {
      return;
    }

    if (page === 1) {
      setAccumulatedReviews(data.reviews);
      return;
    }

    setAccumulatedReviews((current) => {
      const seen = new Set(current.map((review) => review.id));
      const appended = data.reviews.filter((review) => !seen.has(review.id));
      return [...current, ...appended];
    });
  }, [data?.reviews, page]);

  useEffect(() => {
    setPage(1);
    setAccumulatedReviews([]);
  }, [sort, contentType, slug]);

  const reviews = accumulatedReviews;
  const summary = data?.summary ?? initialSummary;
  const paginator = data?.paginatorInfo ?? initialPaginator;

  const mergedReviews = useMemo(() => {
    if (!userReview) {
      return reviews;
    }

    const withoutOwn = reviews.filter((review) => review.id !== userReview.id);
    return [userReview, ...withoutOwn];
  }, [reviews, userReview]);

  const handleReviewSuccess = async (review: Review) => {
    setUserReview(review);
    setShowForm(false);
    setPage(1);
    await mutate();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    setActionError("");
    const response = await deleteReview(deleteConfirm.id);

    if (!response.success) {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      setActionError(response.message ?? "حذف نظر انجام نشد.");
      return;
    }

    setUserReview(null);
    setDeleteConfirm(null);
    setPage(1);
    await mutate();
  };

  return (
    <section
      dir="rtl"
      aria-labelledby="reviews-heading"
      className="mx-auto max-w-3xl space-y-6"
    >
      <div className="space-y-2">
        <h2 id="reviews-heading" className="text-2xl font-black text-white">
          دیدگاه کاربران
        </h2>
        <p className="text-sm text-white/45">
          امتیاز و نظرات تاییدشده کاربران درباره این اثر
        </p>
      </div>

      <RatingSummaryBar cachedAvgRating={cachedAvgRating} summary={summary} />

      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
        {showForm || !userReview ? (
          <ReviewForm
            contentType={contentType}
            slug={slug}
            userReview={userReview}
            onSuccess={handleReviewSuccess}
            onCancel={userReview ? () => setShowForm(false) : undefined}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-3">
              <p className="text-sm text-white/70">شما قبلاً برای این عنوان نظر ثبت کرده‌اید.</p>
              {userReview.is_pending || userReview.status === "pending" ? (
                <p className="mt-1 text-xs text-white/50">
                  نظر شما در صف بررسی است و پس از تایید برای همه نمایش داده می‌شود.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/[0.04]"
            >
              ویرایش نظر
            </button>
          </div>
        )}
      </div>

      <ReviewList
        reviews={mergedReviews}
        sort={sort}
        loading={isValidating}
        onSortChange={(nextSort) => {
          setSort(nextSort);
          setPage(1);
        }}
        hasMore={page < paginator.lastPage}
        onLoadMore={() => setPage((current) => current + 1)}
        onEditOwn={() => setShowForm(true)}
        onDeleteOwn={(review) => setDeleteConfirm(review)}
      />

      {actionError ? (
        <p className="text-sm text-[#f87171]" role="alert" aria-live="polite">
          {actionError}
        </p>
      ) : null}

      {deleteConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="تأیید حذف نظر"
        >
          <div
            dir="rtl"
            className="w-full max-w-md rounded-[28px] border border-[#f5c518]/20 bg-[#111] p-6"
          >
            <p className="text-white">آیا از حذف نظر خود مطمئن هستید؟</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-2xl bg-[#c99212] px-5 py-3 text-sm font-bold text-[#12100a] transition hover:bg-[#f5c518]"
              >
                حذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/70"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { defaultReviewPaginator, defaultReviewSummary };
