"use client";

import { useMemo } from "react";
import { optimizeManagedImageUrl } from "../../../lib/cinema-image";

type PlayerSkeletonProps = {
  poster?: string | null;
  title?: string | null;
};

/** Instant full-screen placeholder while HLS URL resolves — no layout shift. */
export function PlayerSkeleton({ poster, title }: PlayerSkeletonProps) {
  const optimizedPoster = useMemo(
    () => optimizeManagedImageUrl(poster, { width: 1920, quality: 70, sharpen: 60 }),
    [poster],
  );

  return (
    <div className="fixed inset-0 z-50 h-dvh w-screen overflow-hidden bg-black">
      {optimizedPoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimizedPoster}
          alt={title ?? ""}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full min-h-full min-w-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-900 to-black" />
      )}

      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#F5C518]" />
        <p className="max-w-[min(90vw,28rem)] text-sm font-medium text-white/85 drop-shadow" dir="rtl">
          {title ?? "در حال آماده‌سازی پخش..."}
        </p>
      </div>
    </div>
  );
}
