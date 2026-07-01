"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  HiOutlineStar,
  HiOutlinePencilAlt,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineDocumentText,
} from "react-icons/hi";
import {
  MdOutlineFeaturedPlayList,
  MdOutlineSubscriptions,
  MdOutlineTv,
  MdOutlineVideoLibrary,
} from "react-icons/md";
import AdminCatalogFilters, {
  type AdminCatalogFilterState,
} from "../../../components/admin/AdminCatalogFilters";
import AdminDeleteConfirmModal from "../../../components/admin/AdminDeleteConfirmModal";
import AdminPagination from "../../../components/admin/AdminPagination";
import AdminStatCard from "../../../components/admin/AdminStatCard";
import { formatGregorianDate } from "../../../lib/date-format";
import { translateProductionStatus } from "../../../lib/production-status";
import { apiClient } from "../../../lib/api";
import { adminApiErrorMessage, unwrapAdminListPayload } from "../../../lib/admin-api";
import { revalidateAdminSeriesList } from "../../../lib/admin-series-revalidate";
import { revalidatePublicSeriesPages } from "../../../lib/catalog/revalidate";
import { ContentStatusBadge } from "../../../components/admin/ContentStatusBadge";
import { PosterImage } from "../../../components/images";
import {
  adminSeriesService,
  type AdminSeries,
  type AdminSeriesListResponse,
  type AdminSeriesOptionsResponse,
  type AdminSeriesPagination,
  type AdminSeriesSummary,
} from "../../../lib/admin-series";

const emptySummary: AdminSeriesSummary = {
  total: 0,
  drafts: 0,
  scheduled: 0,
  published: 0,
  featured: 0,
};

const emptyPagination: AdminSeriesPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 12,
  total: 0,
};

const emptyOptions: AdminSeriesOptionsResponse = {
  publish_statuses: [],
  production_statuses: [],
  show_types: [],
  catalog_visibility: [],
  genres: [],
  countries: [],
  languages: [],
};

