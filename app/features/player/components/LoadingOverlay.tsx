import { memo } from "react";

/** Minimal loading spinner — no text, no poster. */
function LoadingOverlayComponent() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[25] flex items-center justify-center bg-black/40"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="در حال بارگذاری"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/15 border-t-[#F5C518]" />
    </div>
  );
}

export const LoadingOverlay = memo(LoadingOverlayComponent);
