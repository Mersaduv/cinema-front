"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { adminViewersService } from "../../../lib/admin-viewers";
import AdminSelect from "../../../components/admin/AdminSelect";

const initialForm = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  status: "active" as "active" | "banned",
};

const statusPresentation: Record<
  "active" | "banned",
  { label: string; hint: string }
> = {
  active: {
    label: "فعال",
    hint: "بیننده بعد از ساخت می‌تواند وارد شود.",
  },
  banned: {
    label: "مسدود",
    hint: "حساب ساخته می‌شود اما تا تغییر وضعیت ورود ندارد.",
  },
};

export default function CreateAdminViewerPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const statusOptions = (["active", "banned"] as const).map((status) => ({
    value: status,
    label: statusPresentation[status].label,
    description: statusPresentation[status].hint,
    meta: status,
  }));

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setSubmitting(true);

    if (form.password !== form.password_confirmation) {
      setError("رمز عبور و تکرار آن یکسان نیست.");
      setSubmitting(false);
      return;
    }

    const response = await adminViewersService.create(form);

    if (response.success) {
      setSuccessMessage("بیننده با موفقیت ساخته شد.");
      window.setTimeout(() => {
        router.push("/admin/viewers");
      }, 700);
    } else {
      setError(response.message || "ساخت بیننده ناموفق بود.");
    }

    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <Link
          href="/admin/viewers"
          className="inline-flex items-center gap-2 text-sm text-[#8ea4b3] transition hover:text-white"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          بازگشت به بیننده‌ها
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white">ایجاد بیننده</h1>
        <p className="mt-2 text-sm text-[#8ea4b3]">
          این حساب برای بخش مخاطب سایت است و به پنل مدیریت دسترسی ندارد.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-[32px] border border-white/10 bg-[#0b1720] p-6"
      >
        {error ? (
          <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}
        {successMessage ? (
          <div className="flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
            <HiOutlineCheckCircle className="h-5 w-5" />
            {successMessage}
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm text-[#8ea4b3]">نام</span>
          <input
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white outline-none focus:border-[#f5c518]/50"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-[#8ea4b3]">ایمیل</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white outline-none focus:border-[#f5c518]/50"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-[#8ea4b3]">رمز عبور</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white outline-none focus:border-[#f5c518]/50"
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
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white outline-none focus:border-[#f5c518]/50"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm text-[#8ea4b3]">وضعیت</span>
          <AdminSelect
            value={form.status}
            onChange={(value) =>
              handleChange("status", value as "active" | "banned")
            }
            options={statusOptions}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400] disabled:opacity-50"
        >
          {submitting ? "در حال ایجاد..." : "ایجاد بیننده"}
        </button>
      </form>
    </div>
  );
}
