"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineCheck, HiOutlineChevronDown, HiOutlineX } from "react-icons/hi";

type AdminMultiSelectOption = {
  value: number;
  label: string;
  description?: string;
  imageUrl?: string | null;
};

type AdminMultiSelectProps = {
  value: number[];
  onChange: (value: number[]) => void;
  options: AdminMultiSelectOption[];
  placeholder: string;
  emptyLabel?: string;
  disabled?: boolean;
};

export default function AdminMultiSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel = "موردی برای انتخاب وجود ندارد.",
  disabled = false,
}: AdminMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value]
  );

  const toggleValue = (nextValue: number) => {
    if (value.includes(nextValue)) {
      onChange(value.filter((current) => current !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {selectedOptions.length ? (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/20 bg-[#38bdf8]/10 px-2.5 py-1 text-xs text-[#d4f3ff]"
              >
                {option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt={option.label}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : null}
                {option.label}
                <span
                  className="rounded-full bg-white/10 p-0.5"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleValue(option.value);
                  }}
                >
                  <HiOutlineX className="h-3 w-3" />
                </span>
              </span>
            ))
          ) : (
            <span className="text-[#728896]">{placeholder}</span>
          )}
        </div>

        <HiOutlineChevronDown
          className={`h-5 w-5 shrink-0 text-[#8ea4b3] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-[24px] border border-white/10 bg-[#0c1822] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          {options.length ? (
            <div className="space-y-2">
              {options.map((option) => {
                const selected = value.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-3 text-right transition ${
                      selected
                        ? "border border-[#38bdf8]/25 bg-[#38bdf8]/10"
                        : "border border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {option.imageUrl ? (
                        <img
                          src={option.imageUrl}
                          alt={option.label}
                          className="h-11 w-11 shrink-0 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-[#8ea4b3]">
                          {option.label.slice(0, 1)}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">
                          {option.label}
                        </p>
                        {option.description ? (
                          <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                            {option.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[#38bdf8]/35 bg-[#38bdf8]/15 text-[#c7efff]"
                          : "border-white/10 bg-white/[0.04] text-transparent"
                      }`}
                    >
                      <HiOutlineCheck className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-5 text-sm text-[#8ea4b3]">
              {emptyLabel}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
