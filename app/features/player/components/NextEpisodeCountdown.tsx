"use client";

import { memo } from "react";

type NextEpisodeCountdownProps = {
  countdown: number;
  nextTitle: string;
  onCancel: () => void;
  onPlayNow: () => void;
};

/** Netflix-style autoplay next episode countdown. */
function NextEpisodeCountdownComponent({
  countdown,
  nextTitle,
  onCancel,
  onPlayNow,
}: NextEpisodeCountdownProps) {
  return (
    <div
      className="absolute bottom-32 right-6 z-40 w-72 rounded-[24px] border border-white/10 bg-[#071119]/95 p-4 shadow-2xl backdrop-blur"
      dir="rtl"
      role="dialog"
      aria-label="پخش خودکار قسمت بعد"
    >
      <p className="text-xs uppercase tracking-wider text-[#8ea4b3]">
        قسمت بعد
      </p>
      <p className="mt-1 truncate font-bold text-white">{nextTitle}</p>
      <p className="mt-2 text-sm text-[#d6e3ea]">
        پخش در {countdown} ثانیه...
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onPlayNow}
          className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-bold text-black"
        >
          پخش الان
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/20 px-3 py-2 text-sm text-white"
        >
          لغو
        </button>
      </div>
    </div>
  );
}

export const NextEpisodeCountdown = memo(NextEpisodeCountdownComponent);
