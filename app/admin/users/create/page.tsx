"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineSparkles,
} from "react-icons/hi";
import {
  adminUsersService,
  type AdminPermissionTreeGroup,
  type AdminRoleOption,
  type AdminStatusOption,
} from "../../../lib/admin-users";
import AdminSelect from "../../../components/admin/AdminSelect";

const initialForm = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role_slug: "",
  status: "active" as "active" | "banned",
};

const rolePresentation: Record<
  string,
  { label: string; hint: string }
> = {
  admin: {
    label: "مدیر",
    hint: "دسترسی کامل به داشبورد، کاربران و عملیات مدیریتی",
  },
  media: {
    label: "مدیا",
    hint: "مدیریت مدیا و عملیات ساخت/ویرایش/انتشار فیلم/سریال",
  },
  support: {
    label: "پشتیبانی",
    hint: "پیگیری، بررسی و دسترسی محدود مدیریتی",
  },
};

const statusPresentation: Record<
  "active" | "banned",
  { label: string; hint: string; badgeClassName: string }
> = {
  active: {
    label: "فعال",
    hint: "",
    badgeClassName:
      "border-[#34d399]/25 bg-[#34d399]/12 text-[#86efac]",
  },
  banned: {
    label: "مسدود",
    hint: "حساب ساخته می‌شود اما تا تغییر وضعیت، امکان ورود نخواهد داشت.",
    badgeClassName:
      "border-[#fb7185]/25 bg-[#fb7185]/12 text-[#fecdd3]",
  },
};

function getRoleDefaultPermissions(
  roles: AdminRoleOption[],
  roleSlug: string,
): string[] {
  const role = roles.find((item) => item.slug === roleSlug);
  return role?.permission_slugs ? [...role.permission_slugs] : [];
}

