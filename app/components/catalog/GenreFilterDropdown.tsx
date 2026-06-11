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
const GENRE_COLUMN_COUNT = 3;

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
    const perColumn = Math.ceil(options.length / GENRE_COLUMN_COUNT) || 1;
    const result: GenreFilterOption[][] = Array.from({ length: GENRE_COLUMN_COUNT }, () => []);

    options.forEach((option, index) => {
      const columnIndex = Math.min(Math.floor(index / perColumn), GENRE_COLUMN_COUNT - 1);
      result[columnIndex].push(option);
    });

    return result.filter((column) => column.length > 0);
  }, [options]);

  return (
    <FilterDropdown
      label={placeholder}
      valueLabel={valueLabel}
      fitContent
      allowHorizontalScroll
    >
      {limitWarning || value.length >= MAX_GENRES ? (
        <div className="flex items-center gap-2 border-b border-[#ef4444]/30 bg-[#ef4444]/15 px-4 py-3 text-sm whitespace-nowrap text-[#fecaca]">
          <HiExclamationCircle className="h-5 w-5 shrink-0 text-[#f87171]" />
          <span>شما تنها می‌توانید سه گزینه را انتخاب کنید.</span>
        </div>
      ) : null}

      <div className="inline-flex min-w-full items-start divide-x divide-white/10 p-2">
        {columns.map((column, columnIndex) => (
          <ul key={columnIndex} className="shrink-0 px-3 py-2">
            {column.map((option) => (
              <li key={option.value}>
                <FilterCheckbox
                  checked={value.includes(option.value)}
                  onChange={() => toggleGenre(option.value)}
                  label={option.label}
                  layout="aligned"
                  nowrap
                />
              </li>
            ))}
          </ul>
        ))}
      </div>

      {options.length === 0 ? (
        <p className="px-4 pb-4 text-center text-sm whitespace-nowrap text-white/50">
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
              className="rounded-lg border border-[#f5c518]/30 bg-[#f5c518]/10 px-2.5 py-1 text-xs whitespace-nowrap text-[#f8d977] hover:bg-[#f5c518]/20"
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
            className="text-xs whitespace-nowrap text-[#f5c518] hover:underline"
          >
            پاک کردن ژانرها
          </button>
        </div>
      ) : null}
    </FilterDropdown>
  );
}
