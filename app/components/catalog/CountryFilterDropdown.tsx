"use client";

import { useMemo, useState } from "react";
import FilterCheckbox from "../ui/FilterCheckbox";
import FilterDropdown from "./FilterDropdown";
import { sortCountriesByPopularity } from "../../lib/catalog/popular-countries";

export type CountryOption = {
  value: string;
  label: string;
  flag?: string;
};

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
      onChange(value.filter((item) => item !== iso));
      return;
    }
    onChange([...value, iso]);
  };

  return (
    <FilterDropdown label={placeholder} valueLabel={valueLabel} minWidth="420px">
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
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
      {value.length > 0 ? (
        <div className="border-t border-white/10 px-3 py-2 text-left">
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-[#f5c518] hover:underline"
          >
            پاک کردن کشورها
          </button>
        </div>
      ) : null}
    </FilterDropdown>
  );
}
