"use client";

import { HiOutlineCheckCircle, HiOutlineX } from "react-icons/hi";

export type PublishOutcomeStatus = "draft" | "scheduled" | "published";

const outcomeCopy: Record<
  PublishOutcomeStatus,
  { title: string; description: string; accent: string }
> = {
  published: {
    title: "منتشر شد",
    description: "محتوا با موفقیت منتشر شد و در جریان انتشار عمومی قرار گرفت.",
    accent: "border-[#34d399]/30 bg-[#34d399]/10 text-[#86efac]",
  },
  scheduled: {
    title: "زمان‌بندی شد",
    description: "محتوا ذخیره شد و برای انتشار در زمان تعیین‌شده آماده است.",
    accent: "border-[#38bdf8]/30 bg-[#38bdf8]/10 text-[#bfeaff]",
  },
  draft: {
    title: "پیش‌نویس شد",
    description: "محتوا به‌صورت پیش‌نویس ذخیره شد و هنوز منتشر نشده است.",
    accent: "border-[#f5c518]/30 bg-[#f5c518]/10 text-[#f8d977]",
  },
};

export default function PublishOutcomeModal({
  open,
  status,
  onClose,
}: {
  open: boolean;
  status: PublishOutcomeStatus;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  const copy = outcomeCopy[status];

  return (
    <div
      className="fixed inset-0 z-[120] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-outcome-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="بستن"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1720] shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-6 py-5 ${copy.accent}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/20">
                <HiOutlineCheckCircle className="h-6 w-6" />
              </span>
              <div>
                <h3 id="publish-outcome-title" className="text-xl font-black text-white">
                  {copy.title}
                </h3>
                <p className="mt-2 text-sm leading-7 opacity-90">{copy.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-white/10 bg-black/20 p-2 text-white/80 transition hover:bg-black/30"
              aria-label="بستن"
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#f5c518] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#e7ba12]"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
}
