"use client";

import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import { useTvBodyScrollLock } from "../../hooks/useTvBodyScrollLock";
import TvOverlayPortal from "./TvOverlayPortal";

const PERSIAN_ROWS = [
  ["ا", "ب", "پ", "ت", "ث", "ج", "چ"],
  ["ح", "خ", "د", "ذ", "ر", "ز", "ژ"],
  ["س", "ش", "ص", "ض", "ط", "ظ", "ع"],
  ["غ", "ف", "ق", "ک", "گ", "ل", "م"],
  ["ن", "و", "ه", "ی", "ئ", "ء", "آ"],
  ["0", "1", "2", "3", "4", "5", "6"],
  ["7", "8", "9", " ", "⌫", "پاک", "تأیید"],
];

export function needsOnScreenSearchKeyboard(platformFamily: string): boolean {
  return platformFamily === "roku" || platformFamily === "generic";
}

type TvOnScreenSearchPadProps = {
  open: boolean;
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function TvOnScreenSearchPad({
  open,
  value,
  onChange,
  onSubmit,
  onClose,
}: TvOnScreenSearchPadProps) {
  useTvBodyScrollLock(open);

  if (!open) {
    return null;
  }

  const pressKey = (key: string) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === "پاک") {
      onChange("");
      return;
    }

    if (key === "تأیید") {
      onSubmit();
      onClose();
      return;
    }

    onChange(value + key);
  };

  return (
    <TvOverlayPortal>
      <div
        className="fixed inset-0 z-[210] flex flex-col overflow-hidden bg-[#05070b]/96 p-4"
        dir="rtl"
        role="dialog"
        aria-label="صفحه‌کلید جستجو"
        data-tv-filter-sheet
      >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-white/70">جستجو</p>
        <button
          type="button"
          data-tv-focusable
          onClick={onClose}
          className={`rounded-xl border border-white/15 px-4 py-2 text-sm ${TV_FOCUS_RING_CLASS}`}
        >
          بستن
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-right text-lg text-white">
        {value || "عبارت جستجو…"}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto" data-tv-filter-sheet-body>
        {PERSIAN_ROWS.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex flex-wrap justify-center gap-2">
            {row.map((key) => (
              <button
                key={`${rowIndex}-${key}`}
                type="button"
                data-tv-focusable
                onClick={() => pressKey(key)}
                className={`min-w-[3rem] rounded-xl border border-white/12 bg-white/[0.06] px-3 py-3 text-sm font-semibold text-white ${TV_FOCUS_RING_CLASS}`}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
    </TvOverlayPortal>
  );
}
