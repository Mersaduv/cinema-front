"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineExternalLink,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import {
  adminMoviesService,
  type AdminMovie,
  type ProcessingStatus,
  type PublishStatus,
} from "../../../../lib/admin-movies";

function formatPersianDate(value: string | null) {
  if (!value) {
    return "ثبت نشده";
  }

  return new Intl.DateTimeFormat("fa-AF-u-ca-persian", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPublishPresentation(status: PublishStatus) {
  switch (status) {
    case "published":
      return {
        label: "منتشر شده",
        className: "border-[#34d399]/25 bg-[#34d399]/10 text-[#86efac]",
      };
    case "scheduled":
      return {
        label: "زمان بندی شده",
        className: "border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#7dd3fc]",
      };
    default:
      return {
        label: "پیش نویس",
        className: "border-[#f5c518]/25 bg-[#f5c518]/10 text-[#f8d977]",
      };
  }
}

function getProcessingPresentation(status: ProcessingStatus) {
  switch (status) {
    case "ready":
      return {
        label: "آماده پخش",
        className: "border-[#34d399]/25 bg-[#34d399]/10 text-[#86efac]",
      };
    case "processing":
      return {
        label: "در حال پردازش",
        className: "border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#7dd3fc]",
      };
    case "queued":
      return {
        label: "در صف",
        className: "border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[#c4b5fd]",
      };
    case "failed":
      return {
        label: "خطا",
        className: "border-[#fb7185]/25 bg-[#fb7185]/10 text-[#fecdd3]",
      };
    default:
      return {
        label: "در انتظار",
        className: "border-white/10 bg-white/[0.05] text-[#d7e4eb]",
      };
  }
}

export default function AdminMovieDetailPage() {
  const params = useParams<{ movieId: string }>();
  const movieId = params.movieId;
  const [movie, setMovie] = useState<AdminMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMovie = async () => {
      setLoading(true);
      setError("");

      const response = await adminMoviesService.show(movieId);

      if (response.success && response.data) {
        setMovie(response.data.movie);
      } else {
        setError(response.message || "دریافت اطلاعات فیلم با خطا روبه‌رو شد.");
      }

      setLoading(false);
    };

    if (movieId) {
      void loadMovie();
    }
  }, [movieId]);

  const handleQueueProcessing = async () => {
    setQueueing(true);
    setError("");

    const response = await adminMoviesService.queueProcessing(movieId);

    if (response.success && response.data) {
      setMovie(response.data.movie);
    } else {
      setError(response.message || "ارسال پردازش به صف انجام نشد.");
    }

    setQueueing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-[34px] border border-white/10 bg-white/[0.03]" />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-80 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />
          <div className="h-80 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="rounded-[32px] border border-[#fb7185]/25 bg-[#fb7185]/10 px-6 py-8 text-[#fecdd3]">
        {error || "فیلم پیدا نشد."}
      </div>
    );
  }

  const publish = getPublishPresentation(movie.publish_status);
  const processing = getProcessingPresentation(movie.processing_status);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_42%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs ${publish.className}`}
              >
                {publish.label}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs ${processing.className}`}
              >
                {processing.label}
              </span>
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
              {movie.title}
            </h2>
            <p className="mt-3 text-sm text-[#8ea4b3]">/{movie.slug}</p>
            <p className="mt-5 text-base leading-8 text-[#dde7ed] md:text-lg">
              {movie.synopsis || "برای این فیلم هنوز خلاصه‌ای ثبت نشده است."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleQueueProcessing()}
              disabled={
                queueing ||
                movie.processing_status === "queued" ||
                movie.processing_status === "processing"
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HiOutlineLightningBolt className="h-4 w-4" />
              {queueing ? "در حال ارسال..." : "شروع پردازش HLS"}
            </button>
            <Link
              href={`/movies/${movie.slug}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              صفحه عمومی فیلم
              <HiOutlineExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/content-management/movies"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              بازگشت
              <HiOutlineArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">مشخصات فیلم</h3>
            <div className="mt-5 grid gap-3 text-sm text-[#dbe6ed] md:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">عنوان اصلی</p>
                <p className="mt-2 font-semibold text-white">
                  {movie.original_title || "ثبت نشده"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">سال انتشار</p>
                <p className="mt-2 font-semibold text-white">
                  {movie.release_year || "ثبت نشده"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">مدت زمان</p>
                <p className="mt-2 font-semibold text-white">
                  {movie.duration_seconds || "ثبت نشده"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">تامین‌کننده</p>
                <p className="mt-2 font-semibold text-white">
                  {movie.provider_name || "ثبت نشده"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">مسیرهای مدیا</h3>
            <div className="mt-5 space-y-3 text-sm text-[#d7e4eb]">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">پوشه مدیریت‌شده</p>
                <p className="mt-2 break-all text-white">
                  {movie.media_folder_absolute}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">منبع فایل</p>
                <p className="mt-2 break-all text-white">
                  {movie.media_asset?.source_path || "ثبت نشده"}
                </p>
                <p className="mt-2 text-xs text-[#8ea4b3]">
                  {movie.media_asset?.source_is_external
                    ? "منبع بیرون از پوشه مدیریت‌شده است و بدون کپی دوباره استفاده می‌شود."
                    : "فایل منبع داخل پوشه مدیریت‌شده همین فیلم قرار دارد."}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">خروجی HLS</p>
                <p className="mt-2 break-all text-white">
                  {movie.media_asset?.hls_output_absolute_directory || "ثبت نشده"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">master.m3u8</p>
                <p className="mt-2 break-all text-white">
                  {movie.media_asset?.master_playlist_url || "هنوز ساخته نشده"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">وضعیت پردازش</h3>
            <div className="mt-5 space-y-3 text-sm text-[#dbe6ed]">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">آخرین وضعیت</p>
                <p className="mt-2 font-semibold text-white">{processing.label}</p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">آخرین پردازش</p>
                <p className="mt-2 font-semibold text-white">
                  {formatPersianDate(movie.media_asset?.last_processed_at || null)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[#8ea4b3]">variantها</p>
                <p className="mt-2 font-semibold text-white">
                  {movie.media_asset?.variants.length || 0} کیفیت
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">خروجی‌های HLS</h3>
            <div className="mt-5 space-y-3">
              {movie.media_asset?.variants.length ? (
                movie.media_asset.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">
                        {variant.profile_key}
                      </span>
                      <span className="text-[#8ea4b3]">{variant.resolution}</span>
                    </div>
                    <p className="mt-2 break-all text-xs text-[#8ea4b3]">
                      {variant.playlist_url || variant.playlist_relative_path}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-5 text-sm text-[#8ea4b3]">
                  هنوز variantی ساخته نشده است.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <h3 className="text-xl font-bold text-white">سوابق پردازش</h3>
        <div className="mt-5 space-y-4">
          {movie.media_asset?.processing_runs?.length ? (
            movie.media_asset.processing_runs.map((run) => (
              <article
                key={run.id}
                className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">
                    اجرای #{run.id}
                  </p>
                  <p className="text-xs text-[#8ea4b3]">
                    {formatPersianDate(run.started_at)}
                  </p>
                </div>
                {run.error_message && (
                  <p className="mt-4 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
                    {run.error_message}
                  </p>
                )}
                {run.ffmpeg_command && (
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/8 bg-[#061018] p-4 text-xs leading-6 text-[#d7e4eb]">
                    {run.ffmpeg_command}
                  </pre>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-8 text-sm text-[#8ea4b3]">
              هنوز سابقه‌ای برای پردازش این فیلم ثبت نشده است.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
