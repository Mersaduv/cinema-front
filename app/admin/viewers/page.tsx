"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineCalendar,
  HiOutlineMail,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineUserCircle,
  HiOutlineUserGroup,
} from "react-icons/hi";
import {
  adminViewersService,
  type AdminStatusOption,
  type AdminViewer,
  type AdminViewersPagination,
  type AdminViewersSummary,
} from "../../lib/admin-viewers";
import { formatAfghanShamsiDate } from "../../lib/date-format";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminPermissionGate from "../../components/admin/AdminPermissionGate";
import AdminStatCard from "../../components/admin/AdminStatCard";
import AdminSelect from "../../components/admin/AdminSelect";
import { ADMIN_PERMISSIONS } from "../../lib/admin-permissions";

const defaultSummary: AdminViewersSummary = {
  total_viewers: 0,
  active_viewers: 0,
  banned_viewers: 0,
};

const defaultPagination: AdminViewersPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 12,
  total: 0,
};

const statusPresentation: Record<"active" | "banned", string> = {
  active: "فعال",
  banned: "مسدود",
};

export default function AdminViewersPage() {
  const [viewers, setViewers] = useState<AdminViewer[]>([]);
  const [statuses, setStatuses] = useState<AdminStatusOption[]>([]);
  const [summary, setSummary] = useState<AdminViewersSummary>(defaultSummary);
  const [pagination, setPagination] =
    useState<AdminViewersPagination>(defaultPagination);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const statusFilterOptions = [
    {
      value: "",
      label: "همه وضعیت‌ها",
      description: "نمایش بینندگان فعال و مسدود",
    },
    ...statuses.map((status) => ({
      value: status.value,
      label: statusPresentation[status.value],
      description:
        status.value === "active"
          ? "فقط بینندگانی که اجازه ورود دارند"
          : "فقط حساب‌های مسدودشده",
      meta: status.value,
    })),
  ];

  const loadViewers = useCallback(
    async (page = 1, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await adminViewersService.list({
        page,
        search: debouncedSearch,
        status: selectedStatus,
      });

      if (response.success && response.data) {
        setViewers(response.data.viewers);
        setStatuses(response.data.statuses);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || "دریافت بیننده‌ها با خطا روبه‌رو شد.");
      }

      setLoading(false);
      setRefreshing(false);
    },
    [debouncedSearch, selectedStatus],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadViewers(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadViewers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const handleToggleStatus = async (viewer: AdminViewer) => {
    const nextStatus = viewer.status === "active" ? "banned" : "active";
    setStatusUpdatingId(viewer.id);
    setError("");

    const response = await adminViewersService.updateStatus(viewer.id, nextStatus);

    if (response.success && response.data) {
      setViewers((current) =>
        current.map((item) =>
          item.id === viewer.id ? response.data!.viewer : item,
        ),
      );
      void loadViewers(pagination.current_page, true);
    } else {
      setError(response.message || "به‌روزرسانی وضعیت ناموفق بود.");
    }

    setStatusUpdatingId(null);
  };

  const statCards = [
    {
      label: "کل بیننده‌ها",
      value: summary.total_viewers,
      icon: HiOutlineUserGroup,
      accent: "border-[#f5c518]/18 bg-[#f5c518]/10 text-[#f8d977]",
    },
    {
      label: "فعال",
      value: summary.active_viewers,
      icon: HiOutlineUserCircle,
      accent: "border-[#34d399]/18 bg-[#34d399]/10 text-[#86efac]",
    },
    {
      label: "مسدود",
      value: summary.banned_viewers,
      icon: HiOutlineMail,
      accent: "border-[#fb7185]/18 bg-[#fb7185]/10 text-[#fecdd3]",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">بیننده‌ها</h1>
            <p className="mt-2 text-sm text-[#8ea4b3]">
              حساب‌های مخاطب سایت؛ ثبت‌نام عمومی فقط برای این بخش است.
            </p>
          </div>

          <AdminPermissionGate permission={ADMIN_PERMISSIONS.create_viewers}>
            <Link
              href="/admin/viewers/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
            >
              <HiOutlinePlus className="h-4 w-4" />
              ایجاد بیننده
            </Link>
          </AdminPermissionGate>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
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
        <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">
              جست‌وجو بر اساس نام یا ایمیل
            </span>
            <div className="relative">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="مثلاً viewer@example.com"
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-4 pr-11 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/50 focus:bg-white/6"
              />
              <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b909d]" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">فیلتر وضعیت</span>
            <AdminSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusFilterOptions}
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setDebouncedSearch("");
                setSelectedStatus("");
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/8"
            >
              پاکسازی
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">لیست بیننده‌ها</h3>
            <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
              این حساب‌ها به پروفایل، تیکت، درخواست و پیشرفت تماشا دسترسی دارند.
            </p>
          </div>
          <p className="rounded-full border border-white/10 bg-white/3 px-3 py-1 text-xs text-[#b6c5cf]">
            {pagination.total} بیننده
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
                className="h-40 animate-pulse rounded-[28px] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : viewers.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/12 bg-white/2 px-6 py-12 text-center">
            <h4 className="text-xl font-bold text-white">بیننده‌ای پیدا نشد</h4>
            <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
              هنوز حساب بیننده‌ای ثبت نشده است.
            </p>
            <AdminPermissionGate permission={ADMIN_PERMISSIONS.create_viewers}>
              <Link
                href="/admin/viewers/create"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
              >
                <HiOutlinePlus className="h-4 w-4" />
                ایجاد اولین بیننده
              </Link>
            </AdminPermissionGate>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {viewers.map((viewer) => (
                <article
                  key={viewer.id}
                  className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#f8d977]">
                        <HiOutlineUserCircle className="h-8 w-8" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-lg font-bold text-white">
                          {viewer.name}
                        </h4>
                        <p className="mt-1 flex items-center gap-2 text-sm text-[#b7c7d1]">
                          <HiOutlineMail className="h-4 w-4 shrink-0 text-[#7dd3fc]" />
                          <span className="truncate">{viewer.email}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs ${
                        viewer.status === "active"
                          ? "bg-[#34d399]/10 text-[#86efac]"
                          : "bg-[#fb7185]/10 text-[#fecdd3]"
                      }`}
                    >
                      {statusPresentation[viewer.status]}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <p className="text-xs text-[#8ea4b3]">شناسه بیننده</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        #{viewer.id}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <p className="flex items-center gap-2 text-xs text-[#8ea4b3]">
                        <HiOutlineCalendar className="h-4 w-4" />
                        تاریخ ایجاد
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatAfghanShamsiDate(viewer.created_at)}
                      </p>
                    </div>
                  </div>

                  <AdminPermissionGate permission={ADMIN_PERMISSIONS.manage_viewers}>
                    <button
                      type="button"
                      disabled={statusUpdatingId === viewer.id || refreshing}
                      onClick={() => void handleToggleStatus(viewer)}
                      className="mt-4 inline-flex rounded-2xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white transition hover:bg-white/8 disabled:opacity-50"
                    >
                      {viewer.status === "active" ? "مسدود کردن" : "فعال‌سازی"}
                    </button>
                  </AdminPermissionGate>
                </article>
              ))}
            </div>
            <AdminPagination
              pagination={pagination}
              disabled={loading || refreshing}
              onPageChange={(page) => void loadViewers(page)}
            />
          </>
        )}
      </section>
    </div>
  );
}
