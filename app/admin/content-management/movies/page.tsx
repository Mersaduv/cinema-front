"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  HiOutlineDocumentText,
  HiOutlinePencilAlt,
  HiOutlinePlus,
  HiOutlineStar,
  HiOutlineTrash,
} from "react-icons/hi";
import {
  MdOutlineLocalMovies,
  MdOutlineOndemandVideo,
  MdOutlinePlaylistPlay,
  MdOutlineSell,
} from "react-icons/md";
import AdminCatalogFilters, {
  type AdminCatalogFilterState,
} from "../../../components/admin/AdminCatalogFilters";
import AdminDeleteConfirmModal from "../../../components/admin/AdminDeleteConfirmModal";
import AdminPagination from "../../../components/admin/AdminPagination";
import AdminStatCard from "../../../components/admin/AdminStatCard";
import { ContentStatusBadge } from "../../../components/admin/ContentStatusBadge";
import { adminApiErrorMessage, unwrapAdminListPayload } from "../../../lib/admin-api";
import { apiClient } from "../../../lib/api";
import { revalidateAdminMoviesList } from "../../../lib/admin-movies-revalidate";
import {
  adminMoviesService,
  getAdminMovieOptions,
  type AdminMovie,
  type AdminMovieOptionsResponse,
  type AdminMoviesPagination,
  type AdminMoviesResponse,
  type AdminMoviesSummary,
} from "../../../lib/admin-movies";
import { revalidatePublicMoviePages } from "../../../lib/catalog/revalidate";
import { formatGregorianDate } from "../../../lib/date-format";

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
  genres: [],
  countries: [],
  languages: [],
  catalog_visibility: [],
};

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

const emptyFilters: AdminCatalogFilterState = {
  search: "",
  sort: "",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
  publish_status: "",
  visibility: "",
  slider: "",
  extra: "",
};

function visibilityLabel(value?: string) {
  switch (value) {
    case "catalog":
      return "فقط کاتالوگ";
    case "search":
      return "فقط جستجو";
    case "hidden":
      return "مخفی";
    default:
      return "کاتالوگ و جستجو";
  }
}

