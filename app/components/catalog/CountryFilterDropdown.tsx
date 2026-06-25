"use client";

import { useMemo, useState } from "react";
import { HiExclamationCircle } from "react-icons/hi2";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";
import FilterCheckbox from "../ui/FilterCheckbox";
import FilterDropdown from "./FilterDropdown";
import { sortCountriesByPopularity } from "../../lib/catalog/popular-countries";

export type CountryOption = {
  value: string;
  label: string;
  flag?: string;
};

const MAX_COUNTRIES = 3;

export default function CountryFilterDropdown({
  options,
  value,
  onChange,
  placeholder = "کشور",
}: {
  options: CountryOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [limitWarning, setLimitWarning] = useState(false);
  const isTvCompat = useIsTvCompat();

  const labelByValue = new Map(options.map((option) => [option.value, option.label]));

  const sorted = useMemo(() => {
    const withIso = options.map((option) => ({
      iso: option.value,
      value: option.value,
      label: option.label,
      flag: option.flag,
    }));
    return sortCountriesByPopularity(withIso);
  }, [options]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return sorted;
    }
    return sorted.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term),
    );
  }, [query, sorted]);

  const mid = Math.ceil(filtered.length / 2) || 1;
  const leftColumn = filtered.slice(0, mid);
  const rightColumn = filtered.slice(mid);

  const valueLabel =
    value.length > 0 ? `${value.length} کشور انتخاب شده` : placeholder;

  const toggle = (iso: string) => {
    if (value.includes(iso)) {
      setLimitWarning(false);
      onChange(value.filter((item) => item !== iso));
      return;
    }
    if (value.length >= MAX_COUNTRIES) {
      setLimitWarning(true);
      return;
    }
    setLimitWarning(false);
    onChange([...value, iso]);
  };

  return (
    <FilterDropdown label={placeholder} valueLabel={valueLabel} minWidth="420px">
      {limitWarning || value.length >= MAX_COUNTRIES ? (
        <div className="flex items-center gap-2 border-b border-[#ef4444]/30 bg-[#ef4444]/15 px-4 py-3 text-sm text-[#fecaca]">
          <HiExclamationCircle className="h-5 w-5 shrink-0 text-[#f87171]" />
          <span>شما تنها می‌توانید سه گزینه را انتخاب کنید.</span>
        </div>
      ) : null}

      <div className="border-b border-white/10 p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجوی کشور..."
          className="w-full rounded-lg border border-white/10 bg-[#0f131c] px-3 py-2.5 text-right text-sm text-white outline-none placeholder:text-white/35 focus:border-[#f5c518]/70"
        />
      </div>
      <div className="grid max-h-[340px] grid-cols-2 gap-1 overflow-auto p-2">
        {[leftColumn, rightColumn].map((column, columnIndex) => (
          <ul key={columnIndex} className="space-y-0.5">
            {column.map((option) => (
              <li key={option.value}>
                <FilterCheckbox
                  checked={value.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  label={option.label}
                  tvFocusable={isTvCompat}
                />
              </li>
            ))}
          </ul>
        ))}
      </div>

      {options.length === 0 ? (
        <p className="px-4 pb-4 text-center text-sm text-white/50">
          کشوری در پایگاه داده ثبت نشده است.
        </p>
      ) : null}

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
          {value.map((iso) => (
            <button
              key={iso}
              type="button"
              onClick={() => toggle(iso)}
              className="rounded-lg border border-[#f5c518]/30 bg-[#f5c518]/10 px-2.5 py-1 text-xs text-[#f8d977] hover:bg-[#f5c518]/20"
            >
              {labelByValue.get(iso) ?? iso} ×
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
            پاک کردن کشورها
          </button>
        </div>
      ) : null}
    </FilterDropdown>
  );
}
