"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HiChevronUp, HiXMark } from "react-icons/hi2";
import FilterCheckbox from "./FilterCheckbox";

export type MultiSelectOption = {
  value: string;
  label: string;
  count?: number;
  flag?: string;
  group?: string;
};

type SearchableMultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  maxHeight?: number;
  showCounts?: boolean;
  maxSelections?: number;
  columns?: 1 | 2;
};

export default function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "جستجو...",
  maxHeight = 280,
  showCounts = true,
  maxSelections,
  columns = 1,
}: SearchableMultiSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  const labelByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options],
  );

  const columnLists = useMemo(() => {
    if (columns === 1) {
      return [filtered];
    }
    const mid = Math.ceil(filtered.length / 2) || 1;
    return [filtered.slice(0, mid), filtered.slice(mid)];
  }, [columns, filtered]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }
    if (maxSelections && value.length >= maxSelections) {
      return;
    }
    onChange([...value, optionValue]);
  };

  const selectedLabels = value
    .map((item) => labelByValue.get(item) ?? item)
    .filter(Boolean);

  const triggerLabel =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join("، ")
        : `${selectedLabels.slice(0, 2).join("، ")} +${selectedLabels.length - 2}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full min-w-[140px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1a1f2e]/95 px-4 py-3.5 text-sm text-white/90 backdrop-blur-md transition hover:border-white/20"
      >
        <span className="truncate text-right font-medium">{triggerLabel}</span>
        <HiChevronUp
          aria-hidden
          className={`h-5 w-5 shrink-0 text-white/55 transition-transform duration-200 ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>

      {value.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {value.slice(0, 3).map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-md border border-[#f5c518]/25 bg-[#f5c518]/10 px-2 py-0.5 text-xs text-[#f8d977]"
            >
              {labelByValue.get(item) ?? item}
              <button
                type="button"
                aria-label="حذف"
                onClick={() => toggle(item)}
                className="text-[#f5c518]/80 hover:text-[#f5c518]"
              >
                <HiXMark className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div
          id={listId}
          className="absolute right-0 z-40 mt-2 w-full min-w-[240px] overflow-hidden rounded-xl border border-white/10 bg-[#0d1118]/98 shadow-2xl backdrop-blur-xl"
        >
          <div className="border-b border-white/10 p-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-white/10 bg-[#0f131c] px-3 py-2.5 text-right text-sm text-white outline-none placeholder:text-white/35 focus:border-[#f5c518]/70"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOpen(false);
                  return;
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlight((index) => Math.min(index + 1, filtered.length - 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlight((index) => Math.max(index - 1, 0));
                }
                if (event.key === "Enter" && filtered[highlight]) {
                  event.preventDefault();
                  toggle(filtered[highlight].value);
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-[#f5c518] hover:underline"
                onClick={() => onChange(options.map((option) => option.value))}
              >
                انتخاب همه
              </button>
              <button
                type="button"
                className="text-white/55 hover:underline"
                onClick={() => onChange([])}
              >
                همه را پاک کن
              </button>
            </div>
          </div>
          <div
            className={`grid gap-1 overflow-auto p-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}
            style={{ maxHeight }}
          >
            {columnLists.map((column, columnIndex) => (
              <ul key={columnIndex} role="listbox" className="space-y-0.5">
                {column.length === 0 && columnIndex === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-white/50">
                    موردی یافت نشد
                  </li>
                ) : null}
                {column.map((option, index) => {
                  const globalIndex =
                    columns === 2 && columnIndex === 1
                      ? columnLists[0].length + index
                      : index;
                  return (
                    <li key={option.value}>
                      <FilterCheckbox
                        checked={value.includes(option.value)}
                        onChange={() => toggle(option.value)}
                        className={highlight === globalIndex ? "bg-white/[0.04]" : ""}
                        label={
                          <span className="flex flex-wrap items-center justify-end gap-2">
                            {option.flag ? <span>{option.flag}</span> : null}
                            <span>{option.label}</span>
                            {showCounts && option.count != null ? (
                              <span className="text-xs text-white/40">({option.count})</span>
                            ) : null}
                          </span>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
