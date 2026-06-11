"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HiCheck, HiOutlineChevronDown } from "react-icons/hi";
import { HiOutlineClock, HiOutlineStar, HiOutlineArrowUturnLeft } from "react-icons/hi2";
import type { ReviewSort } from "../../lib/reviews";

const SORT_OPTIONS: Array<{
  value: ReviewSort;
  label: string;
  description: string;
  icon: typeof HiOutlineClock;
}> = [
  {
    value: "newest",
    label: "جدیدترین",
    description: "آخرین نظرات ثبت‌شده",
    icon: HiOutlineClock,
  },
  {
    value: "oldest",
    label: "قدیمی‌ترین",
    description: "نظرات قدیمی‌تر اول",
    icon: HiOutlineArrowUturnLeft,
  },
  {
    value: "top_rated",
    label: "بیشترین امتیاز",
    description: "نظرات با بالاترین امتیاز",
    icon: HiOutlineStar,
  },
];

export default function ReviewSortDropdown({
  value,
  onChange,
  disabled = false,
}: {
  value: ReviewSort;
  onChange: (sort: ReviewSort) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-w-[200px] items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition hover:border-white/22 hover:bg-white/[0.06] disabled:opacity-60"
      >
        <span className="flex items-center gap-2.5">
          <selected.icon className="h-4 w-4 text-white/50" aria-hidden />
          <span className="font-medium">{selected.label}</span>
        </span>
        <HiOutlineChevronDown
          className={`h-4 w-4 shrink-0 text-white/45 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="مرتب‌سازی نظرات"
          className="absolute left-0 top-[calc(100%+8px)] z-40 w-full min-w-[260px] overflow-hidden rounded-[20px] border border-white/12 bg-[#0b1118]/98 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right transition ${
                  isSelected
                    ? "bg-white/[0.08] text-white"
                    : "text-white/80 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    isSelected
                      ? "border-[#f5c518]/35 bg-[#f5c518]/12 text-[#f8d977]"
                      : "border-white/10 bg-white/[0.03] text-white/45"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-white/42">{option.description}</span>
                </span>

                {isSelected ? (
                  <HiCheck className="h-4 w-4 shrink-0 text-[#f5c518]" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
