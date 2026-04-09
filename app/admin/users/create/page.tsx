"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from "react-icons/hi";
import {
  adminUsersService,
  type AdminRoleOption,
  type AdminStatusOption,
} from "../../../lib/admin-users";
import AdminSelect from "../../../components/admin/AdminSelect";

const initialForm = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role_slug: "user",
  status: "active" as "active" | "banned",
};

const rolePresentation: Record<
  string,
  { label: string; hint: string; badgeClassName: string }
> = {
  admin: {
    label: "مدیر پنل",
    hint: "دسترسی کامل به داشبورد، کاربران و عملیات مدیریتی",
    badgeClassName:
      "border-[#f5c518]/25 bg-[#f5c518]/12 text-[#f8d977]",
  },
  support: {
    label: "پشتیبان",
    hint: "برای پیگیری، بررسی و دسترسی محدود مدیریتی",
    badgeClassName:
      "border-[#38bdf8]/25 bg-[#38bdf8]/12 text-[#7dd3fc]",
  },
  user: {
    label: "کاربر عادی",
    hint: "دسترسی کاربری معمول و استفاده از بخش تماشا",
    badgeClassName: "border-white/10 bg-white/[0.05] text-white",
  },
};

const statusPresentation: Record<
  "active" | "banned",
  { label: string; hint: string; badgeClassName: string }
> = {
  active: {
    label: "فعال",
    hint: "کاربر بعد از ساخت، امکان ورود و استفاده از سیستم را دارد.",
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

export default function CreateAdminUserPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [statuses, setStatuses] = useState<AdminStatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      const response = await adminUsersService.options();

      if (response.success && response.data) {
        setRoles(response.data.roles);
        setStatuses(response.data.statuses);
      } else {
        setError(response.message || "دریافت اطلاعات فرم با خطا روبه‌رو شد.");
      }

      setLoading(false);
    };

    void loadOptions();
  }, []);

  const selectedRole = roles.find((role) => role.slug === form.role_slug);
  const selectedRolePresentation =
    rolePresentation[form.role_slug] ?? rolePresentation.user;
  const selectedStatusPresentation = statusPresentation[form.status];
  const roleOptions = roles.map((role) => {
    const copy = rolePresentation[role.slug] ?? rolePresentation.user;

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

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setSubmitting(true);

    const response = await adminUsersService.create(form);

    if (response.success) {
      setSuccessMessage("کاربر با موفقیت ایجاد شد.");
      setForm(initialForm);
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
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
              کاربر جدید را با نقش ثابت و مجوزهای از قبل تعیین‌شده بساز
            </h2>
            <p className="mt-5 text-base leading-8 text-[#dce8ef] md:text-lg">
              این فرم فقط از نقش‌های ثابت
              {" "}
              <span className="text-[#f8d977]">admin</span>
              ،
              {" "}
              <span className="text-[#7dd3fc]">support</span>
              {" "}
              و
              {" "}
              <span className="text-white">user</span>
              {" "}
              استفاده می‌کند و مجوزها به‌صورت مستقیم از backend به همان نقش متصل
              هستند.
            </p>
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

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
          <h3 className="text-xl font-bold text-white">اطلاعات کاربر</h3>
          <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
            فیلدها را کامل کن؛ پس از ساخت، نقش انتخابی به کاربر متصل می‌شود.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
              <HiOutlineCheckCircle className="h-5 w-5" />
              {successMessage}
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
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
                  onChange={(value) => handleChange("role_slug", value)}
                  options={roleOptions}
                  disabled={loading}
                />
                <p className="mt-2 text-xs leading-6 text-[#7f94a2]">
                  نقش‌ها از backend می‌آیند اما در این بخش فقط همین سه گزینه قابل
                  انتخاب هستند.
                </p>
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
                  وضعیت حساب از همین فرم مشخص می‌شود و بعداً هم از پنل قابل توسعه
                  خواهد بود.
                </p>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || loading}
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

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">پیش‌نمایش نقش انتخابی</h3>
            <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
              نقش‌ها قابل ساخت از پنل نیستند و فقط از backend می‌آیند.
            </p>

            <div className="mt-5 rounded-[28px] border border-white/10 bg-[#09141c] p-5">
              <p className="text-xs text-[#7c93a0]">نقش انتخابی</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-2xl font-bold text-white">
                  {selectedRolePresentation.label}
                </p>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${selectedRolePresentation.badgeClassName}`}
                >
                  {form.role_slug}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#b6c6d0]">
                {selectedRolePresentation.hint}
              </p>
              <p className="mt-3 text-xs leading-6 text-[#7f94a2]">
                {selectedRole?.description || "نقش پیش‌فرض برای کاربر جدید"}
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">وضعیت انتخابی</h3>
            <div className="mt-5 rounded-[28px] border border-white/10 bg-[#09141c] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-2xl font-bold text-white">
                  {selectedStatusPresentation.label}
                </p>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${selectedStatusPresentation.badgeClassName}`}
                >
                  {form.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#b6c6d0]">
                {selectedStatusPresentation.hint}
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-[#38bdf8]/18 bg-[#08121a] p-6">
            <h3 className="text-xl font-bold text-white">قانون این مرحله</h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]">
                فقط سه نقش
                {" "}
                <span className="text-[#f8d977]">admin</span>
                ،
                {" "}
                <span className="text-[#7dd3fc]">support</span>
                {" "}
                و
                {" "}
                <span className="text-white">user</span>
                {" "}
                قابل انتخاب هستند.
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]">
                مجوزها از قبل در backend به نقش‌ها متصل شده‌اند و از این فرم
                قابل تغییر نیستند.
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]">
                اگر ایمیل تکراری باشد یا رمز عبور با تکرارش یکی نباشد، خطا از
                API دریافت و در همین فرم نمایش داده می‌شود.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
