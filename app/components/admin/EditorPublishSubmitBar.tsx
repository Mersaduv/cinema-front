"use client";

import { HiOutlineCheckCircle } from "react-icons/hi";

export default function EditorPublishSubmitBar({
  onSubmit,
  disabled,
  loading,
  label = "ثبت نهایی",
  hint = "با ثبت نهایی، وضعیت انتشار و تمام اطلاعات فرم ذخیره می‌شود.",
}: {
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(11,23,32,0.98)_55%,rgba(56,189,248,0.1))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
      <p className="text-sm leading-7 text-[#8ea4b3]">{hint}</p>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f5c518] px-6 py-4 text-base font-black text-[#081018] shadow-[0_12px_32px_rgba(245,197,24,0.28)] transition hover:bg-[#e7ba12] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "در حال ثبت..." : label}
        <HiOutlineCheckCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
