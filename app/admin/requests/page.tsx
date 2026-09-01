"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { HiOutlineSearch } from "react-icons/hi";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminPermissionGate from "../../components/admin/AdminPermissionGate";
import AdminSelect from "../../components/admin/AdminSelect";
import { ADMIN_PERMISSIONS } from "../../lib/admin-permissions";
import { adminApiErrorMessage } from "../../lib/admin-api";
import {
  fetchAdminContentRequests,
  updateAdminContentRequest,
  type AdminContentRequest,
} from "../../lib/admin-content-requests";
import {
  contentRequestStatusLabels,
  type ContentRequestStatus,
} from "../../lib/content-requests";
import { formatAfghanShamsiDateTime } from "../../lib/date-format";

const statusOptions: Array<{ value: ContentRequestStatus | ""; label: string }> = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "pending", label: contentRequestStatusLabels.pending },
  { value: "in_progress", label: contentRequestStatusLabels.in_progress },
  { value: "fulfilled", label: contentRequestStatusLabels.fulfilled },
  { value: "rejected", label: contentRequestStatusLabels.rejected },
];

export default function AdminRequestsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const listKey = useMemo(() => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (statusFilter) query.set("status", statusFilter);
    return `admin-content-requests:${query.toString()}`;
  }, [page, debouncedSearch, statusFilter]);

  const { data, isLoading, mutate, error: swrError } = useSWR(
    listKey,
    () =>
      fetchAdminContentRequests({
        page,
        search: debouncedSearch,
        status: statusFilter || undefined,
      }),
    { revalidateOnFocus: false },
  );

  const requests = (data?.requests ?? []) as AdminContentRequest[];
  const pagination = data?.pagination ?? {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  };

  const handleStatusChange = async (
    request: AdminContentRequest,
    status: ContentRequestStatus,
  ) => {
    setError("");
    setSuccess("");
    setActionId(request.id);

    const response = await updateAdminContentRequest(request.id, { status });

    setActionId(null);

    if (!response.success) {
      setError(adminApiErrorMessage(response, "به‌روزرسانی درخواست انجام نشد."));
      return;
    }

    setSuccess("وضعیت درخواست به‌روزرسانی شد.");
    await mutate();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">درخواست‌ها</h1>
        <p className="mt-2 text-sm text-white/55">
          درخواست‌های کاربران برای افزودن فیلم یا سریال
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative block">
          <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => {
              setPage(1);
              setSearchInput(event.target.value);
            }}
            placeholder="جستجو در عنوان، توضیحات یا کاربر..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-4 pr-12 text-white outline-none focus:border-[#f5c518]/40"
          />
        </label>

        <AdminSelect
          value={statusFilter}
          onChange={(value) => {
            setPage(1);
            setStatusFilter(value as ContentRequestStatus | "");
          }}
          options={statusOptions}
        />
      </div>

      {swrError ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {swrError instanceof Error ? swrError.message : "دریافت درخواست‌ها انجام نشد."}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-white/55">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">عنوان</th>
                <th className="px-4 py-3 text-right font-semibold">کاربر</th>
                <th className="px-4 py-3 text-right font-semibold">ژانر</th>
                <th className="px-4 py-3 text-right font-semibold">وضعیت</th>
                <th className="px-4 py-3 text-right font-semibold">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-white/45">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : null}

              {!isLoading && requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-white/45">
                    درخواستی یافت نشد.
                  </td>
                </tr>
              ) : null}

              {requests.map((request) => (
                <tr key={request.id} className="border-b border-white/6 align-top">
                  <td className="px-4 py-4">
                    <p className="font-bold text-white">{request.title}</p>
                    <p className="mt-2 max-w-xl whitespace-pre-wrap text-white/65">
                      {request.description}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-white/75">
                    <p>{request.user?.name ?? "—"}</p>
                    <p className="mt-1 text-xs text-white/40">{request.user?.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-4 text-white/75">{request.genre_name}</td>
                  <td className="px-4 py-4">
                    <AdminPermissionGate
                      permission={ADMIN_PERMISSIONS.manage_requests}
                      fallback={
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                          {statusOptions.find((option) => option.value === request.status)?.label ??
                            request.status}
                        </span>
                      }
                    >
                      <select
                        value={request.status}
                        disabled={actionId === request.id}
                        onChange={(event) =>
                          void handleStatusChange(
                            request,
                            event.target.value as ContentRequestStatus,
                          )
                        }
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
                      >
                        {statusOptions
                          .filter((option) => option.value !== "")
                          .map((option) => (
                            <option key={option.value} value={option.value} className="bg-[#121212]">
                              {option.label}
                            </option>
                          ))}
                      </select>
                    </AdminPermissionGate>
                  </td>
                  <td className="px-4 py-4 text-white/55">
                    {formatAfghanShamsiDateTime(request.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        pagination={{
          current_page: pagination.current_page,
          last_page: pagination.last_page,
          per_page: pagination.per_page,
          total: pagination.total,
        }}
        onPageChange={setPage}
      />
    </div>
  );
}
