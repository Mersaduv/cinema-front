"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { HiMagnifyingGlass, HiOutlineFilm } from "react-icons/hi2";
import { MdOutlineTv } from "react-icons/md";
import CatalogPosterCard from "../catalog/CatalogPosterCard";
import { fetchSearchResults } from "../../lib/search/rest";

const SUGGESTIONS = [
  "اینترستلار",
  "برکینگ بد",
  "گناهکاران",
  "آخرین بازمانده از ما",
];

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();

  const [inputValue, setInputValue] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    [],
  );

  const commitQuery = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      const params = new URLSearchParams();
      if (trimmed) {
        params.set("q", trimmed);
      }
      const nextUrl = params.toString() ? `/search?${params}` : "/search";
      router.replace(nextUrl, { scroll: false });
    },
    [router],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => commitQuery(value), 350);
    },
    [commitQuery],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      commitQuery(inputValue);
    },
    [commitQuery, inputValue],
  );

  const swrKey = query ? `search:${query}` : null;

  const { data, isLoading, isValidating } = useSWR(
    swrKey,
    () => fetchSearchResults(query),
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const loading = Boolean(swrKey) && (isLoading || isValidating);
  const movies = data?.movies ?? [];
  const series = data?.series ?? [];
  const error = data?.error ?? "";
  const totalResults = (data?.moviesMeta.total ?? 0) + (data?.seriesMeta.total ?? 0);
  const hasQuery = query.length > 0;
  const hasResults = movies.length > 0 || series.length > 0;

  const resultSummary = useMemo(() => {
    if (!hasQuery) return null;
    if (loading) return "در حال جستجو…";
    if (totalResults === 0) return `نتیجه‌ای برای «${query}» پیدا نشد.`;
    return `${totalResults.toLocaleString("fa-IR")} نتیجه برای «${query}»`;
  }, [hasQuery, loading, query, totalResults]);

  return (
    <div className="min-h-screen bg-[#05070b] text-white" dir="rtl">
      <section className="border-b border-[#f5c518]/10 bg-[linear-gradient(180deg,rgba(245,197,24,0.14),rgba(5,7,11,0.98))]">
        <div className="mx-auto flex max-w-[1820px] flex-col items-center px-4 pb-10 pt-8 md:px-7 md:pb-14 md:pt-12">

          <form onSubmit={handleSubmit} className="mt-8 w-full max-w-3xl">
            <div className="relative">
              <HiMagnifyingGlass className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[#f5c518]/45" />
              <input
                ref={inputRef}
                type="search"
                value={inputValue}
                onChange={(event) => handleInputChange(event.target.value)}
                placeholder="جستجوی فیلم و سریال…"
                className="w-full rounded-[28px] border border-[#f5c518]/20 bg-white/[0.06] py-5 pr-14 pl-6 text-lg text-white placeholder:text-white/35 outline-none transition focus:border-[#f5c518]/70 focus:bg-white/[0.08] focus:shadow-[0_0_0_4px_rgba(245,197,24,0.14)] md:text-xl"
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
          </form>

          {resultSummary && (
            <p className="mt-5 text-sm text-[#f8d977]/70 md:text-base">{resultSummary}</p>
          ) }
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1820px] px-4 py-10 md:px-7">
        {error ? (
          <div className="mb-6 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}

        {!hasQuery ? (
          <div className="rounded-[32px] border border-dashed border-[#f5c518]/15 bg-[#f5c518]/[0.03] px-6 py-20 text-center">
            <HiMagnifyingGlass className="mx-auto h-12 w-12 text-[#f5c518]/25" />
            <p className="mt-5 text-lg font-semibold text-white/70">
              نام فیلم یا سریال را وارد کنید
            </p>
            <p className="mt-2 text-sm text-white/45">
              نتایج به‌صورت هم‌زمان در بخش فیلم و سریال نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <div className="relative">
            {loading ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-24">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#f5c518]" />
              </div>
            ) : null}

            <div
              className={`grid grid-cols-1 gap-8 xl:grid-cols-4 xl:gap-x-4 xl:gap-y-10 ${
                loading ? "opacity-50 transition-opacity" : ""
              }`}
            >
              <SearchResultColumn
                kind="movie"
                items={movies}
                loading={loading}
                hasQuery={hasQuery}
                empty={!loading && movies.length === 0}
              />
              <SearchResultColumn
                kind="series"
                items={series}
                loading={loading}
                hasQuery={hasQuery}
                empty={!loading && series.length === 0}
              />
            </div>

            {!loading && hasQuery && !hasResults ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/55">
                <span>می‌توانید در آرشیو کامل هم بگردید:</span>
                <Link
                  href={`/movies?search=${encodeURIComponent(query)}`}
                  className="rounded-xl border border-[#f5c518]/20 px-4 py-2 text-[#f8d977] transition hover:bg-[#f5c518]/10"
                >
                  فیلم‌ها
                </Link>
                <Link
                  href={`/series?search=${encodeURIComponent(query)}`}
                  className="rounded-xl border border-[#f5c518]/20 px-4 py-2 text-[#f8d977] transition hover:bg-[#f5c518]/10"
                >
                  سریال‌ها
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });
  return columns;
}

function SearchResultColumn({
  kind,
  items,
  loading,
  hasQuery,
  empty,
}: {
  kind: "movie" | "series";
  items: Parameters<typeof CatalogPosterCard>[0]["item"][];
  loading: boolean;
  hasQuery: boolean;
  empty: boolean;
}) {
  const isMovie = kind === "movie";
  const title = isMovie ? "فیلم‌ها" : "سریال‌ها";
  const basePath = isMovie ? "/movies" : "/series";
  const Icon = isMovie ? HiOutlineFilm : MdOutlineTv;
  const columns = splitIntoColumns(items, 2);

  return (
    <div className="min-w-0 xl:col-span-2">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#f5c518]/15 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#f5c518]/25 bg-[#f5c518]/10 text-[#f8d977]">
            <Icon className="h-4 w-4" />
          </span>
          <div className="text-right">
            <h2 className="text-lg font-bold text-white md:text-xl">{title}</h2>
            {hasQuery && !loading ? (
              <p className="mt-0.5 text-xs text-[#f8d977]/55">
                {items.length.toLocaleString("fa-IR")} مورد
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href={basePath}
          className="shrink-0 rounded-lg border border-[#f5c518]/20 px-2.5 py-1.5 text-xs text-[#f8d977]/80 transition hover:bg-[#f5c518]/10 hover:text-[#f8d977] md:text-sm"
        >
          مشاهده همه
        </Link>
      </div>

      {empty ? (
        <div className="rounded-[24px] border border-dashed border-[#f5c518]/15 bg-[#f5c518]/[0.02] px-4 py-12 text-center text-sm text-white/45">
          {isMovie ? "فیلمی یافت نشد." : "سریالی یافت نشد."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-7">
          {columns.map((columnItems, columnIndex) => (
            <div key={`${kind}-col-${columnIndex}`} className="flex min-w-0 flex-col gap-6 md:gap-7">
              {columnItems.map((item) => (
                <CatalogPosterCard
                  key={`${kind}-${item.id}`}
                  item={{ ...item, catalogKind: isMovie ? "movie" : "series" }}
                  href={`${basePath}/${item.slug}`}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPageClient() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}
