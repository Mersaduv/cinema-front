"use client";

import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import type { FilterGenreOption } from "../../lib/filter-options";
import CountryFilterDropdown from "../catalog/CountryFilterDropdown";
import FilterDropdown from "../catalog/FilterDropdown";
import GenreFilterDropdown from "../catalog/GenreFilterDropdown";
import YearRangeFilter from "../catalog/YearRangeFilter";
import FilterCheckbox from "../ui/FilterCheckbox";

export type AdminCatalogFilterState = {
  search: string;
  sort: string;
  genres: string[];
  countries: string[];
  languages: string[];
  year_from: number | null;
  year_to: number | null;
  min_rating: string;
  publish_status: string;
  visibility: string;
  slider: string;
  extra: string;
};

export type AdminCatalogFilterOption = {
  value: string;
  label: string;
  description?: string;
};

const IMDB_OPTIONS = [
  { value: "", label: "امتیاز IMDB" },
  { value: "6", label: "۶ به بالا" },
  { value: "7", label: "۷ به بالا" },
  { value: "8", label: "۸ به بالا" },
  { value: "9", label: "۹ به بالا" },
];

const SORT_OPTIONS: AdminCatalogFilterOption[] = [
  { value: "", label: "جدیدترین" },
  { value: "title_asc", label: "عنوان از الف تا ی" },
  { value: "title_desc", label: "عنوان از ی تا الف" },
  { value: "year_desc", label: "سال ساخت جدیدتر" },
  { value: "year_asc", label: "سال ساخت قدیمی‌تر" },
  { value: "imdb_desc", label: "امتیاز IMDb" },
  { value: "popular", label: "محبوبیت" },
  { value: "featured", label: "محتوای ویژه" },
];

function renderSingleSelect(
  label: string,
  value: string,
  options: AdminCatalogFilterOption[],
  onChange: (value: string) => void,
) {
  const selected = options.find((item) => item.value === value);

  return (
    <FilterDropdown label={label} valueLabel={selected?.label ?? label} minWidth="240px">
      <div className="p-2">
        {options.map((option) => (
          <FilterCheckbox
            key={`${label}-${option.value || "all"}`}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            label={option.label}
          />
        ))}
      </div>
    </FilterDropdown>
  );
}

type Props = {
  title: string;
  searchPlaceholder: string;
  state: AdminCatalogFilterState;
  onChange: (next: AdminCatalogFilterState) => void;
  onReset: () => void;
  genres: FilterGenreOption[];
  countries: Array<{ iso: string; name: string; flag?: string | null }>;
  languages: Array<{ iso: string; name: string }>;
  publishOptions: AdminCatalogFilterOption[];
  visibilityOptions: AdminCatalogFilterOption[];
  extraLabel?: string;
  extraOptions?: AdminCatalogFilterOption[];
  yearMin?: number;
  yearMax?: number;
};

