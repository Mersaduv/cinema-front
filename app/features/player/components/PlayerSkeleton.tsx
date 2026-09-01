"use client";

/** Full-screen spinner only — no poster, no copy (fast perceived boot). */
export function PlayerSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 flex h-dvh w-screen items-center justify-center overflow-hidden bg-black"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="در حال بارگذاری"
    >
      <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-white/15 border-t-[#F5C518]" />
    </div>
  );
}
