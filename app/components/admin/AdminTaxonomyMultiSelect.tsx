"use client";

import SearchableMultiSelect, {
  type MultiSelectOption,
} from "../ui/SearchableMultiSelect";

type AdminTaxonomyMultiSelectProps = {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  loading?: boolean;
  hint?: string;
  columns?: 1 | 2;
  required?: boolean;
  error?: string;
  fieldKey?: string;
};

/**
 * Controlled multi-select for genres / countries / languages —
 * options must match catalog filter-control vocabulary.
 */
export default function AdminTaxonomyMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "جستجو در فهرست فیلتر...",
  loading = false,
  hint = "فقط آیتم‌های فیلتر کنترل قابل انتخاب هستند",
  columns = 1,
  required = false,
  error,
  fieldKey,
}: AdminTaxonomyMultiSelectProps) {
  return (
    <div
      data-form-field={fieldKey}
      className={`rounded-[24px] border bg-white/[0.03] p-4 ${
        error ? "border-red-400/45 ring-1 ring-red-400/45" : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-[#8ea4b3]">
          {label}
          {required ? <span className="text-[#f5c518]"> *</span> : null}
        </p>
        {loading ? (
          <span className="text-[10px] text-[#7f94a1]">در حال بارگذاری...</span>
        ) : (
          <span className="text-[10px] text-[#7f94a1]">
            {options.length.toLocaleString("fa-IR")} گزینه
          </span>
        )}
      </div>

      <div className="mt-3">
        <SearchableMultiSelect
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          showCounts={false}
          columns={columns}
          maxHeight={260}
        />
      </div>

      {error ? (
        <p className="mt-2 text-xs font-medium text-red-300" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-[10px] leading-5 text-[#6f8493]">{hint}</p>
      )}
    </div>
  );
}
