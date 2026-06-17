"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { Review } from "../../lib/reviews";
import {
  REVIEW_BODY_MAX,
  REVIEW_BODY_MIN,
  submitReview,
  upsertCachedMyReview,
  updateReview,
  validateReviewForm,
} from "../../lib/reviews";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${filled ? "text-[#f5c518]" : "text-white/20"}`}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 2.5l2.63 5.33 5.88.86-4.25 4.14 1 5.86L12 16.9l-5.26 2.79 1-5.86-4.25-4.14 5.88-.86L12 2.5z"
      />
    </svg>
  );
}

export default function ReviewForm({
  contentType,
  slug,
  userReview,
  onSuccess,
  onCancel,
}: {
  contentType: "movie" | "series";
  slug: string;
  userReview: Review | null;
  onSuccess: (review: Review) => void;
  onCancel?: () => void;
}) {
  const { isAuthenticated, loading } = useAuth();
  const [rating, setRating] = useState(userReview?.rating ?? 8);
  const [body, setBody] = useState(userReview?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div dir="rtl" className="text-sm text-white/50" aria-busy="true">
        در حال بررسی وضعیت ورود...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        dir="rtl"
        className="rounded-[24px] border border-dashed border-[#f5c518]/25 bg-[#f5c518]/5 px-6 py-10 text-center"
      >
        <p className="text-sm text-white/65">برای نوشتن نظر وارد حساب کاربری شوید.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-bold text-[#12100a] transition hover:bg-[#e8bb0d]"
        >
          ورود
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const validationErrors = validateReviewForm({ rating, body });
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSubmitting(false);
      return;
    }

    const trimmedBody = body.trim();

    try {
      const response = userReview
        ? await updateReview(userReview.id, { rating, body: trimmedBody })
        : await submitReview({
            reviewable_type: contentType,
            slug,
            rating,
            body: trimmedBody,
          });

      if (!response.success || !response.data?.review) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (response.status === 429) {
          setError("درخواست‌های زیاد. لطفاً کمی بعد دوباره تلاش کنید.");
          return;
        }
        if (response.errors) {
          const nextErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(response.errors)) {
            if (messages[0]) nextErrors[key] = messages[0];
          }
          setFieldErrors(nextErrors);
        }
        setError(response.message ?? "ثبت نظر انجام نشد.");
        return;
      }

      upsertCachedMyReview({
        review: response.data.review,
        reviewableType: contentType,
        reviewableSlug: slug,
        reviewableTitle: slug,
      });
      onSuccess(response.data.review);
    } catch {
      setError("خطای شبکه. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <h3 className="text-lg font-bold text-white">
          {userReview ? "ویرایش نظر شما" : "ثبت نظر"}
        </h3>
        <p className="mt-1 text-xs leading-6 text-white/45">
          نظر شما پس از بررسی تیم، در این صفحه نمایش داده می‌شود.
        </p>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-white/75">
          امتیاز شما <span className="text-white/45">*</span>
        </label>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="انتخاب امتیاز"
        >
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`امتیاز ${value}`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className={`flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border px-2 text-sm font-bold transition ${
                rating === value
                  ? "border-[#f5c518] bg-[#f5c518] text-[#12100a] shadow-[0_0_0_3px_rgba(245,197,24,0.25)]"
                  : value <= rating
                    ? "border-[#f5c518]/35 bg-[#f5c518]/10 text-[#f8d977] hover:border-[#f5c518]/55"
                    : "border-white/12 bg-white/[0.03] text-white/55 hover:border-[#f5c518]/25"
              }`}
            >
              {/* <StarIcon filled={value <= rating} /> */}
              <span>{value.toLocaleString("fa-IR")}</span>
            </button>
          ))}
        </div>
        {fieldErrors.rating ? (
          <p className="mt-2 text-xs text-[#f87171]">{fieldErrors.rating}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="review-body" className="mb-2 block text-sm font-medium text-white/75">
          متن نظر <span className="text-white/45">*</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          required
          minLength={REVIEW_BODY_MIN}
          maxLength={REVIEW_BODY_MAX}
          onChange={(event) => setBody(event.target.value)}
          placeholder="نظر خود را درباره این اثر بنویسید..."
          aria-invalid={Boolean(fieldErrors.body)}
          aria-describedby="review-body-hint"
          className={`min-h-36 w-full rounded-[20px] border bg-white/[0.04] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-white/25 focus:ring-1 focus:ring-white/10 ${
            fieldErrors.body ? "border-[#f87171]/60" : "border-white/10"
          }`}
        />
        <div id="review-body-hint" className="mt-1 flex items-center justify-between text-xs">
          <span className="text-white/40">
            حداقل {REVIEW_BODY_MIN.toLocaleString("fa-IR")} کاراکتر
          </span>
          <span className="text-white/40">
            {body.length.toLocaleString("fa-IR")} / {REVIEW_BODY_MAX.toLocaleString("fa-IR")}
          </span>
        </div>
        {fieldErrors.body ? (
          <p className="mt-1 text-xs text-[#f87171]" role="alert">
            {fieldErrors.body}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-[#f87171]" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-bold text-[#12100a] transition hover:bg-[#e8bb0d] disabled:opacity-60"
        >
          {submitting ? "در حال ارسال..." : userReview ? "ذخیره تغییرات" : "ارسال نظر"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/30"
          >
            انصراف
          </button>
        ) : null}
      </div>
    </form>
  );
}
