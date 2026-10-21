import { memo } from "react";

type LoadingOverlayProps = {
  /** During initial prepare, sit above chrome and use a fuller veil. */
  elevated?: boolean;
};

/** Minimal loading spinner — no text, no poster. */
function LoadingOverlayComponent({ elevated = false }: LoadingOverlayProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
        elevated ? "z-40 bg-black/70" : "z-[25] bg-black/40"
      }`}
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
