"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiMagnifyingGlass } from "react-icons/hi2";
import CountryFilterDropdown from "./CountryFilterDropdown";
import FilterDropdown from "./FilterDropdown";
import GenreFilterDropdown from "./GenreFilterDropdown";
import YearRangeFilter from "./YearRangeFilter";
import FilterCheckbox from "../ui/FilterCheckbox";
import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import { buildCatalogQueryString } from "../../lib/catalog/search-params";
import type { FilterOptions } from "../../lib/filter-options";
import { buildGenreFilterOptions } from "../../lib/catalog/genre-filter-options";

export type { CatalogFiltersState };

const IMDB_OPTIONS = [
  { value: "", label: "امتیاز IMDB" },
  { value: "6", label: "۶ به بالا" },
  { value: "7", label: "۷ به بالا" },
  { value: "8", label: "۸ به بالا" },
  { value: "9", label: "۹ به بالا" },
];

export default function CatalogFiltersBar({
  kind,
  filters,
  filterOptions,
  onFiltersChange,
}: {
  kind: "movie" | "series";
  filters: CatalogFiltersState;
  filterOptions: FilterOptions;
  onFiltersChange?: (next: CatalogFiltersState) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [state, setState] = useState(filters);
  const stateRef = useRef(state);
  stateRef.current = state;
  const filtersKey = buildCatalogQueryString(filters);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setState(filters);
  }, [filtersKey, filters]);

  const commit = useCallback(
    (next: CatalogFiltersState) => {
      setState(next);
      if (onFiltersChange) {
        onFiltersChange(next);
        return;
      }
      const query = buildCatalogQueryString(next);
      const current = urlSearchParams.toString();
      if (query === current) {
        return;
      }
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [onFiltersChange, pathname, router, urlSearchParams],
  );

  const commitSearch = useCallback(
    (search: string) => {
      const next = { ...stateRef.current, search };
      setState(next);
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      searchTimerRef.current = setTimeout(() => commit(next), 300);
    },
    [commit],
  );

  useEffect(
    () => () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    },
    [],
  );

  const catalogGenres =
    filterOptions.catalog_genres ??
    (kind === "movie" ? filterOptions.movie_genres : filterOptions.tv_genres);

  const genreOptions = buildGenreFilterOptions(catalogGenres);

  const countryOptions = filterOptions.countries.map((country) => ({
    value: country.iso,
    label: country.name,
    flag: country.flag ?? undefined,
  }));

  const yearMin = 1900;
  const yearMax = Math.max(
    new Date().getFullYear(),
    ...(filterOptions.release_years.length ? filterOptions.release_years : [yearMin]),
  );

  const navigateContentType = (target: "movie" | "series") => {
    const query = buildCatalogQueryString(state);
    const base = target === "movie" ? "/movies" : "/series";
    router.replace(query ? `${base}?${query}` : base, { scroll: false });
  };

  const clearAll = () => {
    commit({
      search: "",
      sort: "",
      genres: [],
      countries: [],
      languages: [],
      year_from: null,
      year_to: null,
      min_rating: "",
    });
  };

  const imdbLabel =
    IMDB_OPTIONS.find((item) => item.value === state.min_rating)?.label ?? "امتیاز IMDB";
  const sortLabel =
    filterOptions.sort_options.find((item) => item.value === state.sort)?.label ??
    "مرتب‌سازی براساس";

  return (
    <div dir="rtl" className="mb-4 space-y-3">
      <div className="hidden lg:block">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          <GenreFilterDropdown
            options={genreOptions}
            value={state.genres}
            onChange={(genres) => commit({ ...state, genres })}
            placeholder="ژانر"
          />

          <FilterDropdown label="امتیاز IMDB" valueLabel={imdbLabel} minWidth="240px">
            <div className="p-2">
              {IMDB_OPTIONS.filter((item) => item.value !== "").map((option) => (
                <FilterCheckbox
                  key={option.value}
                  checked={state.min_rating === option.value}
                  onChange={() => commit({ ...state, min_rating: option.value })}
                  label={option.label}
                />
              ))}
              {state.min_rating ? (
                <button
                  type="button"
                  onClick={() => commit({ ...state, min_rating: "" })}
                  className="mt-1 w-full px-3 py-2 text-right text-xs text-[#f5c518] hover:underline"
                >
                  حذف فیلتر امتیاز
                </button>
              ) : null}
            </div>
          </FilterDropdown>

          <YearRangeFilter
            min={yearMin}
            max={yearMax}
            from={state.year_from}
            to={state.year_to}
            onChange={(year_from, year_to) => commit({ ...state, year_from, year_to })}
          />

          <CountryFilterDropdown
            options={countryOptions}
            value={state.countries}
            onChange={(countries) => commit({ ...state, countries })}
            placeholder="کشور"
          />

          <FilterDropdown label="مرتب‌سازی براساس" valueLabel={sortLabel} minWidth="260px">
            <div className="p-2">
              {filterOptions.sort_options.map((option) => (
                <FilterCheckbox
                  key={option.value}
                  checked={state.sort === option.value}
                  onChange={() => commit({ ...state, sort: option.value })}
                  label={option.label}
                />
              ))}
            </div>
          </FilterDropdown>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1">
            <HiMagnifyingGlass className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={state.search}
              onChange={(event) => commitSearch(event.target.value)}
              placeholder="جستجو..."
              className="w-full rounded-xl border border-white/10 bg-[#1a1f2e] py-3.5 pr-10 pl-4 text-right text-sm text-white outline-none placeholder:text-white/35 focus:border-[#f5c518]/60"
            />
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 rounded-xl border border-white/15 bg-[#1a1f2e] px-5 py-3.5 text-sm text-white/85 transition hover:border-[#f5c518]/40 hover:bg-white/5"
          >
            حذف همه فیلترها
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => navigateContentType(kind === "movie" ? "series" : "movie")}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80"
        >
          {kind === "movie" ? "سریال" : "فیلم"}
        </button>
      </div>

      <div className="space-y-2 lg:hidden">
        <GenreFilterDropdown
          options={genreOptions}
          value={state.genres}
          onChange={(genres) => commit({ ...state, genres })}
          placeholder="ژانر"
        />
        <CountryFilterDropdown
          options={countryOptions}
          value={state.countries}
          onChange={(countries) => commit({ ...state, countries })}
          placeholder="کشور"
        />
        <YearRangeFilter
          min={yearMin}
          max={yearMax}
          from={state.year_from}
          to={state.year_to}
          onChange={(year_from, year_to) => commit({ ...state, year_from, year_to })}
        />
      </div>
    </div>
  );
}
