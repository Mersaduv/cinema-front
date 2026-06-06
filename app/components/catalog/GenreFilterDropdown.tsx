"use client";

import { useMemo, useState } from "react";
import { HiExclamationCircle } from "react-icons/hi2";
import FilterCheckbox from "../ui/FilterCheckbox";
import FilterDropdown from "./FilterDropdown";

export type GenreFilterOption = {
  value: string;
  label: string;
  tmdb_id?: number | null;
};

const MAX_GENRES = 3;

export default function GenreFilterDropdown({
  options,
  value,
  onChange,
  placeholder = "ژانر",
}: {
  options: GenreFilterOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [limitWarning, setLimitWarning] = useState(false);

  const labelByValue = new Map(options.map((option) => [option.value, option.label]));
  const valueLabel =
    value.length > 0 ? `${value.length} ژانر انتخاب شده` : placeholder;

  const toggleGenre = (genreId: string) => {
    if (value.includes(genreId)) {
      setLimitWarning(false);
      onChange(value.filter((item) => item !== genreId));
      return;
    }
    if (value.length >= MAX_GENRES) {
      setLimitWarning(true);
      return;
    }
    setLimitWarning(false);
    onChange([...value, genreId]);
  };

  const columns = useMemo(() => {
    const columnCount = 3;
    const perColumn = Math.ceil(options.length / columnCount) || 1;
    const result: GenreFilterOption[][] = [[], [], []];
    options.forEach((option, index) => {
      const columnIndex = Math.min(Math.floor(index / perColumn), columnCount - 1);
      result[columnIndex].push(option);
    });
    return result;
  }, [options]);

  return (
    <FilterDropdown
      label={placeholder}
      valueLabel={valueLabel}
      minWidth="min(720px, calc(100vw - 2rem))"
      panelClassName="w-[min(720px,calc(100vw-2rem))]"
    >
      {limitWarning || value.length >= MAX_GENRES ? (
        <div className="flex items-center gap-2 border-b border-[#ef4444]/30 bg-[#ef4444]/15 px-4 py-3 text-sm text-[#fecaca]">
          <HiExclamationCircle className="h-5 w-5 shrink-0 text-[#f87171]" />
          <span>شما تنها می‌توانید سه گزینه را انتخاب کنید.</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3">
        {columns.map((column, columnIndex) => (
          <ul key={columnIndex} className="space-y-0.5">
            {column.map((option) => (
              <li key={option.value}>
                <FilterCheckbox
                  checked={value.includes(option.value)}
                  onChange={() => toggleGenre(option.value)}
                  label={option.label}
                />
              </li>
            ))}
          </ul>
        ))}
      </div>

      {options.length === 0 ? (
        <p className="px-4 pb-4 text-center text-sm text-white/50">
          ژانری در پایگاه داده ثبت نشده است.
        </p>
      ) : null}

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
          {value.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => toggleGenre(slug)}
              className="rounded-lg border border-[#f5c518]/30 bg-[#f5c518]/10 px-2.5 py-1 text-xs text-[#f8d977] hover:bg-[#f5c518]/20"
            >
              {labelByValue.get(slug) ?? slug} ×
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setLimitWarning(false);
              onChange([]);
            }}
            className="text-xs text-[#f5c518] hover:underline"
          >
            پاک کردن ژانرها
          </button>
        </div>
      ) : null}
    </FilterDropdown>
  );
}