function SeriesPoster({ series }: { series: AdminSeries }) {
  if (series.poster_url || series.poster_image) {
    return (
      <div className="relative h-48 w-32 shrink-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#071019] shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
        <PosterImage
          title={series.title}
          image={series.poster_image}
          src={series.poster_url}
          usage="poster-grid"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="flex h-48 w-32 shrink-0 items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-white/3 px-4 text-center text-xs leading-6 text-[#8ea4b3]">
      بدون پوستر
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

export default function AllSeriesPage() {
  const [options, setOptions] = useState<AdminSeriesOptionsResponse>(emptyOptions);
  const [filters, setFilters] = useState<AdminCatalogFilterState>(emptyFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminSeries | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const listKey = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (filters.publish_status) query.set("publish_status", filters.publish_status);
    if (filters.extra) query.set("status", filters.extra);
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
    return `/admin/series?${query.toString()}`;
  }, [page, debouncedSearch, filters]);

  const { data, isLoading, mutate } = useSWR(
    listKey,
    async (url: string) => {
      const response = await apiClient.get<AdminSeriesListResponse>(url);
      const payload = unwrapAdminListPayload<AdminSeriesListResponse>(response, "series");
      if (!payload) {
        throw new Error(adminApiErrorMessage(response, "دریافت سریال ها انجام نشد."));
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

  const seriesItems = data?.series ?? [];
  const summary = data?.summary ?? emptySummary;
  const pagination = data?.pagination ?? emptyPagination;
  const loading = isLoading && !data;

  useEffect(() => {
    void adminSeriesService.options().then((response) => {
      if (response.success && response.data) {
        setOptions(response.data);
      }
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    const hasProcessingItems = seriesItems.some(
      (item) =>
        item.pipeline_status === "pending" || item.pipeline_status === "running",
    );

    if (!hasProcessingItems) {
      return;
    }

    const interval = window.setInterval(() => {
      void mutate();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [seriesItems, mutate]);

  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setDebouncedSearch("");
  };

  const executeDeleteSeries = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    const deletedId = deleteTarget.id;
    const deletedSlug = deleteTarget.slug;
    setIsDeleting(true);
    setError("");

    const response = await adminSeriesService.remove(deletedId);

    if (response.success) {
      const targetPage =
        seriesItems.length === 1 && pagination.current_page > 1
          ? pagination.current_page - 1
          : pagination.current_page;

      setDeleteTarget(null);

      await mutate(
        (current) => {
          if (!current) {
            return current;
          }

          const nextSeries = current.series.filter((item) => item.id !== deletedId);

          return {
            ...current,
            series: nextSeries,
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
        revalidateAdminSeriesList(),
        revalidatePublicSeriesPages(deletedSlug),
      ]);
    } else {
      setError(response.message || "حذف سریال انجام نشد.");
    }

    setIsDeleting(false);
  };

  const statCards = [
    {
      label: "کل سریال ها",
      value: summary.total,
      icon: MdOutlineSubscriptions,
      accent: "border-[#f5c518]/18 bg-[#f5c518]/10 text-[#f8d977]",
    },
    {
      label: "پیش نویس ها",
      value: summary.drafts,
      icon: MdOutlineVideoLibrary,
      accent: "border-[#38bdf8]/18 bg-[#38bdf8]/10 text-[#7dd3fc]",
    },
    {
      label: "منتشر شده",
      value: summary.published,
      icon: MdOutlineTv,
      accent: "border-[#34d399]/18 bg-[#34d399]/10 text-[#86efac]",
    },
    {
      label: "ویژه",
      value: summary.featured,
      icon: MdOutlineFeaturedPlayList,
      accent: "border-[#fb7185]/18 bg-[#fb7185]/10 text-[#fda4af]",
    },
  ];

  const publishStatusOptions = [
    {
      value: "",
      label: "همه وضعیت های انتشار",
      description: "نمایش همه سریال ها",
    },
    ...options.publish_statuses.map((status) => ({
      value: status.value,
      label: status.label,
      description: `فیلتر بر اساس ${status.label}`,
    })),
  ];

  const productionStatusOptions = [
    {
      value: "",
      label: "همه وضعیت های تولید",
      description: "Returning Series, Ended و موارد دیگر",
    },
    ...options.production_statuses.map((status) => ({
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
            <h1 className="text-2xl font-bold text-white">سریال‌ها</h1>
            <p className="mt-2 text-sm text-[#8ea4b3]">مدیریت فهرست سریال‌ها</p>
          </div>

          <Link
            href="/admin/content-management/series/add"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
          >
            <HiOutlinePlus className="h-4 w-4" />
            افزودن سریال
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
        title="فیلتر سریال‌ها"
        searchPlaceholder="مثلاً the-last-of-us یا HBO"
        state={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        genres={options.genres ?? []}
        countries={options.countries ?? []}
        languages={options.languages ?? []}
        publishOptions={publishStatusOptions}
        visibilityOptions={[
          { value: "", label: "همه حالت‌های نمایش" },
          ...options.catalog_visibility.map((item) => ({
            value: item.value,
            label: item.label,
          })),
          { value: "slider_homepage", label: "فعال در اسلایدر صفحه اصلی" },
        ]}
        extraLabel="وضعیت تولید"
        extraOptions={productionStatusOptions}
      />

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">لیست سریال ها</h3>
            <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
              از این بخش وارد فرم کامل TV Show، فصل ها و قسمت های هر سریال می شوی.
            </p>
          </div>
          <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#b6c5cf]">
            {pagination.total} سریال
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
        ) : seriesItems.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/12 bg-white/2 px-6 py-12 text-center">
            <h4 className="text-xl font-bold text-white">سریالی ثبت نشده است</h4>
            <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
              اولین سریال را ثبت کن تا ساختار فصل و قسمت ها در پنل فعال شود.
            </p>
            <Link
              href="/admin/content-management/series/add"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
            >
              <HiOutlinePlus className="h-4 w-4" />
              افزودن اولین سریال
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {seriesItems.map((series) => {
                const sliderActive = series.is_featured && !series.exclude_from_slider;
                return (
                  <article
                    key={series.id}
                    className="group rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))]"
                  >
                    <div className="flex gap-5">
                      <SeriesPoster series={series} />

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 max-w-[70%]">
                            <h4 className="truncate text-2xl font-black text-white">
                              {series.title}
                            </h4>
                            <p className="mt-2 text-sm text-[#8ea4b3]">/{series.slug}</p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            {series.has_admin_notes ? (
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
                            {series.exclude_from_slider ? (
                              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-[#c8d5de]">
                                خارج از اسلایدر
                              </span>
                            ) : null}
                            <ContentStatusBadge item={series} />
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-2 min-h-[56px] text-sm leading-7 text-[#c7d5de]">
                          {series.synopsis || "برای این سریال هنوز خلاصه ای ثبت نشده است."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[#d7e4eb]">
                            شروع: {formatGregorianDate(series.first_air_date)}
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[#d7e4eb]">
                            {series.seasons_count} فصل
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[#d7e4eb]">
                            {series.episodes_count} قسمت
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[#d7e4eb]">
                            {visibilityLabel(series.catalog_visibility)}
                          </span>
                          {series.status ? (
                            <span className="rounded-full border border-[#38bdf8]/20 bg-[#38bdf8]/10 px-3 py-1.5 text-xs text-[#7dd3fc]">
                              {translateProductionStatus(series.status)}
                            </span>
                          ) : null}
                          {series.network ? (
                            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[#d7e4eb]">
                              {series.network}
                            </span>
                          ) : null}
                          {series.has_subtitle ? (
                            <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1.5 text-xs font-semibold text-[#f8d977]">
                              زیرنویس
                            </span>
                          ) : null}
                          {series.has_dubbed ? (
                            <span className="rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1.5 text-xs font-semibold text-[#f8d977]">
                              دوبله
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-auto pt-5">
                          <div className="flex flex-wrap gap-3">
                            <Link
                              href={`/admin/content-management/series/${series.id}`}
                              className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
                            >
                              <HiOutlinePencilAlt className="h-4 w-4" />
                              ویرایش
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(series)}
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
        kind="series"
        title={deleteTarget?.title ?? ""}
        loading={isDeleting}
        onConfirm={() => void executeDeleteSeries()}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
