"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HiOutlineArrowRight } from "react-icons/hi";
import ProtectedRoute from "../../components/ProtectedRoute";
import ProfileShell from "../../components/profile/ProfileShell";
import RequestsShellSkeleton from "../../components/skeletons/RequestsShellSkeleton";
import {
  submitContentRequest,
  validateContentRequestForm,
} from "../../lib/content-requests";
import { fetchFilterOptions, type FilterGenreOption } from "../../lib/filter-options";

function NewRequestPageContent() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genreSlug, setGenreSlug] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState<FilterGenreOption[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const options = await fetchFilterOptions({ cache: "no-store" });
        if (cancelled) {
          return;
        }

        const merged = new Map<string, FilterGenreOption>();
        for (const genre of options.catalog_genres ?? options.movie_genres ?? []) {
          merged.set(genre.slug, genre);
        }
        for (const genre of options.tv_genres ?? []) {
          if (!merged.has(genre.slug)) {
            merged.set(genre.slug, genre);
          }
        }

        setGenres(Array.from(merged.values()));
      } catch {
        if (!cancelled) {
          setError("دریافت لیست ژانرها انجام نشد.");
        }
      } finally {
        if (!cancelled) {
          setGenresLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(
    () => !submitting && !genresLoading && genres.length > 0,
    [genres.length, genresLoading, submitting],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateContentRequestForm({
      title,
      genreSlug,
      description,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    const response = await submitContentRequest({
      title,
      genreSlug,
      description,
    });

    setSubmitting(false);

    if (!response.success) {
      setError(response.message || "ثبت درخواست انجام نشد.");
      return;
    }

    setSuccess(response.message || "درخواست شما با موفقیت ثبت شد.");
    window.setTimeout(() => {
      router.push("/requests");
    }, 900);
  };

  return (
    <ProfileShell active="requests">
      <div className="mx-auto max-w-2xl px-4 text-white md:px-6">
        <button
          type="button"
          onClick={() => router.push("/requests")}
          className="mb-3 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
        >
          <HiOutlineArrowRight className="h-4 w-4" />
          بازگشت به لیست درخواست‌ها
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-black">درخواست جدید</h1>
          <p className="mt-2 text-sm text-white/60">
            نام فیلم یا سریال، ژانر و توضیحات را وارد کنید تا درخواست شما ثبت شود.
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-5 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8"
        >
          <div>
            <label htmlFor="request-title" className="mb-2 block text-sm font-semibold text-white/85">
              نام فیلم یا سریال
            </label>
            <input
              id="request-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: Breaking Bad"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#f5c518]/50 focus:ring-2 focus:ring-[#f5c518]/20"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="request-genre" className="mb-2 block text-sm font-semibold text-white/85">
              ژانر
            </label>
            <select
              id="request-genre"
              value={genreSlug}
              onChange={(event) => setGenreSlug(event.target.value)}
              disabled={genresLoading || genres.length === 0}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#f5c518]/50 focus:ring-2 focus:ring-[#f5c518]/20 disabled:opacity-60"
              required
            >
              <option value="" className="bg-[#121212]">
                {genresLoading ? "در حال بارگذاری ژانرها..." : "انتخاب ژانر"}
              </option>
              {genres.map((genre) => (
                <option key={genre.slug} value={genre.slug} className="bg-[#121212]">
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="request-description"
              className="mb-2 block text-sm font-semibold text-white/85"
            >
              توضیحات
            </label>
            <textarea
              id="request-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="لطفاً دلیل درخواست، نسخه دوبله/زیرنویس مورد نظر یا هر نکته دیگری را بنویسید."
              rows={6}
              maxLength={2000}
              className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#f5c518]/50 focus:ring-2 focus:ring-[#f5c518]/20"
              required
            />
            <p className="mt-2 text-xs text-white/40">{description.trim().length} / 2000</p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {success}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex rounded-2xl bg-[#f5c518] px-6 py-3 text-sm font-bold text-[#12100a] transition hover:bg-[#e8bb0d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "در حال ثبت..." : "ثبت درخواست"}
            </button>
            <Link
              href="/requests"
              className="inline-flex rounded-2xl border border-white/10 px-6 py-3 text-sm text-white/75 transition hover:bg-white/[0.05]"
            >
              انصراف
            </Link>
          </div>
        </form>
      </div>
    </ProfileShell>
  );
}

export default function NewRequestPage() {
  return (
    <ProtectedRoute fallback={<RequestsShellSkeleton variant="form" />}>
      <NewRequestPageContent />
    </ProtectedRoute>
  );
}
