"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { HiOutlineCollection, HiOutlineSearch } from "react-icons/hi";
import AdminPagination from "../../../components/admin/AdminPagination";
import AdminSelect from "../../../components/admin/AdminSelect";
import { PosterImage } from "../../../components/images";
import { apiClient } from "../../../lib/api";
import { adminApiErrorMessage, unwrapAdminListPayload } from "../../../lib/admin-api";
import {
  type AdminCollectionsListResponse,
  type AdminCollectionsPagination,
} from "../../../lib/admin-collections";

const emptyPagination: AdminCollectionsPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 12,
  total: 0,
};

export default function CollectionsListPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visibility, setVisibility] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const listKey = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (visibility) query.set("visibility", visibility);
    return `/admin/collections?${query.toString()}`;
  }, [page, debouncedSearch, visibility]);

  const { data, isLoading, error: swrError } = useSWR(
    listKey,
    async (url: string) => {
      const response = await apiClient.get<AdminCollectionsListResponse>(url);
      const payload = unwrapAdminListPayload<AdminCollectionsListResponse>(
        response,
        "collections",
      );
      if (!payload) {
        throw new Error(adminApiErrorMessage(response, "دریافت مجموعه‌ها انجام نشد."));
      }
      return payload;
    },
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const collections = data?.collections ?? [];
  const pagination = data?.pagination ?? emptyPagination;
  const loading = isLoading && !data;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, visibility]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (swrError instanceof Error) {
      setError(swrError.message);
      return;
    }
    setError("");
  }, [swrError]);

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/20 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
          <HiOutlineCollection className="h-4 w-4" />
          فقط مشاهده
        </span>
        <h1 className="mt-4 text-3xl font-black text-white">مجموعه‌های فیلم</h1>
        <p className="mt-2 text-sm text-white/55">
          این بخش فعلاً فقط برای نمایش است و امکان ایجاد یا ویرایش ندارد.
        </p>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="جستجو بر اساس نام یا اسلاگ..."
            className="w-full rounded-2xl border border-white/10 bg-[#0b1018] py-3 pr-12 pl-4 text-white outline-none focus:border-[#f5c518]/50"
          />
        </div>
        <AdminSelect
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "", label: "همه وضعیت‌ها" },
            { value: "visible", label: "قابل نمایش" },
            { value: "hidden", label: "مخفی" },
          ]}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
        <table className="min-w-full text-right text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-white/55">
            <tr>
              <th className="px-4 py-4 font-medium">مجموعه</th>
              <th className="px-4 py-4 font-medium">فیلم‌ها</th>
              <th className="px-4 py-4 font-medium">TMDB</th>
              <th className="px-4 py-4 font-medium">نمایش</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-white/45">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : collections.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-white/45">
                  مجموعه‌ای ثبت نشده است.
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id} className="border-b border-white/5">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-11 overflow-hidden rounded-lg bg-[#12161f]">
                        <PosterImage
                          title={collection.name}
                          image={collection.poster_image}
                          src={collection.poster_url}
                          usage="poster-card"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{collection.name}</p>
                        <p className="text-xs text-white/45">{collection.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-white/75">
                    {collection.movies_count ?? 0}
                  </td>
                  <td className="px-4 py-4 text-white/55">
                    {collection.tmdb_collection_id ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        collection.is_visible
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-white/5 text-white/45"
                      }`}
                    >
                      {collection.is_visible ? "فعال" : "مخفی"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        pagination={pagination}
        disabled={loading}
        onPageChange={setPage}
      />
    </div>
  );
}
