"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  HiOutlineCheck,
  HiOutlinePencilAlt,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineX,
} from "react-icons/hi";
import AdminDeleteConfirmModal from "../../components/admin/AdminDeleteConfirmModal";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminSelect from "../../components/admin/AdminSelect";
import AdminStatCard from "../../components/admin/AdminStatCard";
import { adminApiErrorMessage } from "../../lib/admin-api";
import {
  approveAdminReview,
  deleteAdminReview,
  fetchAdminReviews,
  rejectAdminReview,
  reviewStatusClass,
  reviewStatusLabel,
  updateAdminReview,
  type AdminReview,
  type AdminReviewsPagination,
} from "../../lib/admin-reviews";
import { formatGregorianDate } from "../../lib/date-format";
import type { ReviewStatus } from "../../lib/reviews";

const emptyPagination: AdminReviewsPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
};

type EditMode = "edit" | "censor";

export default function AdminCommentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "">("pending");
  const [typeFilter, setTypeFilter] = useState<"movie" | "series" | "">("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminReview | null>(null);
  const [editMode, setEditMode] = useState<EditMode>("edit");
  const [editRating, setEditRating] = useState(8);
  const [editBody, setEditBody] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const listKey = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (statusFilter) query.set("status", statusFilter);
    if (typeFilter) query.set("reviewable_type", typeFilter);
    return `admin-reviews:${query.toString()}`;
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  const { data, isLoading, mutate } = useSWR(
    listKey,
    () =>
      fetchAdminReviews({
        page,
        search: debouncedSearch,
        status: statusFilter,
        reviewableType: typeFilter,
      }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const reviews = data?.reviews ?? [];
  const pagination = data?.pagination ?? emptyPagination;
  const loading = isLoading && !data;

  const pendingCount = statusFilter === "pending" ? pagination.total : null;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(""), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  const openEditModal = (review: AdminReview, mode: EditMode) => {
    setEditTarget(review);
    setEditMode(mode);
    setEditRating(review.rating);
    setEditBody(review.body ?? "");
    setEditNote(review.admin_note ?? "");
    setError("");
  };

  const handleApprove = async (review: AdminReview) => {
    setActionId(review.id);
    setError("");
    const response = await approveAdminReview(review.id);
    setActionId(null);

    if (!response.success) {
      setError(adminApiErrorMessage(response, "تایید دیدگاه انجام نشد."));
      return;
    }

    setSuccess("دیدگاه تایید شد.");
    await mutate();
  };

  const handleReject = async (review: AdminReview) => {
    setActionId(review.id);
    setError("");
    const response = await rejectAdminReview(review.id);
    setActionId(null);

    if (!response.success) {
      setError(adminApiErrorMessage(response, "رد دیدگاه انجام نشد."));
      return;
    }

    setSuccess("دیدگاه رد شد.");
    await mutate();
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;

    setIsSaving(true);
    setError("");

    const response = await updateAdminReview(editTarget.id, {
      rating: editRating,
      body: editBody.trim(),
      admin_note: editNote.trim() || null,
      censor: editMode === "censor",
    });

    setIsSaving(false);

    if (!response.success) {
      setError(adminApiErrorMessage(response, "ذخیره تغییرات انجام نشد."));
      return;
    }

    setSuccess(editMode === "censor" ? "متن دیدگاه سانسور شد." : "دیدگاه ویرایش شد.");
    setEditTarget(null);
    await mutate();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError("");
    const response = await deleteAdminReview(deleteTarget.id);
    setIsDeleting(false);

    if (!response.success) {
      setError(adminApiErrorMessage(response, "حذف دیدگاه انجام نشد."));
      return;
    }

    setSuccess("دیدگاه حذف شد.");
    setDeleteTarget(null);
    await mutate();
  };

  return (
    <div dir="rtl" className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8795]">
            Moderation
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">دیدگاه‌ها</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#8ea4b3]">
            بررسی، تایید، رد، ویرایش و سانسور نظرات کاربران قبل از نمایش عمومی
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="در انتظار تایید"
          value={pendingCount !== null ? String(pendingCount) : "—"}
          icon={HiOutlineSearch}
          accentClassName="border-[#f5c518]/25 bg-[#f5c518]/10 text-[#f8d977]"
        />
        <AdminStatCard
          label="کل نتایج"
          value={String(pagination.total)}
          icon={HiOutlinePencilAlt}
          accentClassName="border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#7dd3fc]"
        />
      </div>

      <div className="rounded-[32px] border border-white/8 bg-white/[0.02] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <span className="sr-only">جستجو</span>
            <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f8795]" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="جستجو در متن یا نام کاربر..."
              className="w-full rounded-[22px] border border-white/10 bg-[#071019] py-3.5 pr-12 pl-4 text-sm text-white outline-none transition focus:border-[#38bdf8]/40"
            />
          </label>

          <label className="block min-w-[180px]">
            <span className="mb-2 block text-sm text-[#8ea4b3]">وضعیت</span>
            <AdminSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as ReviewStatus | "")}
              options={[
                { value: "", label: "همه وضعیت‌ها" },
                { value: "pending", label: "در انتظار تایید" },
                { value: "approved", label: "تایید شده" },
                { value: "rejected", label: "رد شده" },
              ]}
            />
          </label>

          <label className="block min-w-[160px]">
            <span className="mb-2 block text-sm text-[#8ea4b3]">نوع محتوا</span>
            <AdminSelect
              value={typeFilter}
              onChange={(value) => setTypeFilter(value as "movie" | "series" | "")}
              options={[
                { value: "", label: "همه" },
                { value: "movie", label: "فیلم" },
                { value: "series", label: "سریال" },
              ]}
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
          {success}
        </p>
      ) : null}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-[28px] border border-white/8 bg-white/[0.02] px-6 py-16 text-center text-[#8ea4b3]">
            در حال بارگذاری دیدگاه‌ها...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-[#8ea4b3]">
            دیدگاهی با این فیلترها پیدا نشد.
          </div>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[28px] border border-white/8 bg-white/[0.02] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${reviewStatusClass(review.status)}`}
                    >
                      {reviewStatusLabel(review.status)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#8ea4b3]">
                      {review.reviewable_type === "movie" ? "فیلم" : "سریال"}
                    </span>
                    <span className="rounded-full border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-1 text-xs font-bold text-[#fca5a5]">
                      {review.rating.toLocaleString("fa-IR")}/۱۰
                    </span>
                  </div>

                  <div>
                    <p className="text-base font-bold text-white">{review.user.name}</p>
                    <p className="text-xs text-[#6f8795]">{review.user.email}</p>
                  </div>

                  {review.content_title && review.content_slug ? (
                    <Link
                      href={`/${review.reviewable_type === "movie" ? "movies" : "series"}/${review.content_slug}`}
                      className="inline-flex text-sm text-[#7dd3fc] transition hover:text-[#bae6fd]"
                    >
                      {review.content_title}
                    </Link>
                  ) : (
                    <p className="text-sm text-[#8ea4b3]">محتوای نامشخص</p>
                  )}

                  <p className="text-xs text-[#6f8795]">
                    ثبت: {formatGregorianDate(review.created_at)}
                    {review.moderated_at
                      ? ` · بررسی: ${formatGregorianDate(review.moderated_at)}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {review.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={actionId === review.id}
                        onClick={() => void handleApprove(review)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-2.5 text-sm font-semibold text-[#86efac] transition hover:bg-[#34d399]/16 disabled:opacity-60"
                      >
                        <HiOutlineCheck className="h-4 w-4" />
                        تایید
                      </button>
                      <button
                        type="button"
                        disabled={actionId === review.id}
                        onClick={() => void handleReject(review)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-2.5 text-sm font-semibold text-[#fca5a5] transition hover:bg-[#f87171]/16 disabled:opacity-60"
                      >
                        <HiOutlineX className="h-4 w-4" />
                        رد
                      </button>
                    </>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => openEditModal(review, "edit")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
                  >
                    <HiOutlinePencilAlt className="h-4 w-4" />
                    ویرایش
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(review, "censor")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#f5c518]/25 bg-[#f5c518]/10 px-4 py-2.5 text-sm font-semibold text-[#f8d977] transition hover:bg-[#f5c518]/16"
                  >
                    سانسور
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(review)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#f87171]/20 px-4 py-2.5 text-sm font-semibold text-[#fca5a5] transition hover:bg-[#f87171]/10"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                    حذف
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-[22px] border border-white/8 bg-[#071019]/70 p-4">
                <p className="text-sm leading-8 text-white/85 whitespace-pre-wrap">
                  {review.body || "—"}
                </p>

                {review.body_original ? (
                  <div className="rounded-[18px] border border-[#f5c518]/20 bg-[#f5c518]/5 p-3">
                    <p className="text-xs font-semibold text-[#f8d977]">متن اصلی (قبل از سانسور)</p>
                    <p className="mt-2 text-sm leading-7 text-white/65 whitespace-pre-wrap">
                      {review.body_original}
                    </p>
                  </div>
                ) : null}

                {review.admin_note ? (
                  <p className="text-xs text-[#8ea4b3]">
                    یادداشت ادمین: {review.admin_note}
                  </p>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      <AdminPagination
        pagination={{
          current_page: pagination.current_page,
          last_page: pagination.last_page,
          per_page: pagination.per_page,
          total: pagination.total,
        }}
        onPageChange={setPage}
        disabled={loading}
      />

      {editTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editMode === "censor" ? "سانسور دیدگاه" : "ویرایش دیدگاه"}
        >
          <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0b1118] p-6">
            <h3 className="text-xl font-black text-white">
              {editMode === "censor" ? "سانسور دیدگاه" : "ویرایش دیدگاه"}
            </h3>
            <p className="mt-2 text-sm text-[#8ea4b3]">
              {editMode === "censor"
                ? "متن اصلی ذخیره می‌شود و نسخه ویرایش‌شده برای کاربران نمایش داده می‌شود."
                : "امتیاز و متن دیدگاه را اصلاح کنید."}
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">امتیاز</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={editRating}
                  onChange={(event) => setEditRating(Number(event.target.value))}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">متن دیدگاه</label>
                <textarea
                  value={editBody}
                  onChange={(event) => setEditBody(event.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">یادداشت ادمین</label>
                <input
                  value={editNote}
                  onChange={(event) => setEditNote(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSaveEdit()}
                className="rounded-2xl bg-[#38bdf8] px-5 py-3 text-sm font-bold text-[#041018] disabled:opacity-60"
              >
                {isSaving ? "در حال ذخیره..." : "ذخیره"}
              </button>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/70"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminDeleteConfirmModal
        open={deleteTarget !== null}
        kind="movie"
        title={deleteTarget?.user.name ?? "دیدگاه"}
        loading={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
