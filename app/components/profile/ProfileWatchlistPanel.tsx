"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HiOutlineBookmark, HiOutlineTrash, HiMiniPlay } from "react-icons/hi2";
import { PosterImage } from "../images";
import {
  listWatchlist,
  removeFromWatchlist,
  type WatchlistItem,
} from "../../lib/watchlist";

export default function ProfileWatchlistPanel({
  userId,
}: {
  userId: number;
}) {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  const refresh = useCallback(() => {
    setItems(listWatchlist(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRemove = (item: WatchlistItem) => {
    const next = removeFromWatchlist(userId, item.kind, item.id);
    setItems(next);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#2f2f2f] bg-[#1f1f1f] p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <HiOutlineBookmark className="mb-4 h-16 w-16 text-gray-600" />
          <h3 className="text-lg font-semibold text-white">لیست ذخیره‌شده خالی است</h3>
          <p className="mt-2 max-w-md text-sm leading-7 text-gray-400">
            از صفحه جزئیات فیلم یا سریال، دکمه «ذخیره» را بزنید تا اینجا نمایش داده شود.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/movies"
              className="rounded-lg bg-[#f5c518] px-5 py-2.5 text-sm font-bold text-[#081018] transition hover:bg-[#e8bb0d]"
            >
              مشاهده فیلم‌ها
            </Link>
            <Link
              href="/series"
              className="rounded-lg border border-[#3a3a3a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
            >
              مشاهده سریال‌ها
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-400">
        {items.length.toLocaleString("en-US")} مورد در لیست «بعداً ببینم» شما
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const href = `/${item.kind === "movie" ? "movies" : "series"}/${item.slug}`;
          const yearLabel =
            item.release_year != null ? String(item.release_year) : null;

          return (
            <article
              key={`${item.kind}-${item.id}`}
              className="overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#1f1f1f]"
            >
              <div className="relative aspect-[2/3] bg-[#12161f]">
                <Link href={href} className="block h-full">
                  <PosterImage
                    title={item.title}
                    src={item.poster_url}
                    usage="poster-card"
                    loading="lazy"
                  />
                </Link>
                <span className="absolute top-2 right-2 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-white">
                  {item.kind === "movie" ? "فیلم" : "سریال"}
                </span>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h3 className="line-clamp-2 text-base font-bold leading-7 text-white">
                    <Link href={href} className="transition hover:text-[#f5c518]">
                      {item.title}
                    </Link>
                  </h3>
                  {yearLabel ? (
                    <p className="mt-1 text-sm text-gray-400">{yearLabel}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={href}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#f5c518] px-3 py-2.5 text-sm font-bold text-[#12100a] transition hover:bg-[#e8bb0d]"
                  >
                    مشاهده
                    <HiMiniPlay className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    aria-label={`حذف ${item.title} از لیست`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#3a3a3a] text-gray-400 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <HiOutlineTrash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
