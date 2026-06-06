"use client";

import { useEffect, useRef, useState } from "react";
import { HiChevronUp } from "react-icons/hi2";

export default function FilterDropdown({
  label,
  valueLabel,
  children,
  className = "",
  panelClassName = "",
  minWidth = "220px",
}: {
  label: string;
  valueLabel?: string;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  minWidth?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1a1f2e]/95 px-4 py-3.5 text-sm text-white/90 backdrop-blur-md transition hover:border-white/20"
      >
        <span className="truncate text-right font-medium">{valueLabel || label}</span>
        <HiChevronUp
          aria-hidden
          className={`h-5 w-5 shrink-0 text-white/55 transition-transform duration-200 ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-40 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0d1118]/98 shadow-2xl backdrop-blur-xl ${panelClassName}`}
          style={{ minWidth }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
