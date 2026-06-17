"use client";

import Link from "next/link";
import { HiOutlineLockClosed } from "react-icons/hi";
import { TV_FOCUS_RING_CLASS } from "../lib/tv/focus";

export function WatchAuthGate({ redirectBack }: { redirectBack: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black p-8 text-white">
      <HiOutlineLockClosed className="h-16 w-16 text-[#38bdf8]" aria-hidden />
      <h1 className="text-center text-2xl font-bold">
        برای تماشای این محتوا وارد شوید
      </h1>
      <p className="max-w-md text-center text-gray-400">
        برای دسترسی به این فیلم یا سریال، باید وارد حساب کاربری خود شوید.
      </p>
      <Link
        href={`/login?redirect=${encodeURIComponent(redirectBack)}`}
        data-tv-focusable
        className={`rounded-lg bg-[#38bdf8] px-8 py-3 text-lg font-bold text-black transition hover:bg-sky-400 ${TV_FOCUS_RING_CLASS}`}
      >
        ورود به حساب کاربری
      </Link>
      <Link
        href="/"
        data-tv-focusable
        className={`text-sm text-gray-500 transition hover:text-gray-300 ${TV_FOCUS_RING_CLASS}`}
      >
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
