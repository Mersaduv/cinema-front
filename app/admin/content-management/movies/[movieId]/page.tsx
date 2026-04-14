"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineExternalLink,
  HiOutlineLightningBolt,
  HiOutlinePencilAlt,
  HiOutlinePlay,
  HiOutlineRefresh,
  HiOutlineTrash,
} from "react-icons/hi";
import {
  adminMoviesService,
  type AdminMovie,
  type AdminMovieOptionsResponse,
  type ProcessingStatus,
  type PublishStatus,
} from "../../../../lib/admin-movies";

const emptyOptions: AdminMovieOptionsResponse = {
  publish_statuses: [],
  processing_statuses: [],
  hls_profiles: [],
  taxonomies: {
    genres: [],
    countries: [],
    languages: [],
    tags: [],
    actors: [],
  },
  media_root: "D:\\media",
};

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

function formatElapsed(from: string | null, to?: string | null) {
  if (!from) {
    return "ثبت نشده";
  }

  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} ساعت و ${minutes % 60} دقیقه`;
  }

  if (minutes > 0) {
    return `${minutes} دقیقه`;
  }

  return "کمتر از یک دقیقه";
}

function formatRemainingTime(seconds: number | null, isReady: boolean) {
  if (isReady) {
    return "پردازش کامل شده است.";
  }

  if (seconds === null || seconds <= 0) {
    return "زمان باقی مانده در حال محاسبه است.";
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `حدود ${hours} ساعت و ${minutes % 60} دقیقه باقی مانده`;
  }

  if (minutes > 0) {
    return `حدود ${minutes} دقیقه باقی مانده`;
  }

  return `حدود ${seconds} ثانیه باقی مانده`;
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

function DetailPosterPreview({ movie }: { movie: AdminMovie }) {
  if (movie.poster_url) {
    return (
      <div className="relative h-64 w-44 overflow-hidden rounded-[28px] border border-white/10 bg-[#071019] shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.78))]" />
      </div>
    );
  }

  return (
    <div className="flex h-64 w-44 items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-[radial-gradient(circle_at_top,rgba(245,197,24,0.12),rgba(255,255,255,0.02)_60%)] px-6 text-center text-sm leading-7 text-[#8ea4b3]">
      پوستری برای این فیلم ثبت نشده است
    </div>
  );
}

export default function AdminMovieDetailPage() {
  const params = useParams<{ movieId: string }>();
  const router = useRouter();
  const movieId = params.movieId;
  const [movie, setMovie] = useState<AdminMovie | null>(null);
  const [options, setOptions] = useState<AdminMovieOptionsResponse>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [queueing, setQueueing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [error, setError] = useState("");

  const loadMovie = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [movieResponse, optionsResponse] = await Promise.all([
        adminMoviesService.show(movieId),
        adminMoviesService.options(),
      ]);

      if (movieResponse.success && movieResponse.data) {
        setMovie(movieResponse.data.movie);

      } else {
        setError(movieResponse.message || "دریافت اطلاعات فیلم با خطا روبه‌رو شد.");
      }

      if (optionsResponse.success && optionsResponse.data) {
        setOptions(optionsResponse.data);

        if (movieResponse.success && movieResponse.data) {
          const profileSelection =
            movieResponse.data.movie.media_asset?.selected_hls_profiles?.length
              ? movieResponse.data.movie.media_asset.selected_hls_profiles
              : optionsResponse.data.hls_profiles.map((profile) => profile.key);

          setSelectedProfiles(profileSelection);
        }
      }

      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    },
    [movieId]
  );

  useEffect(() => {
    if (!movieId) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const timeoutId = window.setTimeout(() => {
      void loadMovie();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMovie, movieId]);

  useEffect(() => {
    if (!movie || !["queued", "processing"].includes(movie.processing_status)) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadMovie("refresh");
    }, 1500);

    return () => window.clearInterval(interval);
  }, [loadMovie, movie]);

  const toggleProfile = (profileKey: string) => {
    setSelectedProfiles((current) =>
      current.includes(profileKey)
        ? current.filter((item) => item !== profileKey)
        : [...current, profileKey]
    );
  };

  const handleQueueProcessing = async () => {
    setQueueing(true);
    setError("");

    const response = await adminMoviesService.queueProcessingWithProfiles(
      movieId,
      selectedProfiles
    );

    if (response.success && response.data) {
      setMovie(response.data.movie);
      setProcessModalOpen(false);
    } else {
      setError(response.message || "ارسال پردازش به صف انجام نشد.");
    }

    setQueueing(false);
  };

  const handleMoveToDraft = async () => {
    if (!movie) {
      return;
    }

    setError("");

    const response = await adminMoviesService.updatePublishStatus(movie.id, "draft");

    if (response.success && response.data) {
      setMovie(response.data.movie);
    } else {
      setError(response.message || "بازگرداندن فیلم به پیش نویس انجام نشد.");
    }
  };

  const handleDeleteMovie = async () => {
    if (!movie) {
      return;
    }

    const confirmed = window.confirm(
      `همه اطلاعات و خروجی‌های مدیریت‌شده فیلم «${movie.title}» حذف شود؟ این عمل قابل بازگشت نیست.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    const response = await adminMoviesService.remove(movie.id);

    if (response.success) {
      router.push("/admin/content-management/movies");
      router.refresh();
      return;
    }

    setError(response.message || "حذف کامل فیلم انجام نشد.");
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-[34px] border border-white/10 bg-white/[0.03]" />
        <div className="h-80 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />
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
  const latestRun = movie.media_asset?.processing_runs?.[0] || null;
  const progressPercent = movie.media_asset?.processing_progress_percent ?? 0;
  const etaSeconds = movie.media_asset?.processing_eta_seconds ?? null;
  const isReady = movie.processing_status === "ready";
  const isPublished = movie.publish_status === "published";
  const isBusy = ["queued", "processing"].includes(movie.processing_status);
  const canWatch =
    isReady && isPublished && Boolean(movie.media_asset?.master_playlist_url);

  const statusSummary = isReady
    ? "پردازش کامل شده و خروجی‌های HLS آماده هستند."
    : movie.processing_status === "failed"
      ? "پردازش با خطا متوقف شده است."
      : movie.processing_status === "processing"
        ? "فیلم در حال تبدیل به HLS است."
        : movie.processing_status === "queued"
          ? "فیلم در صف پردازش قرار دارد."
          : "این فیلم هنوز وارد مرحله پردازش نشده است.";

  return (
    <div className="space-y-6">
      <div className="sticky top-4 z-20 flex justify-start">
        <Link
          href="/admin/content-management/movies"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#081018]/85 px-4 py-3 text-sm text-white shadow-[0_12px_26px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:border-white/20 hover:bg-[#0d1822]"
        >
          بازگشت
          <HiOutlineArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_42%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <DetailPosterPreview movie={movie} />

            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs ${publish.className}`}>
                  {publish.label}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs ${processing.className}`}>
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
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadMovie("refresh")}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HiOutlineRefresh className="h-4 w-4" />
              {refreshing ? "در حال به روزرسانی..." : "به روزرسانی وضعیت"}
            </button>

            {!isReady && !isBusy ? (
              <button
                type="button"
                onClick={() => setProcessModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
              >
                <HiOutlineLightningBolt className="h-4 w-4" />
                شروع پردازش HLS
              </button>
            ) : null}

            <Link
              href={`/admin/content-management/movies/${movie.id}/draft`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <HiOutlinePencilAlt className="h-4 w-4" />
              ویرایش پیش نویس
            </Link>

            {isPublished ? (
              <button
                type="button"
                onClick={() => void handleMoveToDraft()}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#34d399]/20 bg-[#34d399]/10 px-5 py-3 text-sm text-[#bbf7d0] transition hover:border-[#34d399]/35 hover:bg-[#34d399]/16"
              >
                <HiOutlineExternalLink className="h-4 w-4" />
                بازگرداندن به پیش نویس
              </button>
            ) : (
              <Link
                href={`/admin/content-management/movies/${movie.id}/publication`}
                className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm transition ${
                  isReady
                    ? "border-[#34d399]/20 bg-[#34d399]/10 text-[#bbf7d0] hover:border-[#34d399]/35 hover:bg-[#34d399]/16"
                    : "border-white/10 bg-white/[0.05] text-white hover:border-white/20 hover:bg-white/[0.08]"
                }`}
              >
                <HiOutlineExternalLink className="h-4 w-4" />
                انتشار فیلم
              </Link>
            )}

            {canWatch ? (
              <Link
                href={`/watch/${movie.slug}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#38bdf8]/20 bg-[#38bdf8]/10 px-5 py-3 text-sm text-[#c9f0ff] transition hover:border-[#38bdf8]/35 hover:bg-[#38bdf8]/16"
              >
                <HiOutlinePlay className="h-4 w-4" />
                مشاهده پخش
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => void handleDeleteMovie()}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 px-5 py-3 text-sm text-[#fecdd3] transition hover:border-[#fb7185]/35 hover:bg-[#fb7185]/16 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HiOutlineTrash className="h-4 w-4" />
              {deleting ? "در حال حذف..." : "حذف کامل"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">وضعیت فعلی</h3>
                <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
                  {statusSummary}
                </p>
              </div>
              <p className="text-2xl font-black text-[#7dd3fc]">
                {progressPercent.toFixed(1)}%
              </p>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#071019]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#f5c518)] transition-all duration-700"
                style={{ width: `${progressPercent <= 0 ? 0 : Math.min(progressPercent, 100)}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-[#8ea4b3]">
              {formatRemainingTime(etaSeconds, isReady)}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-[#8ea4b3]">آخرین وضعیت</p>
                <p className="mt-2 text-lg font-semibold text-white">{processing.label}</p>
              </div>
              {isReady ? (
                <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                  <p className="text-sm text-[#8ea4b3]">مدت پردازش</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatElapsed(latestRun?.started_at || null, latestRun?.finished_at || null)}
                  </p>
                </div>
              ) : null}
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-[#8ea4b3]">آخرین به روزرسانی</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatPersianDate(movie.updated_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">انتشار و پخش</h3>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-[#8ea4b3]">نمایش در سایت</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {isPublished ? "فعال" : "غیرفعال"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-[#8ea4b3]">وضعیت پلیر</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {canWatch ? "قابل پخش" : isReady ? "آماده انتشار" : "در انتظار پردازش"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-[#8ea4b3]">صفحه عمومی</p>
                <p className="mt-2 break-all text-base font-semibold text-white">
                  /movies/{movie.slug}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-sm text-[#8ea4b3]">صفحه پخش</p>
                <p className="mt-2 break-all text-base font-semibold text-white">
                  /watch/{movie.slug}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">طبقه‌بندی فیلم</h3>
            <div className="mt-5 space-y-4">
              {[
                { label: "ژانرها", items: movie.taxonomies.genres },
                { label: "کشورها", items: movie.taxonomies.countries },
                { label: "زبان‌ها", items: movie.taxonomies.languages },
                { label: "تگ‌ها", items: movie.taxonomies.tags },
                { label: "بازیگران", items: movie.taxonomies.actors },
              ].map((group) => (
                <div
                  key={group.label}
                  className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <p className="text-sm text-[#8ea4b3]">{group.label}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.length ? (
                      group.items.map((item) => (
                        <span
                          key={`${group.label}-${item.id}`}
                          className="rounded-full border border-[#38bdf8]/20 bg-[#38bdf8]/10 px-3 py-1.5 text-xs text-[#d4f3ff]"
                        >
                          {item.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[#7f94a1]">موردی انتخاب نشده است.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">خروجی‌های HLS</h3>
            <div className="mt-5 space-y-3">
              {movie.media_asset?.variants.length ? (
                movie.media_asset.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-[#d3dee5]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{variant.profile_key}</span>
                      <span className="text-[#8ea4b3]">{variant.resolution}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-5 text-sm text-[#8ea4b3]">
                  هنوز کیفیتی ساخته نشده است.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">پروفایل‌های انتخاب‌شده</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {(movie.media_asset?.selected_hls_profiles || []).map((profile) => (
                <span
                  key={profile}
                  className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1.5 text-xs text-[#f8d977]"
                >
                  {profile}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">مسیرهای مدیا</h3>
            <div className="mt-5 space-y-3 text-sm text-[#d7e4eb]">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[#8ea4b3]">پوشه مدیریت‌شده</p>
                <p className="mt-2 break-all text-white">{movie.media_folder_absolute}</p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[#8ea4b3]">master.m3u8</p>
                <p className="mt-2 break-all text-white">
                  {movie.media_asset?.master_playlist_url || "هنوز ساخته نشده"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {processModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#02070c]/78 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#081018] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-white">انتخاب کیفیت‌های پردازش</h3>
                <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
                  مشخص کن برای این فیلم کدام کیفیت‌ها ساخته شوند. پیش‌فرض روی همه کیفیت‌ها است.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProcessModalOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                بستن
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {options.hls_profiles.map((profile) => {
                const checked = selectedProfiles.includes(profile.key);

                return (
                  <label
                    key={profile.key}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                      checked
                        ? "border-[#f5c518]/35 bg-[#f5c518]/10 text-white"
                        : "border-white/10 bg-[#0b1720] text-[#c5d4de]"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{profile.label}</p>
                      <p className="mt-1 text-xs text-[#8ea4b3]">
                        {profile.resolution}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProfile(profile.key)}
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-[#f5c518]"
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleQueueProcessing()}
                disabled={queueing || selectedProfiles.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HiOutlineCheckCircle className="h-4 w-4" />
                {queueing ? "در حال ارسال..." : "شروع پردازش"}
              </button>

              <button
                type="button"
                onClick={() => setProcessModalOpen(false)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
