"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineLightningBolt,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
} from "react-icons/hi";
import {
  MdOutlineLocalMovies,
  MdOutlineMovieFilter,
  MdOutlineOndemandVideo,
} from "react-icons/md";
import AdminPagination from "../../../components/admin/AdminPagination";
import AdminSelect from "../../../components/admin/AdminSelect";
import AdminStatCard from "../../../components/admin/AdminStatCard";
import {
  adminMoviesService,
  type AdminMovie,
  type AdminMovieOptionsResponse,
  type AdminMoviesPagination,
  type AdminMoviesSummary,
  type ProcessingStatus,
  type PublishStatus,
} from "../../../lib/admin-movies";

const emptySummary: AdminMoviesSummary = {
  total: 0,
  drafts: 0,
  published: 0,
  processing: 0,
  ready: 0,
};

const emptyPagination: AdminMoviesPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 12,
  total: 0,
};

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

function PosterPreview({ movie }: { movie: AdminMovie }) {
  if (movie.poster_url) {
    return (
      <div className="relative h-48 w-32 overflow-hidden rounded-[24px] border border-white/10 bg-[#071019] shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.78))]" />
      </div>
    );
  }

  return (
    <div className="flex h-48 w-32 items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-[radial-gradient(circle_at_top,rgba(245,197,24,0.12),rgba(255,255,255,0.02)_60%)] text-center text-xs leading-6 text-[#8ea4b3]">
      بدون
      <br />
      پوستر
    </div>
  );
}