export default function CreateAdminUserPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [statuses, setStatuses] = useState<AdminStatusOption[]>([]);
  const [permissionTree, setPermissionTree] = useState<AdminPermissionTreeGroup[]>(
    [],
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      const response = await adminUsersService.options();

      if (response.success && response.data) {
        const loadedRoles = response.data.roles;
        const defaultRole =
          loadedRoles.find((role) => role.slug === "media") ?? loadedRoles[0];

        setRoles(loadedRoles);
        setStatuses(response.data.statuses);
        setPermissionTree(response.data.permission_tree ?? []);

        if (defaultRole) {
          setForm((current) => ({
            ...current,
            role_slug: defaultRole.slug,
          }));
          setSelectedPermissions(
            getRoleDefaultPermissions(loadedRoles, defaultRole.slug),
          );
        }
      } else {
        setError(response.message || "دریافت اطلاعات فرم با خطا روبه‌رو شد.");
      }

      setLoading(false);
    };

    void loadOptions();
  }, []);

  const selectedRolePresentation =
    rolePresentation[form.role_slug] ?? null;
  const selectedStatusPresentation = statusPresentation[form.status];

  const roleOptions = roles.map((role) => {
    const copy = rolePresentation[role.slug] ?? {
      label: role.name,
      hint: role.description || "نقش پنل",
    };

    return {
      value: role.slug,
      label: copy.label,
      description: copy.hint,
      meta: role.slug,
    };
  });

  const statusOptions = statuses.map((status) => {
    const copy = statusPresentation[status.value];

    return {
      value: status.value,
      label: copy.label,
      description: copy.hint,
      meta: status.value,
    };
  });

  const enabledPermissionCount = useMemo(
    () => selectedPermissions.length,
    [selectedPermissions],
  );

  const totalPermissionCount = useMemo(
    () =>
      permissionTree.reduce(
        (count, group) => count + group.permissions.length,
        0,
      ),
    [permissionTree],
  );

  const handleChange = (
    field: keyof typeof initialForm,
    value: (typeof initialForm)[keyof typeof initialForm],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleRoleChange = (roleSlug: string) => {
    handleChange("role_slug", roleSlug);
    setSelectedPermissions(getRoleDefaultPermissions(roles, roleSlug));
  };

  const togglePermission = (permissionSlug: string) => {
    setSelectedPermissions((current) =>
      current.includes(permissionSlug)
        ? current.filter((slug) => slug !== permissionSlug)
        : [...current, permissionSlug],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!form.role_slug) {
      setError("لطفاً یک نقش انتخاب کنید.");
      return;
    }

    if (selectedPermissions.length === 0) {
      setError("حداقل یک دسترسی باید فعال باشد.");
      return;
    }

    setSubmitting(true);

    const response = await adminUsersService.create({
      ...form,
      permission_slugs: selectedPermissions,
    });

    if (response.success) {
      setSuccessMessage("کاربر با موفقیت ایجاد شد.");
      setForm(initialForm);
      setSelectedPermissions([]);
      window.setTimeout(() => {
        router.push("/admin/users");
      }, 1200);
    } else {
      const firstError = response.errors
        ? Object.values(response.errors)[0]?.[0]
        : undefined;

      setError(firstError || response.message || "ایجاد کاربر انجام نشد.");
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(140deg,rgba(56,189,248,0.14),rgba(8,16,24,0.96)_40%,rgba(245,197,24,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-3 py-1 text-xs text-[#7dd3fc]">
              <HiOutlineSparkles className="h-4 w-4" />
              فرم ایجاد کاربر
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
              ساخت کاربر پنل
            </h2>
          </div>

          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            بازگشت به کاربران
            <HiOutlineArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <h3 className="text-xl font-bold text-white">اطلاعات کاربر</h3>
        <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
          فیلدها را کامل کن؛ نقش فقط یک‌بار انتخاب می‌شود و دسترسی‌ها از همان
          نقش به‌صورت پیش‌فرض بارگذاری می‌شوند.
        </p>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
            <HiOutlineCheckCircle className="h-5 w-5" />
            {successMessage}
          </div>
        ) : null}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">نام</span>
              <input
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="مثلاً محمد احمدی"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">ایمیل</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="user@cinema.local"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                required
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">رمز عبور</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => handleChange("password", event.target.value)}
                placeholder="حداقل ۸ کاراکتر"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">تکرار رمز عبور</span>
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(event) =>
                  handleChange("password_confirmation", event.target.value)
                }
                placeholder="رمز عبور را دوباره وارد کن"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                required
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">نقش</span>
              <AdminSelect
                value={form.role_slug}
                onChange={handleRoleChange}
                options={roleOptions}
                placeholder="انتخاب نقش"
                disabled={loading}
              />
              {selectedRolePresentation ? (
                <p className="mt-2 text-xs leading-6 text-[#7f94a2]">
                  {selectedRolePresentation.hint}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">وضعیت حساب</span>
              <AdminSelect
                value={form.status}
                onChange={(value) =>
                  handleChange("status", value as "active" | "banned")
                }
                options={statusOptions}
                disabled={loading}
              />
              <p className="mt-2 text-xs leading-6 text-[#7f94a2]">
                {selectedStatusPresentation.hint}
              </p>
            </label>
          </div>

          {form.role_slug ? (
            <section className="rounded-[28px] border border-[#38bdf8]/20 bg-[#08121a] p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold text-white"> دسترسی‌ها</h4>
                  <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
                    دسترسی‌های پیش‌فرض نقش
                    {" "}
                    <span className="text-[#7dd3fc]">
                      {selectedRolePresentation?.label ?? form.role_slug}
                    </span>
                    {" "}
                    بارگذاری شده‌اند. با دکمه‌های کم/زیاد، هر permission را
                    جداگانه فعال یا غیرفعال کنید.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-[#b6c5cf]">
                  {enabledPermissionCount}/{totalPermissionCount} فعال
                </span>
              </div>

              <div className="relative mt-6 mr-3 space-y-4 border-r-2 border-[#38bdf8]/25 pr-8">
                {permissionTree.map((group) => {
                  const groupEnabledCount = group.permissions.filter((item) =>
                    selectedPermissions.includes(item.slug),
                  ).length;

                  return (
                    <div key={group.id} className="relative">
                      <span className="absolute -right-[41px] top-5 h-3.5 w-3.5 rounded-full border-2 border-[#07131b] bg-[#38bdf8]" />

                      <details open className="group">
                        <summary className="cursor-pointer list-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-white">
                              {group.label}
                            </span>
                            <span className="text-xs text-[#8ea4b3]">
                              {groupEnabledCount}/{group.permissions.length}
                            </span>
                          </div>
                        </summary>

                        <div className="relative mt-3 mr-3 space-y-2 border-r border-white/10 pr-5">
                          {group.permissions.map((permission) => {
                            const enabled = selectedPermissions.includes(
                              permission.slug,
                            );

                            return (
                              <div
                                key={permission.slug}
                                className={`relative flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
                                  enabled
                                    ? "border-[#34d399]/25 bg-[#34d399]/10"
                                    : "border-white/10 bg-white/[0.02]"
                                }`}
                              >
                                <span className="absolute -right-[26px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white/25" />

                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white">
                                    {permission.name}
                                  </p>
                                  {permission.description ? (
                                    <p className="mt-1 text-xs leading-5 text-[#8ea4b3]">
                                      {permission.description}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  <span
                                    className={`text-xs ${
                                      enabled
                                        ? "text-[#86efac]"
                                        : "text-[#7f94a2]"
                                    }`}
                                  >
                                    {enabled ? "فعال" : "غیرفعال"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePermission(permission.slug)
                                    }
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                                      enabled
                                        ? "border-[#fb7185]/25 bg-[#fb7185]/10 text-[#fecdd3] hover:bg-[#fb7185]/16"
                                        : "border-[#34d399]/25 bg-[#34d399]/10 text-[#86efac] hover:bg-[#34d399]/16"
                                    }`}
                                    aria-label={
                                      enabled
                                        ? `غیرفعال کردن ${permission.name}`
                                        : `فعال کردن ${permission.name}`
                                    }
                                  >
                                    {enabled ? (
                                      <HiOutlineMinus className="h-4 w-4" />
                                    ) : (
                                      <HiOutlinePlus className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || loading || !form.role_slug}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "در حال ایجاد..." : "ایجاد کاربر"}
            </button>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              انصراف
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