export default function AdminCatalogFilters({
  title,
  searchPlaceholder,
  state,
  onChange,
  onReset,
  genres,
  countries,
  languages,
  publishOptions,
  visibilityOptions,
  extraLabel,
  extraOptions = [],
  yearMin = 1950,
  yearMax = new Date().getFullYear(),
}: Props) {
  const chipLabels = new Map<string, string>();
  genres.forEach((genre) => {
    chipLabels.set(genre.slug, genre.name);
    chipLabels.set(String(genre.id), genre.name);
  });

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
            فیلترهای عمومی کاتالوگ به‌همراه گزینه‌های اختصاصی ادمین.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white transition hover:border-white/20 hover:bg-white/8"
        >
          حذف همه فیلترها
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div className="relative">
          <HiMagnifyingGlass className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b909d]" />
          <input
            value={state.search}
            onChange={(event) => onChange({ ...state, search: event.target.value })}
            placeholder={searchPlaceholder}
            className="w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-4 pr-12 text-sm text-white outline-none transition placeholder:text-[#728896] focus:border-[#f5c518]/50 focus:bg-white/6"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <GenreFilterDropdown
            options={genres.map((genre) => ({
              value: String(genre.id),
              label: genre.name,
              tmdb_id: genre.tmdb_id,
            }))}
            value={state.genres}
            onChange={(values) => onChange({ ...state, genres: values })}
            placeholder="ژانر"
          />
          <CountryFilterDropdown
            options={countries.map((country) => ({
              value: country.iso,
              label: country.name,
              flag: country.flag ?? undefined,
            }))}
            value={state.countries}
            onChange={(values) => onChange({ ...state, countries: values })}
            placeholder="کشور"
          />
          <FilterDropdown
            label="زبان"
            valueLabel={state.languages.length ? `${state.languages.length} زبان` : "زبان"}
            minWidth="320px"
          >
            <div className="max-h-[340px] overflow-auto p-2">
              {languages.map((language) => (
                <FilterCheckbox
                  key={language.iso}
                  checked={state.languages.includes(language.iso)}
                  onChange={() =>
                    onChange({
                      ...state,
                      languages: state.languages.includes(language.iso)
                        ? state.languages.filter((item) => item !== language.iso)
                        : [...state.languages, language.iso],
                    })
                  }
                  label={language.name}
                />
              ))}
            </div>
          </FilterDropdown>
          {renderSingleSelect("امتیاز IMDB", state.min_rating, IMDB_OPTIONS, (value) =>
            onChange({ ...state, min_rating: value }),
          )}
          <YearRangeFilter
            min={yearMin}
            max={yearMax}
            from={state.year_from}
            to={state.year_to}
            onChange={(year_from, year_to) => onChange({ ...state, year_from, year_to })}
          />
          {renderSingleSelect("مرتب‌سازی", state.sort, SORT_OPTIONS, (value) =>
            onChange({ ...state, sort: value }),
          )}
          {renderSingleSelect("انتشار", state.publish_status, publishOptions, (value) =>
            onChange({ ...state, publish_status: value }),
          )}
          {renderSingleSelect("نمایش", state.visibility, visibilityOptions, (value) =>
            onChange({ ...state, visibility: value }),
          )}
          {extraLabel && extraOptions.length > 0
            ? renderSingleSelect(extraLabel, state.extra, extraOptions, (value) =>
                onChange({ ...state, extra: value }),
              )
            : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {state.genres.map((value) => (
            <button
              key={`genre-${value}`}
              type="button"
              onClick={() =>
                onChange({
                  ...state,
                  genres: state.genres.filter((item) => item !== value),
                })
              }
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs text-white/85"
            >
              <HiXMark className="h-3.5 w-3.5" />
              {chipLabels.get(value) ?? value}
            </button>
          ))}
          {state.countries.map((value) => {
            const label = countries.find((item) => item.iso === value)?.name ?? value;
            return (
              <button
                key={`country-${value}`}
                type="button"
                onClick={() =>
                  onChange({
                    ...state,
                    countries: state.countries.filter((item) => item !== value),
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs text-white/85"
              >
                <HiXMark className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
          {state.languages.map((value) => {
            const label = languages.find((item) => item.iso === value)?.name ?? value;
            return (
              <button
                key={`lang-${value}`}
                type="button"
                onClick={() =>
                  onChange({
                    ...state,
                    languages: state.languages.filter((item) => item !== value),
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs text-white/85"
              >
                <HiXMark className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
          {state.year_from || state.year_to ? (
            <button
              type="button"
              onClick={() => onChange({ ...state, year_from: null, year_to: null })}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs text-white/85"
            >
              <HiXMark className="h-3.5 w-3.5" />
              {state.year_from ?? "…"} تا {state.year_to ?? "…"}
            </button>
          ) : null}
          {[
            ["min_rating", state.min_rating, `IMDb ${state.min_rating}+`],
            [
              "publish_status",
              state.publish_status,
              publishOptions.find((item) => item.value === state.publish_status)?.label ?? "",
            ],
            [
              "visibility",
              state.visibility,
              visibilityOptions.find((item) => item.value === state.visibility)?.label ?? "",
            ],
            ["sort", state.sort, SORT_OPTIONS.find((item) => item.value === state.sort)?.label ?? ""],
            [
              "extra",
              state.extra,
              extraOptions.find((item) => item.value === state.extra)?.label ?? "",
            ],
          ]
            .filter((item) => item[1])
            .map(([key, value, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ ...state, [key]: "" } as AdminCatalogFilterState)}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs text-white/85"
              >
                <HiXMark className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
        </div>
      </div>
    </section>
  );
}