export default function AllMoviesPage() {
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [summary, setSummary] = useState<AdminMoviesSummary>(emptySummary);
  const [pagination, setPagination] =
    useState<AdminMoviesPagination>(emptyPagination);
  const [options, setOptions] = useState<AdminMovieOptionsResponse>(emptyOptions);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [publishStatus, setPublishStatus] = useState("");
  const [processingStatus, setProcessingStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingMovieId, setProcessingMovieId] = useState<number | null>(null);
  const [deletingMovieId, setDeletingMovieId] = useState<number | null>(null);

  const loadMovies = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      const [moviesResponse, optionsResponse] = await Promise.all([
        adminMoviesService.list({
          page,
          search: debouncedSearch,
          publish_status: publishStatus,
          processing_status: processingStatus,
        }),
        adminMoviesService.options(),
      ]);

      if (moviesResponse.success && moviesResponse.data) {
        setMovies(moviesResponse.data.movies);
        setSummary(moviesResponse.data.summary);
        setPagination(moviesResponse.data.pagination);
      } else {
        setError(moviesResponse.message || "دریافت فیلم ها با خطا روبه رو شد.");
      }

      if (optionsResponse.success && optionsResponse.data) {
        setOptions(optionsResponse.data);
      }

      setLoading(false);
    },
    [debouncedSearch, publishStatus, processingStatus]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMovies(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMovies]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!movies.some((movie) => ["queued", "processing"].includes(movie.processing_status))) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadMovies(pagination.current_page || 1);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [loadMovies, movies, pagination.current_page]);

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setPublishStatus("");
    setProcessingStatus("");
  };

  const handleQueueProcessing = async (movieId: number) => {
    setProcessingMovieId(movieId);
    setError("");

    const response = await adminMoviesService.queueProcessing(movieId);

    if (response.success) {
      await loadMovies(pagination.current_page);
    } else {
      setError(response.message || "شروع پردازش با خطا روبه رو شد.");
    }

    setProcessingMovieId(null);
  };

  const handleDeleteMovie = async (movie: AdminMovie) => {
    const confirmed = window.confirm(
      `همه اطلاعات و خروجی های مدیریت شده فیلم «${movie.title}» حذف شود؟ این عمل قابل بازگشت نیست.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingMovieId(movie.id);
    setError("");

    const response = await adminMoviesService.remove(movie.id);

    if (response.success) {
      const targetPage =
        movies.length === 1 && pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page;

      await loadMovies(targetPage);
    } else {
      setError(response.message || "حذف کامل فیلم انجام نشد.");
    }

    setDeletingMovieId(null);
  };

  const statCards = [
    {
      label: "کل فیلم ها",
      value: summary.total,
      icon: MdOutlineLocalMovies,
      accent: "border-[#f5c518]/18 bg-[#f5c518]/10 text-[#f8d977]",
    },
    {
      label: "در صف یا پردازش",
      value: summary.processing,
      icon: HiOutlineLightningBolt,
      accent: "border-[#38bdf8]/18 bg-[#38bdf8]/10 text-[#7dd3fc]",
    },
    {
      label: "آماده پخش",
      value: summary.ready,
      icon: MdOutlineOndemandVideo,
      accent: "border-[#34d399]/18 bg-[#34d399]/10 text-[#86efac]",
    },
    {
      label: "منتشر شده",
      value: summary.published,
      icon: MdOutlineMovieFilter,
      accent: "border-[#fb7185]/18 bg-[#fb7185]/10 text-[#fda4af]",
    },
  ];

  const publishStatusOptions = [
    {
      value: "",
      label: "همه وضعیت های انتشار",
      description: "نمایش همه فیلم ها بدون محدودیت انتشار",
    },
    ...options.publish_statuses.map((status) => ({
      value: status.value,
      label: status.label,
      description: `فیلتر بر اساس ${status.label}`,
    })),
  ];

  const processingStatusOptions = [
    {
      value: "",
      label: "همه وضعیت های پردازش",
      description: "نمایش همه وضعیت های پردازش مدیا",
    },
    ...options.processing_statuses.map((status) => ({
      value: status.value,
      label: status.label,
      description: `فیلتر بر اساس ${status.label}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_42%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
              مدیریت فیلم ها و جریان مدیا
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
              ثبت منبع فایل، بررسی وضعیت HLS و حذف کامل خروجی ها
            </h2>
            <p className="mt-5 text-base leading-8 text-[#dde7ed] md:text-lg">
              هر فیلم به عنوان یک asset مدیریت شده ثبت می شود و ساختار نهایی آن
              زیر <span className="text-[#f8d977]">{options.media_root}</span>{" "}
              نگه داری می شود.
            </p>
          </div>

          <Link
            href="/admin/content-management/movies/add"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
          >
            <HiOutlinePlus className="h-4 w-4" />
            ثبت فیلم جدید
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <AdminStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            accentClassName={card.accent}
          />
        ))}
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr_0.9fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">
              جست وجو بر اساس عنوان یا slug
            </span>
            <div className="relative">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="مثلا inception یا dune-part-two"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 pr-11 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/50 focus:bg-white/[0.06]"
              />
              <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b909d]" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">
              وضعیت انتشار
            </span>
            <AdminSelect
              value={publishStatus}
              onChange={setPublishStatus}
              options={publishStatusOptions}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">
              وضعیت پردازش
            </span>
            <AdminSelect
              value={processingStatus}
              onChange={setProcessingStatus}
              options={processingStatusOptions}
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              پاکسازی فیلترها
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">فهرست فیلم ها</h3>
            <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
              از همین صفحه می توانی وضعیت پردازش را شروع کنی یا فیلم را با همه
              خروجی های مدیریت شده اش حذف کنی.
            </p>
          </div>
          <p className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#b6c5cf]">
            {pagination.total} فیلم
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
            <h4 className="text-xl font-bold text-white">فیلمی ثبت نشده است</h4>
            <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
              اولین فیلم را ثبت کن تا جریان پردازش و مدیریت مدیا شروع شود.
            </p>
            <Link
              href="/admin/content-management/movies/add"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
            >
              <HiOutlinePlus className="h-4 w-4" />
              ثبت اولین فیلم
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {movies.map((movie) => {
                const publish = getPublishPresentation(movie.publish_status);
                const processing = getProcessingPresentation(
                  movie.processing_status
                );
                const isReady = movie.processing_status === "ready";

                return (
                  <article
                    key={movie.id}
                    className="group rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))]"
                  >
                    <div className="flex gap-5">
                      <PosterPreview movie={movie} />

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 max-w-[70%]">
                            <h4 className="truncate text-2xl font-black tracking-tight text-white">
                              {movie.title}
                            </h4>
                            <p className="mt-2 text-sm text-[#8ea4b3]">
                              /{movie.slug}
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
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
                        </div>

                        <p className="mt-4 line-clamp-2 min-h-[56px] text-sm leading-7 text-[#c7d5de]">
                          {movie.synopsis || "برای این فیلم هنوز خلاصه ای ثبت نشده است."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7e4eb]">
                            ثبت: {formatPersianDate(movie.created_at)}
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7e4eb]">
                            کیفیت ها: {movie.media_asset?.variants.length || 0}
                          </span>
                          {movie.has_dubbed_audio ? (
                            <span className="rounded-full border border-[#38bdf8]/20 bg-[#38bdf8]/10 px-3 py-1.5 text-xs text-[#7dd3fc]">
                              دوبله
                            </span>
                          ) : null}
                          {movie.has_subtitle ? (
                            <span className="rounded-full border border-[#f5c518]/20 bg-[#f5c518]/10 px-3 py-1.5 text-xs text-[#f8d977]">
                              زیرنویس
                            </span>
                          ) : null}
                        </div>

                        {movie.processing_error && (
                          <div className="mt-4 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
                            {movie.processing_error}
                          </div>
                        )}

                        <div className="mt-auto pt-5">
                          <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/admin/content-management/movies/${movie.id}`}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
                          >
                            جزئیات
                          </Link>
                          {!isReady ? (
                            <button
                              type="button"
                              onClick={() => void handleQueueProcessing(movie.id)}
                              disabled={
                                processingMovieId === movie.id ||
                                movie.processing_status === "queued" ||
                                movie.processing_status === "processing"
                              }
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {processingMovieId === movie.id
                                ? "در حال ارسال..."
                                : "شروع پردازش HLS"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void handleDeleteMovie(movie)}
                            disabled={deletingMovieId === movie.id}
                            className="inline-flex items-center gap-2 rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 px-4 py-2.5 text-sm text-[#fecdd3] transition hover:border-[#fb7185]/35 hover:bg-[#fb7185]/16 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                            {deletingMovieId === movie.id ? "در حال حذف..." : "حذف کامل"}
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <AdminPagination
              pagination={pagination}
              disabled={loading}
              onPageChange={(page) => void loadMovies(page)}
            />
          </>
        )}
      </section>
    </div>
  );
}
