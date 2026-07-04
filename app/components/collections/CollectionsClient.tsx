"use client";

import Link from "next/link";
import useSWR from "swr";
import { HiOutlineCollection } from "react-icons/hi";
import { PosterImage } from "../images";
import {
  fetchCollectionsCatalogRest,
  type CollectionListItem,
} from "../../lib/collections/rest";
import type { PaginationMeta } from "../../lib/catalog/rest";
import { CatalogPosterGridSkeleton } from "../skeletons/CatalogPageSkeleton";
import { CATALOG_LIST_SWR_OPTIONS } from "../../lib/swr/public-cache";

export default function CollectionsClient({
  initialItems,
  initialMeta,
  initialError,
}: {
  initialItems: CollectionListItem[];
  initialMeta: PaginationMeta;
  initialError: string;
}) {
  const { data, isLoading, isValidating, error } = useSWR(
    "collections:catalog",
    () => fetchCollectionsCatalogRest(1, 48),
    {
      fallbackData: {
        items: initialItems,
        meta: initialMeta,
        error: initialError,
      },
      ...CATALOG_LIST_SWR_OPTIONS,
    },
  );

  const items: CollectionListItem[] = data?.items ?? initialItems;
  const fetchError = data?.error ?? (error instanceof Error ? error.message : "");
  const loading = (isLoading || isValidating) && items.length === 0;

  return (
    <div className="min-h-screen bg-[#05070b] text-white" dir="rtl">
      <section className="border-b border-[#f5c518]/10 bg-[linear-gradient(180deg,rgba(245,197,24,0.14),rgba(5,7,11,0.98))]">
        <div className="mx-auto max-w-[1820px] px-4 py-12 md:px-7 md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
            <HiOutlineCollection className="h-4 w-4" />
            مجموعه‌های فیلم
          </span>
          <h1 className="mt-5 text-4xl font-black md:text-5xl">کالکشن‌ها</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/65 md:text-lg">
            مجموعه‌های مرتبط مثل سری فیلم‌های محبوب، فرنچایزها .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1820px] px-4 py-10 md:px-7">
        {fetchError ? (
          <div className="mb-6 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {fetchError}
          </div>
        ) : null}

        {loading ? (
          <CatalogPosterGridSkeleton count={48} />
        ) : items.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center text-white/50">
            هنوز مجموعه‌ای منتشر نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/collections/${item.slug}`}
                className="group block min-w-0"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#12161f]">
                  <PosterImage
                    title={item.name}
                    image={item.poster_image}
                    src={item.poster_url}
                    fallbackUrl={item.backdrop_url}
                    usage="poster-grid"
                    wrapperClassName="h-full transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-black/35 opacity-0 transition group-hover:opacity-100" />
                </div>
                <div className="mt-2.5 space-y-1 text-right">
                  <p className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#f8d977]/70">
                    {item.movies_count.toLocaleString("fa-IR")} فیلم
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
