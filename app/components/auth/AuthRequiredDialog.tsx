"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HiOutlineBookmark, HiXMark } from "react-icons/hi2";

type AuthRequiredDialogProps = {
  open: boolean;
  onClose: () => void;
  redirectPath?: string;
  title?: string;
  description?: string;
  featureLabel?: string;
};

export default function AuthRequiredDialog({
  open,
  onClose,
  redirectPath = "",
  title = "ابتدا عضو شوید",
  description = "برای استفاده از این قابلیت باید وارد حساب کاربری شوید یا ثبت‌نام کنید.",
  featureLabel = "این بخش",
}: AuthRequiredDialogProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const loginHref = `/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`;
  const signupHref = `/signup${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-required-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#090d12] p-6 text-right shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <HiXMark className="h-5 w-5" />
        </button>

        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5c518]/12 text-[#f5c518]">
          <HiOutlineBookmark className="h-6 w-6" />
        </div>

        <h3 id="auth-required-title" className="text-xl font-black text-white">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-white/72">{description}</p>
        <p className="mt-2 text-xs leading-6 text-white/45">
          {featureLabel} فقط برای اعضای سایت در دسترس است.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <Link
            href={signupHref}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#f5c518] px-4 py-3 text-sm font-black text-[#081018] transition hover:bg-[#e8bb0d]"
          >
            ثبت‌نام رایگان
          </Link>
          <Link
            href={loginHref}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            ورود به حساب
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-white/50 transition hover:text-white/75"
        >
          بعداً انجام می‌دهم
        </button>
      </div>
    </div>
  );
}
