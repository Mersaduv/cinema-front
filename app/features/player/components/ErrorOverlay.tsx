import { memo } from "react";
import { HiOutlineRefresh } from "react-icons/hi";
import { useIsTvCompat } from "../../../hooks/useTvCapabilities";
import { TV_FOCUS_RING_CLASS } from "../../../lib/tv/focus";

type ErrorOverlayProps = {
  message: string;
  onRetry: () => void;
};

/** Fatal error overlay with manual retry. */
function ErrorOverlayComponent({ message, onRetry }: ErrorOverlayProps) {
  const isTvCompat = useIsTvCompat();

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-6"
      role="alert"
    >
      <div className="max-w-md rounded-[28px] border border-[#fb7185]/25 bg-[#fb7185]/10 px-6 py-8 text-center">
        <p className="text-[#fecdd3]" dir="rtl">
          {message}
        </p>
        <button
          type="button"
          data-tv-focusable={isTvCompat ? true : undefined}
          onClick={onRetry}
          className={`mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#ef4444] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#dc2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] ${isTvCompat ? TV_FOCUS_RING_CLASS : ""}`}
        >
          <HiOutlineRefresh className="h-4 w-4" />
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}

export const ErrorOverlay = memo(ErrorOverlayComponent);
