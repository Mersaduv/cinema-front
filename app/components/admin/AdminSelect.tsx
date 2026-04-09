"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HiCheck, HiOutlineChevronDown } from "react-icons/hi";

export interface AdminSelectOption {
  value: string;
  label: string;
  description?: string;
  meta?: string;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function AdminSelect({
  value,
  onChange,
  options,
  placeholder = "انتخاب کنید",
  disabled = false,
  className = "",
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const isOpen = open && !disabled;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-right transition ${
          isOpen
            ? "border-[#38bdf8]/45 bg-white/[0.08]"
            : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <HiOutlineChevronDown
          className={`h-5 w-5 shrink-0 text-[#8ea4b3] transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1821] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        >
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {options.map((option) => {
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
                  className={`flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-right transition ${
                    isSelected
                      ? "bg-[#f5c518]/12 text-white"
                      : "bg-transparent text-[#dbe6ed] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    {(option.description || option.meta) && (
                      <span className="mt-1 block text-xs leading-6 text-[#8ea4b3]">

                        {option.description || option.meta}
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-0.5 rounded-full p-1 ${
                      isSelected
                        ? "bg-[#f5c518]/20 text-[#f8d977]"
                        : "text-transparent"
                    }`}
                  >
                    <HiCheck className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