export default function AllMoviesPage() {
  const [options, setOptions] = useState<AdminMovieOptionsResponse>(emptyOptions);
  const [filters, setFilters] = useState<AdminCatalogFilterState>(emptyFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminMovie | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const listKey = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (filters.publish_status) query.set("publish_status", filters.publish_status);
    if (filters.visibility === "slider_homepage") {
      query.set("slider", "homepage");
    } else if (filters.visibility) {
      query.set("catalog_visibility", filters.visibility);
    }
    if (filters.sort) query.set("sort", filters.sort);
    if (filters.min_rating) query.set("min_rating", filters.min_rating);
    if (filters.year_from) query.set("year_from", String(filters.year_from));
    if (filters.year_to) query.set("year_to", String(filters.year_to));
    if (filters.genres.length) query.set("genre_ids", filters.genres.join(","));
    if (filters.countries.length) query.set("countries", filters.countries.join(","));
    if (filters.languages.length) query.set("languages", filters.languages.join(","));
    return `/admin/movies?${query.toString()}`;
  }, [page, debouncedSearch, filters]);

  const { data, isLoading, mutate } = useSWR(
    listKey,
    async (url: string) => {
      const response = await apiClient.get<AdminMoviesResponse>(url);
      const payload = unwrapAdminListPayload<AdminMoviesResponse>(response, "movies");
      if (!payload) {
        throw new Error(adminApiErrorMessage(response, "دریافت فیلم‌ها با خطا روبه‌رو شد."));
      }
      return payload;
    },
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0,
      keepPreviousData: true,
    },
  );

  const movies = data?.movies ?? [];
  const summary = data?.summary ?? emptySummary;
  const pagination = data?.pagination ?? emptyPagination;
  const loading = isLoading && !data;

  useEffect(() => {
    void getAdminMovieOptions().then(setOptions);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setDebouncedSearch("");
    setPage(1);
  };

  const executeDeleteMovie = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    const deletedId = deleteTarget.id;
    const deletedSlug = deleteTarget.slug;
    setIsDeleting(true);
    setError("");

    const response = await adminMoviesService.remove(deletedId);

    if (response.success) {
      const targetPage =
        movies.length === 1 && pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page;

      setDeleteTarget(null);

      await mutate(
        (current) => {
          if (!current) {
            return current;
          }

          const nextMovies = current.movies.filter((movie) => movie.id !== deletedId);

          return {
            ...current,
            movies: nextMovies,
            summary: {
              ...current.summary,
              total: Math.max(0, current.summary.total - 1),
            },
            pagination: {
              ...current.pagination,
              total: Math.max(0, current.pagination.total - 1),
            },
          };
        },
        { revalidate: true },
      );

      if (targetPage !== page) {
        setPage(targetPage);
      }

      await Promise.all([
        revalidateAdminMoviesList(),
        revalidatePublicMoviePages(deletedSlug),
      ]);
    } else {
      setError(response.message || "حذف کامل فیلم انجام نشد.");
    }

    setIsDeleting(false);
  };

  const statCards = [
    {
      label: "کل فیلم‌ها",
      value: summary.total,
      icon: MdOutlineLocalMovies,
      accent: "border-[#f5c518]/18 bg-[#f5c518]/10 text-[#f8d977]",
    },
    {
      label: "پیش‌نویس‌ها",
      value: summary.drafts,
      icon: MdOutlineSell,
      accent: "border-[#38bdf8]/18 bg-[#38bdf8]/10 text-[#7dd3fc]",
    },
    {
      label: "آماده انتشار",
      value: summary.ready,
      icon: MdOutlinePlaylistPlay,
      accent: "border-[#34d399]/18 bg-[#34d399]/10 text-[#86efac]",
    },
    {
      label: "منتشر شده",
      value: summary.published,
      icon: MdOutlineOndemandVideo,
      accent: "border-[#fb7185]/18 bg-[#fb7185]/10 text-[#fda4af]",
    },
  ];

  const publishStatusOptions = [
    {
      value: "",
      label: "همه وضعیت‌های انتشار",
      description: "نمایش همه فیلم‌ها بدون محدودیت انتشار",
    },
    ...options.publish_statuses.map((status) => ({
      value: status.value,
      label: status.label,
      description: `فیلتر بر اساس ${status.label}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">فیلم‌ها</h1>
            <p className="mt-2 text-sm text-[#8ea4b3]">مدیریت فهرست فیلم‌ها</p>
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

      <AdminCatalogFilters
        title="فیلتر فیلم‌ها"
        searchPlaceholder="مثلاً inception یا dune-part-two"
        state={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onReset={handleResetFilters}
        genres={options.genres ?? []}
        countries={options.countries ?? []}
        languages={options.languages ?? []}
        publishOptions={publishStatusOptions}
        visibilityOptions={[
          { value: "", label: "همه حالت‌های نمایش" },
          ...((options.catalog_visibility ?? []).map((item) => ({
            value: item.value,
            label: item.label,
          })) ?? []),
          { value: "slider_homepage", label: "فعال در اسلایدر صفحه اصلی" },
        ]}
      />

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">فهرست فیلم‌ها</h3>
            <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
              از این صفحه وارد جزئیات و فرم یکپارچه انتشار/پیش‌نویس هر فیلم می‌شوی.
            </p>
          </div>
          <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#b6c5cf]">
            {pagination.total} فیلم
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/12 bg-white/2 px-6 py-12 text-center">
            <h4 className="text-xl font-bold text-white">فیلمی ثبت نشده است</h4>
            <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
              اولین فیلم را ثبت کن تا جریان مدیریت محتوا شروع شود.
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
                const sliderActive = movie.is_featured && !movie.exclude_from_slider;

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
                            <p className="mt-2 text-sm text-[#8ea4b3]">/{movie.slug}</p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            {movie.has_admin_notes ? (
                              <span
                                className="rounded-full border border-[#f59e0b]/25 bg-[#f59e0b]/10 px-2.5 py-1 text-xs text-[#fde68a]"
                                title="یادداشت داخلی دارد"
                              >
                                <HiOutlineDocumentText className="inline h-3.5 w-3.5" />
                              </span>
                            ) : null}
                            {sliderActive ? (
                              <span className="rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10 px-3 py-1 text-xs text-[#e9d5ff]">
                                <HiOutlineStar className="ml-1 inline h-3.5 w-3.5" />
                                اسلایدر اصلی
                              </span>
                            ) : null}
                            {movie.exclude_from_slider ? (
                              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-[#c8d5de]">
                                خارج از اسلایدر
                              </span>
                            ) : null}
                            {movie.publish_completion_pending ? (
                              <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1 text-xs text-[#fde68a]">
                                انتشار ناتمام
                              </span>
                            ) : null}
                            <ContentStatusBadge item={movie} />
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-2 min-h-[56px] text-sm leading-7 text-[#c7d5de]">
                          {movie.synopsis || "برای این فیلم هنوز خلاصه‌ای ثبت نشده است."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[#d7e4eb]">
                            ثبت: {formatGregorianDate(movie.created_at)}
                          </span>
                          {movie.release_year ? (
                            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[#d7e4eb]">
                              {movie.release_year}
                            </span>
                          ) : null}
                          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[#d7e4eb]">
                            {visibilityLabel(movie.catalog_visibility)}
                          </span>
                          {movie.has_subtitle ? (
                            <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1.5 text-xs font-semibold text-[#f8d977]">
                              زیرنویس
                            </span>
                          ) : null}
                          {movie.has_dubbed_audio ? (
                            <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1.5 text-xs font-semibold text-[#f8d977]">
                              دوبله
                            </span>
                          ) : null}
                        </div>

                        {movie.processing_error ? (
                          <div className="mt-4 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
                            {movie.processing_error}
                          </div>
                        ) : null}

                        <div className="mt-auto pt-5">
                          <div className="flex flex-wrap gap-3">
                            <Link
                              href={`/admin/content-management/movies/${movie.id}/publication`}
                              className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
                            >
                              <HiOutlinePencilAlt className="h-4 w-4" />
                              ویرایش
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(movie)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-2 rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 px-4 py-2.5 text-sm text-[#fecdd3] transition hover:border-[#fb7185]/35 hover:bg-[#fb7185]/16 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                              حذف
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
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <AdminDeleteConfirmModal
        open={deleteTarget !== null}
        kind="movie"
        title={deleteTarget?.title ?? ""}
        loading={isDeleting}
        onConfirm={() => void executeDeleteMovie()}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
