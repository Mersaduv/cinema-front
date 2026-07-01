"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineCalendar,
  HiOutlineMail,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineUserCircle,
} from "react-icons/hi";
import {
  adminUsersService,
  type AdminRoleOption,
  type AdminStatusOption,
  type AdminUser,
  type AdminUsersPagination,
  type AdminUsersSummary,
} from "../../lib/admin-users";
import { formatAfghanShamsiDate } from "../../lib/date-format";
import AdminPagination from "../../components/admin/AdminPagination";
import AdminStatCard from "../../components/admin/AdminStatCard";
import AdminSelect from "../../components/admin/AdminSelect";

const defaultSummary: AdminUsersSummary = {
  total_users: 0,
  active_users: 0,
  admins: 0,
  support_users: 0,
};

const defaultPagination: AdminUsersPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 12,
  total: 0,
};

const rolePresentation: Record<string, string> = {
  admin: "مدیر پنل",
  support: "پشتیبان",
  user: "کاربر عادی",
};

const statusPresentation: Record<"active" | "banned", string> = {
  active: "فعال",
  banned: "مسدود",
};

function getRoleBadge(roleSlug: string) {
  switch (roleSlug) {
    case "admin":
      return "border-[#f5c518]/25 bg-[#f5c518]/15 text-[#f8d977]";
    case "support":
      return "border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#7dd3fc]";
    default:
      return "border-white/10 bg-white/[0.06] text-[#d2dee5]";
  }
}

function getRoleLabel(roleSlug: string, fallbackName: string) {
  return rolePresentation[roleSlug] ?? fallbackName;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [statuses, setStatuses] = useState<AdminStatusOption[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummary>(defaultSummary);
  const [pagination, setPagination] =
    useState<AdminUsersPagination>(defaultPagination);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const roleFilterOptions = [
    {
      value: "",
      label: "همه نقش‌ها",
      description: "نمایش همه کاربران بدون محدودیت نقش",
    },
    ...roles.map((role) => ({
      value: role.slug,
      label: getRoleLabel(role.slug, role.name),
      description: role.description || "نقش ثابت تعریف‌شده در backend",
      meta: role.slug,
    })),
  ];
  const statusFilterOptions = [
    {
      value: "",
      label: "همه وضعیت‌ها",
      description: "نمایش کاربران فعال و مسدود به‌صورت هم‌زمان",
    },
    ...statuses.map((status) => ({
      value: status.value,
      label: statusPresentation[status.value],
      description:
        status.value === "active"
          ? "فقط کاربرانی که اجازه ورود دارند"
          : "فقط حساب‌های مسدودشده",
      meta: status.value,
    })),
  ];

  const loadUsers = useCallback(
    async (page = 1, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await adminUsersService.list({
        page,
        search: debouncedSearch,
        role: selectedRole,
        status: selectedStatus,
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setRoles(response.data.roles);
        setStatuses(response.data.statuses);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || "دریافت کاربران با خطا روبه‌رو شد.");
      }

      setLoading(false);
      setRefreshing(false);
    },
    [debouncedSearch, selectedRole, selectedStatus]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers(1);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedRole("");
    setSelectedStatus("");
  };

  const statCards = [
    {
      label: "کل کاربران",
      value: summary.total_users,
      icon: HiOutlineUserGroup,
      accent: "border-[#f5c518]/18 bg-[#f5c518]/10 text-[#f8d977]",
    },
    {
      label: "کاربران فعال",
      value: summary.active_users,
      icon: HiOutlineShieldCheck,
      accent: "border-[#34d399]/18 bg-[#34d399]/10 text-[#86efac]",
    },
    {
      label: "ادمین‌ها",
      value: summary.admins,
      icon: HiOutlineShieldCheck,
      accent: "border-[#38bdf8]/18 bg-[#38bdf8]/10 text-[#7dd3fc]",
    },
    {
      label: "پشتیبان‌ها",
      value: summary.support_users,
      icon: HiOutlineMail,
      accent: "border-[#fb7185]/18 bg-[#fb7185]/10 text-[#fda4af]",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">کاربران</h1>
            <p className="mt-2 text-sm text-[#8ea4b3]">مدیریت حساب‌های پنل</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/users/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
            >
              <HiOutlinePlus className="h-4 w-4" />
              ایجاد کاربر
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          return (
            <AdminStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              accentClassName={card.accent}
            />
          );
        })}
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr_0.9fr_auto]">
          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">
              جست‌وجو بر اساس نام یا ایمیل
            </span>
            <div className="relative">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="مثلاً admin@cinema.local"
                className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-4 pr-11 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/50 focus:bg-white/6"
              />
              <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b909d]" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">فیلتر نقش</span>
            <AdminSelect
              value={selectedRole}
              onChange={setSelectedRole}
              options={roleFilterOptions}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">فیلتر وضعیت</span>
            <AdminSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusFilterOptions}
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
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
            <h3 className="text-xl font-bold text-white">لیست کاربران</h3>
            <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
              نقش هر کاربر در همین بخش دیده می‌شود و هنگام ساخت، نقش از بین سه
              نقش ثابت سیستم تعیین می‌شود.
            </p>
          </div>
          <p className="rounded-full border border-white/10 bg-white/3 px-3 py-1 text-xs text-[#b6c5cf]">
            {pagination.total} کاربر
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/3">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/3">
                  <tr className="text-right text-xs text-[#7f95a3]">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <th key={index} className="px-5 py-4">
                        <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <td key={cellIndex} className="px-5 py-4">
                          <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/12 bg-white/2 px-6 py-12 text-center">
            <h4 className="text-xl font-bold text-white">کاربری پیدا نشد</h4>
            <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
              فیلترها را تغییر بده یا اولین کاربر جدید را از همین پنل ایجاد کن.
            </p>
            <Link
              href="/admin/users/create"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400]"
            >
              <HiOutlinePlus className="h-4 w-4" />
              ایجاد اولین کاربر
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#f8d977]">
                        <HiOutlineUserCircle className="h-8 w-8" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-lg font-bold text-white">{user.name}</h4>
                        <p className="mt-1 flex items-center gap-2 text-sm text-[#b7c7d1]">
                          <HiOutlineMail className="h-4 w-4 shrink-0 text-[#7dd3fc]" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs ${
                        user.status === "active"
                          ? "bg-[#34d399]/10 text-[#86efac]"
                          : "bg-[#fb7185]/10 text-[#fecdd3]"
                      }`}
                    >
                      {statusPresentation[user.status]}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <span
                        key={role.id}
                        className={`rounded-full border px-3 py-1 text-xs ${getRoleBadge(role.slug)}`}
                      >
                        {getRoleLabel(role.slug, role.name)}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <p className="text-xs text-[#8ea4b3]">شناسه کاربر</p>
                      <p className="mt-1 text-sm font-semibold text-white">#{user.id}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <p className="flex items-center gap-2 text-xs text-[#8ea4b3]">
                        <HiOutlineCalendar className="h-4 w-4" />
                        تاریخ ایجاد
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatAfghanShamsiDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <AdminPagination
              pagination={pagination}
              disabled={loading || refreshing}
              onPageChange={(page) => void loadUsers(page)}
            />
          </>
        )}
      </section>
    </div>
  );
}
