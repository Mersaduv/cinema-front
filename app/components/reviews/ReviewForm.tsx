"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { Review } from "../../lib/reviews";
import { submitReview, updateReview } from "../../lib/reviews";

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

  if (loading) {
    return (
      <div dir="rtl" className="text-sm text-white/50" aria-busy="true">
        در حال بررسی وضعیت ورود...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
        <p className="text-sm text-white/60">برای نوشتن نظر وارد حساب کاربری شوید.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-2xl bg-[#ef4444] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#dc2626]"
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

    try {
      const response = userReview
        ? await updateReview(userReview.id, {
            rating,
            body: body.trim() ? body.trim() : null,
          })
        : await submitReview({
            reviewable_type: contentType,
            slug,
            rating,
            body: body.trim() || undefined,
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
        setError(response.message ?? "ثبت نظر انجام نشد.");
        return;
      }

      onSuccess(response.data.review);
    } catch {
      setError("خطای شبکه. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold text-white">
        {userReview ? "ویرایش نظر شما" : "ثبت نظر"}
      </h3>

      <div>
        <label className="mb-2 block text-sm text-white/70">امتیاز (۱ تا ۱۰)</label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="انتخاب امتیاز">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`امتیاز ${value}`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className={`h-9 w-9 rounded-full border text-sm font-bold transition ${
                rating === value
                  ? "border-[#ef4444] bg-[#ef4444] text-white"
                  : "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/30"
              }`}
            >
              {value.toLocaleString("fa-IR")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-body" className="mb-2 block text-sm text-white/70">
          متن نظر (اختیاری)
        </label>
        <textarea
          id="review-body"
          value={body}
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          placeholder="«نظر خود را بنویسید...»"
          className="min-h-36 w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/90 outline-none transition focus:border-[#ef4444]"
        />
        <div className="mt-1 text-left text-xs text-white/45">
          {body.length.toLocaleString("fa-IR")} / ۲۰۰۰
        </div>
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
          className="rounded-2xl bg-[#ef4444] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#dc2626] disabled:opacity-60"
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
