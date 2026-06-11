"use client";

import { useEffect } from "react";
import { HiBookmark, HiOutlineBookmark } from "react-icons/hi";

type SaveFeedbackToastProps = {
  message: string;
  saved: boolean;
  onDismiss: () => void;
};

export default function SaveFeedbackToast({
  message,
  saved,
  onDismiss,
}: SaveFeedbackToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 2800);

    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[130] flex w-[min(92vw,360px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/12 bg-[#10151d]/95 px-4 py-3 text-sm text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md"
    >
      {saved ? (
        <HiBookmark className="h-5 w-5 shrink-0 text-[#f5c518]" />
      ) : (
        <HiOutlineBookmark className="h-5 w-5 shrink-0 text-white/70" />
      )}
      <span className="leading-6">{message}</span>
    </div>
  );
}
