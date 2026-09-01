"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HiOutlineArrowRight, HiOutlinePlus } from "react-icons/hi";
import ProtectedRoute from "../components/ProtectedRoute";
import ProfileShell from "../components/profile/ProfileShell";
import RequestsShellSkeleton from "../components/skeletons/RequestsShellSkeleton";
import {
  contentRequestStatusLabels,
  fetchUserContentRequests,
  type ContentRequest,
  type ContentRequestStatus,
} from "../lib/content-requests";
import { formatAfghanShamsiDateTime } from "../lib/date-format";

const statusOptions: Array<{ value: ContentRequestStatus | ""; label: string }> = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "pending", label: contentRequestStatusLabels.pending },
  { value: "in_progress", label: contentRequestStatusLabels.in_progress },
  { value: "fulfilled", label: contentRequestStatusLabels.fulfilled },
  { value: "rejected", label: contentRequestStatusLabels.rejected },
];

function formatDate(value: string): string {
  return formatAfghanShamsiDateTime(value);
}

function statusClassName(status: ContentRequest["status"]): string {
  switch (status) {
    case "fulfilled":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
    case "in_progress":
      return "border-sky-400/30 bg-sky-400/10 text-sky-200";
    case "rejected":
      return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    default:
      return "border-[#f5c518]/30 bg-[#f5c518]/10 text-[#f8d977]";
  }
}

function RequestsPageContent() {
  const router = useRouter();
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<ContentRequestStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");

      const response = await fetchUserContentRequests(
        1,
        20,
        statusFilter || undefined,
      );

      if (cancelled) {
        return;
      }

      if (!response.success || !response.data) {
        setError(response.message || "دریافت درخواست‌ها انجام نشد.");
        setRequests([]);
      } else {
        setRequests(response.data.requests);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const emptyState = useMemo(
    () => !loading && !error && requests.length === 0,
    [error, loading, requests.length],
  );

  return (
    <ProfileShell active="requests">
      <div className="mx-auto max-w-4xl px-4 text-white md:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-3 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
            >
              <HiOutlineArrowRight className="h-4 w-4" />
              بازگشت
            </button>
            <h1 className="text-3xl font-black">درخواست‌های من</h1>
            <p className="mt-2 text-sm text-white/60">
              فیلم یا سریالی که در سایت نیست را درخواست دهید تا بررسی شود.
            </p>
          </div>

          <Link
            href="/requests/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-bold text-[#12100a] transition hover:bg-[#e8bb0d]"
          >
            <HiOutlinePlus className="h-5 w-5" />
            درخواست جدید
          </Link>
        </div>

        <div className="mb-6 max-w-xs">
          <label className="mb-2 block text-sm text-white/60">فیلتر وضعیت</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ContentRequestStatus | "")}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#f5c518]/35"
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value} className="bg-[#121212]">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#f5c518]" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-rose-400/25 bg-rose-400/10 px-5 py-4 text-rose-100">
            {error}
          </div>
        ) : null}

        {emptyState ? (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
            <p className="text-lg font-bold text-white/85">
              {statusFilter ? "درخواستی با این وضعیت یافت نشد." : "هنوز درخواستی ثبت نکرده‌اید."}
            </p>
            <p className="mt-2 text-sm text-white/55">
              {statusFilter
                ? "فیلتر دیگری انتخاب کنید یا درخواست جدید ثبت کنید."
                : "با ثبت درخواست جدید، تیم ما عنوان مورد نظر شما را بررسی می‌کند."}
            </p>
            {!statusFilter ? (
              <Link
                href="/requests/new"
                className="mt-6 inline-flex rounded-2xl bg-[#f5c518] px-6 py-3 text-sm font-bold text-[#12100a] transition hover:bg-[#e8bb0d]"
              >
                ثبت اولین درخواست
              </Link>
            ) : null}
          </div>
        ) : null}

        {!loading && !error && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-bold text-white">{request.title}</h2>
                    <p className="mt-1 text-sm text-white/55">{request.genre_name}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName(request.status)}`}
                  >
                    {contentRequestStatusLabels[request.status]}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/78">
                  {request.description}
                </p>

                {request.admin_note ? (
                  <div className="mt-4 rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white/70">
                    <p className="mb-1 text-xs font-bold text-[#f8d977]">پاسخ تیم:</p>
                    {request.admin_note}
                  </div>
                ) : null}

                <p className="mt-4 text-xs text-white/40">{formatDate(request.created_at)}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </ProfileShell>
  );
}

export default function RequestsPage() {
  return (
    <ProtectedRoute requireViewer fallback={<RequestsShellSkeleton variant="list" />}>
      <RequestsPageContent />
    </ProtectedRoute>
  );
}
