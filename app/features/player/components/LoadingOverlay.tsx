import { memo } from "react";

type LoadingOverlayProps = {
  message?: string;
  phase?: string;
};

/** Loading / recovery overlay with contextual message. */
function LoadingOverlayComponent({
  message = "در حال بارگذاری پخش...",
  phase,
}: LoadingOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/20"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#F5C518]" />
        <div
          className="rounded-full border border-white/10 bg-black/55 px-5 py-3 text-sm text-white"
          dir="rtl"
        >
          {phase || message}
        </div>
      </div>
    </div>
  );
}

export const LoadingOverlay = memo(LoadingOverlayComponent);
