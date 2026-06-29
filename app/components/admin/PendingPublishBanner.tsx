"use client";

type PendingPublishBannerProps = {
  onRetry: () => void;
  loading?: boolean;
};

export default function PendingPublishBanner({
  onRetry,
  loading = false,
}: PendingPublishBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#fde68a]">
      <p>انتشار ناتمام مانده است. محتوا ذخیره شده اما وضعیت انتشار اعمال نشده.</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#f59e0b]/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "در حال تکمیل..." : "تکمیل انتشار"}
      </button>
    </div>
  );
}
