"use client";

import Link from "next/link";
import { HiOutlineFilm } from "react-icons/hi2";
import { MdOutlineTv } from "react-icons/md";
import CatalogPosterCard from "./CatalogPosterCard";
import type { CatalogListItem, PaginationMeta } from "../../lib/catalog/rest";

export default function CatalogPage({
  kind,
  title,
  description,
  items,
  loading,
  error,
  meta,
  filtersSlot,
  onPageChange,
  onLoadMore,
}: {
  kind: "movie" | "series";
  title: string;
  description: string;
  items: CatalogListItem[];
  loading: boolean;
  error: string;
  meta: PaginationMeta;
  filtersSlot?: React.ReactNode;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
}) {
  const basePath = kind === "movie" ? "/movies" : "/series";

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(239,68,68,0.12),rgba(5,7,11,0.98))]">
        <div className="mx-auto flex max-w-[1820px] flex-col gap-6 px-4 py-12 md:px-7 md:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl text-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70">
                {kind === "movie" ? (
                  <HiOutlineFilm className="h-4 w-4" />
                ) : (
                  <MdOutlineTv className="h-4 w-4" />
                )}
                آرشیو {kind === "movie" ? "فیلم‌ها" : "سریال‌ها"}
              </span>
              <h1 className="mt-5 text-4xl font-black md:text-5xl">{title}</h1>
              <p className="mt-4 text-base leading-8 text-white/65 md:text-lg">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:bg-white/[0.08]"
              >
                خانه
              </Link>
              <Link
                href={kind === "movie" ? "/series" : "/movies"}
                className="rounded-2xl bg-[#ef4444] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#dc2626]"
              >
                {kind === "movie" ? "مشاهده سریال‌ها" : "مشاهده فیلم‌ها"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1820px] px-4 py-10 md:px-7">
        {filtersSlot}

        {error ? (
          <div className="mb-6 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}

        <div className="relative">
          {loading ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-24">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#ef4444]" />
            </div>
          ) : null}

          <div className={loading ? "opacity-50 transition-opacity" : ""}>
            {items.length === 0 && !loading ? (
              <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center text-white/50">
                هنوز موردی در این بخش منتشر نشده است.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {items.map((item) => (
                  <CatalogPosterCard
                    key={item.id}
                    item={item}
                    href={`${basePath}/${item.slug}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {meta.last_page > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || loading}
              onClick={() => onPageChange?.(meta.current_page - 1)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-40"
            >
              قبلی
            </button>
            <span className="text-sm text-white/60">
              صفحه {meta.current_page} از {meta.last_page} ({meta.total} مورد)
            </span>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => onPageChange?.(meta.current_page + 1)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-40"
            >
              بعدی
            </button>
          </div>
        ) : null}

        {onLoadMore ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              بارگذاری بیشتر
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
