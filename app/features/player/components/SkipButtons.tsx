"use client";

import { memo } from "react";

type SkipButtonProps = {
  label: string;
  onSkip: () => void;
};

/** Skip intro / recap button. */
function SkipButtonComponent({ label, onSkip }: SkipButtonProps) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className="absolute bottom-36 right-6 z-30 rounded-full border border-white/20 bg-black/60 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
      dir="rtl"
    >
      {label}
    </button>
  );
}

export const SkipIntroButton = memo(function SkipIntroButton({
  onSkip,
}: {
  onSkip: () => void;
}) {
  return <SkipButtonComponent label="رد کردن intro" onSkip={onSkip} />;
});

export const SkipRecapButton = memo(function SkipRecapButton({
  onSkip,
}: {
  onSkip: () => void;
}) {
  return <SkipButtonComponent label="رد کردن خلاصه" onSkip={onSkip} />;
});
