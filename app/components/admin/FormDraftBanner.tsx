"use client";

type FormDraftBannerProps = {
  onRestore: () => void;
  onDismiss: () => void;
};

export default function FormDraftBanner({ onRestore, onDismiss }: FormDraftBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-4 py-3 text-sm text-[#bae6fd]">
      <p>پیش‌نویس ذخیره‌شده‌ای یافت شد.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRestore}
          className="rounded-xl border border-[#38bdf8]/40 bg-[#38bdf8]/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#38bdf8]/30"
        >
          بازیابی
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/[0.08]"
        >
          نادیده گرفتن
        </button>
      </div>
    </div>
  );
}
