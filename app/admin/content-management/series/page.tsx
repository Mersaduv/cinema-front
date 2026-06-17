"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  HiOutlinePencilAlt,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineTrash,
} from "react-icons/hi";
import {
  MdOutlineFeaturedPlayList,
  MdOutlineSubscriptions,
  MdOutlineTv,
  MdOutlineVideoLibrary,
} from "react-icons/md";
import AdminDeleteConfirmModal from "../../../components/admin/AdminDeleteConfirmModal";
import AdminPagination from "../../../components/admin/AdminPagination";
import AdminSelect from "../../../components/admin/AdminSelect";
import AdminStatCard from "../../../components/admin/AdminStatCard";
import { formatGregorianDate } from "../../../lib/date-format";
import { translateProductionStatus } from "../../../lib/production-status";
import { apiClient } from "../../../lib/api";
import { adminApiErrorMessage, unwrapAdminListPayload } from "../../../lib/admin-api";
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
    <div className="flex h-48 w-32 shrink-0 items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-4 text-center text-xs leading-6 text-[#8ea4b3]">
      بدون پوستر
    </div>
  );
}

export default function AllSeriesPage() {
  const [options, setOptions] = useState<AdminSeriesOptionsResponse>(emptyOptions);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [publishStatus, setPublishStatus] = useState("");
  const [productionStatus, setProductionStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminSeries | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const listKey = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (publishStatus) query.set("publish_status", publishStatus);
    if (productionStatus) query.set("status", productionStatus);
    return `/admin/series?${query.toString()}`;
  }, [page, debouncedSearch, publishStatus, productionStatus]);

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
  }, [debouncedSearch, publishStatus, productionStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

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
    setSearchInput("");
    setDebouncedSearch("");
    setPublishStatus("");
    setProductionStatus("");
  };

  const executeDeleteSeries = async () => {
    if (!deleteTarget || isDeleting) {
      return;
    }

    const deletedId = deleteTarget.id;
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
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_42%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
              مدیریت سریال ها
            </span>
            <h2 className="mt-5 text-3xl font-black text-white md:text-5xl">
              فهرست سریال ها، فصل ها و وضعیت انتشار
            </h2>
            <p className="mt-5 text-base leading-8 text-[#dde7ed] md:text-lg">
              هر سریال با متادیتای کامل، فصل ها و قسمت ها مدیریت می‌شود تا بعداً صفحه عمومی سریال و پلیر قسمت‌ها روی همین داده‌ها ساخته شود.
            </p>
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

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr_0.9fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">
              جستجو بر اساس عنوان، slug یا شبکه
            </span>
            <div className="relative">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="مثلاً the-last-of-us یا HBO"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 pr-11 text-sm text-white outline-none transition placeholder:text-[#728896] focus:border-[#f5c518]/50 focus:bg-white/[0.06]"
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
              وضعیت تولید
            </span>
            <AdminSelect
              value={productionStatus}
              onChange={setProductionStatus}
              options={productionStatusOptions}
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
            <h3 className="text-xl font-bold text-white">لیست سریال ها</h3>
            <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
              از این بخش وارد فرم کامل TV Show، فصل ها و قسمت های هر سریال می شوی.
            </p>
          </div>
          <p className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#b6c5cf]">
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
                className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : seriesItems.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
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
                            <ContentStatusBadge item={series} />
                            {series.is_featured ? (
                              <span className="rounded-full border border-[#fb7185]/25 bg-[#fb7185]/10 px-3 py-1 text-xs text-[#fda4af]">
                                ویژه
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-2 min-h-[56px] text-sm leading-7 text-[#c7d5de]">
                          {series.synopsis || "برای این سریال هنوز خلاصه ای ثبت نشده است."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7e4eb]">
                            شروع: {formatGregorianDate(series.first_air_date)}
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7e4eb]">
                            {series.seasons_count} فصل
                          </span>
                          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7e4eb]">
                            {series.episodes_count} قسمت
                          </span>
                          {series.status ? (
                            <span className="rounded-full border border-[#38bdf8]/20 bg-[#38bdf8]/10 px-3 py-1.5 text-xs text-[#7dd3fc]">
                              {translateProductionStatus(series.status)}
                            </span>
                          ) : null}
                          {series.network ? (
                            <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7e4eb]">
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
