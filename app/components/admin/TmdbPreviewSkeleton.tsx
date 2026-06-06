"use client";

export default function TmdbPreviewSkeleton({
  className = "",
  heightClass = "h-[24rem]",
}: {
  className?: string;
  heightClass?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-[#f5c518]/20 bg-[#0b1720] ${heightClass} ${className}`}
    >
      <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(245,197,24,0.08),rgba(245,197,24,0.16)_45%,rgba(245,197,24,0.06))]" />
      <div className="relative flex h-full flex-col justify-end p-5">
        <div className="flex items-end gap-4">
          <div className="h-36 w-24 shrink-0 animate-pulse rounded-[20px] border border-[#f5c518]/25 bg-[#f5c518]/10" />
          <div className="min-w-0 flex-1 space-y-3 pb-1">
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-[#f5c518]/20" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[#f5c518]/12" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-[#f5c518]/12" />
            <div className="h-3 w-4/6 animate-pulse rounded-full bg-[#f5c518]/10" />
          </div>
        </div>
        <p className="mt-4 text-center text-xs font-medium text-[#f8d977]/80">
          در حال همگام‌سازی از TMDB...
        </p>
      </div>
    </div>
  );
}
