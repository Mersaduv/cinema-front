"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiMagnifyingGlass, HiAdjustmentsHorizontal } from "react-icons/hi2";
import CountryFilterDropdown from "./CountryFilterDropdown";
import FilterDropdown from "./FilterDropdown";
import AnimationSubtypeFilter from "./AnimationSubtypeFilter";
import GenreFilterDropdown from "./GenreFilterDropdown";
import YearRangeFilter from "./YearRangeFilter";
import TvFilterSheet from "../tv/TvFilterSheet";
import TvOnScreenSearchPad, { needsOnScreenSearchKeyboard } from "../tv/TvOnScreenSearchPad";
import { useIsTv, useTvCapabilities } from "../../hooks/useTvCapabilities";
import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import {
  DEFAULT_ANIMATION_SUBTYPES,
  type SelectableAnimationSubtype,
} from "../../lib/catalog/animation";
import FilterCheckbox from "../ui/FilterCheckbox";
import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import {
  buildCatalogQueryString,
  EMPTY_CATALOG_FILTERS,
} from "../../lib/catalog/search-params";
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
  hideGenreFilter = false,
  animationSubtypeMode = false,
  animationSubtypes = DEFAULT_ANIMATION_SUBTYPES,
  onAnimationSubtypesChange,
  onClearAll,
}: {
  kind: "movie" | "series";
  filters: CatalogFiltersState;
  filterOptions: FilterOptions;
  onFiltersChange?: (next: CatalogFiltersState) => void;
  hideGenreFilter?: boolean;
  animationSubtypeMode?: boolean;
  animationSubtypes?: SelectableAnimationSubtype[];
  onAnimationSubtypesChange?: (subtypes: SelectableAnimationSubtype[]) => void;
  onClearAll?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const isTv = useIsTv();
  const capabilities = useTvCapabilities();
  const useSearchPad = isTv && needsOnScreenSearchKeyboard(capabilities.family);
  const openerRef = useRef<HTMLButtonElement>(null);
  const [tvFilterOpen, setTvFilterOpen] = useState(false);
  const [searchPadOpen, setSearchPadOpen] = useState(false);
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
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    setState(EMPTY_CATALOG_FILTERS);

    if (onClearAll) {
      onClearAll();
      return;
    }

    commit(EMPTY_CATALOG_FILTERS);
  };

  const imdbLabel =
    IMDB_OPTIONS.find((item) => item.value === state.min_rating)?.label ?? "امتیاز IMDB";
  const sortLabel =
    filterOptions.sort_options.find((item) => item.value === state.sort)?.label ??
    "مرتب‌سازی براساس";

  const closeFilterSheet = useCallback(() => {
    setTvFilterOpen(false);
    requestAnimationFrame(() => {
      openerRef.current?.focus();
    });
  }, []);

  if (isTv) {
    return (
      <>
        <div dir="rtl" className="flex flex-wrap items-center gap-3">
          <button
            ref={openerRef}
            type="button"
            data-tv-focusable
            onClick={() => setTvFilterOpen(true)}
            className={`inline-flex items-center gap-2 rounded-xl border border-white/12 bg-[#0d1118] px-5 py-3.5 text-sm text-white/90 ${TV_FOCUS_RING_CLASS}`}
          >
            <HiAdjustmentsHorizontal className="h-5 w-5" />
            فیلترها
          </button>
          <button
            type="button"
            data-tv-focusable
            onClick={clearAll}
            className={`rounded-xl border border-white/12 bg-[#0d1118] px-5 py-3.5 text-sm text-white/80 ${TV_FOCUS_RING_CLASS}`}
          >
            حذف همه فیلترها
          </button>
          <div className="relative min-w-[240px] flex-1">
            {useSearchPad ? (
              <button
                type="button"
                data-tv-focusable
                onClick={() => setSearchPadOpen(true)}
                className={`flex w-full items-center gap-2 rounded-xl border border-white/10 bg-[#0d1118] py-3.5 pr-4 pl-4 text-right text-sm text-white/70 ${TV_FOCUS_RING_CLASS}`}
              >
                <HiMagnifyingGlass className="h-4 w-4 shrink-0 text-white/40" />
                {state.search || "جستجو با صفحه‌کلید روی صفحه…"}
              </button>
            ) : (
              <>
                <HiMagnifyingGlass className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  data-tv-focusable
                  value={state.search}
                  onChange={(event) => commitSearch(event.target.value)}
                  placeholder="جستجو..."
                  className={`w-full rounded-xl border border-white/10 bg-[#0d1118] py-3.5 pr-10 pl-4 text-right text-sm text-white outline-none placeholder:text-white/35 focus:border-[#38bdf8]/50 ${TV_FOCUS_RING_CLASS}`}
                />
              </>
            )}
          </div>
        </div>
        <TvOnScreenSearchPad
          open={searchPadOpen}
          value={state.search}
          onChange={(search) => commitSearch(search)}
          onSubmit={() => commit({ ...stateRef.current, search: stateRef.current.search })}
          onClose={() => setSearchPadOpen(false)}
        />
        <TvFilterSheet
          open={tvFilterOpen}
          onClose={closeFilterSheet}
          kind={kind}
          filters={state}
          filterOptions={filterOptions}
          onApply={(next) => commit(next)}
        />
      </>
    );
  }

  return (
    <div dir="rtl" className="relative z-30 space-y-3 overflow-visible">
      <div className="hidden overflow-visible lg:block">
        <div
          className={`grid grid-cols-2 gap-2 overflow-visible sm:grid-cols-3 ${
            animationSubtypeMode || !hideGenreFilter ? "xl:grid-cols-5" : "xl:grid-cols-4"
          }`}
        >
          {animationSubtypeMode && onAnimationSubtypesChange ? (
            <AnimationSubtypeFilter
              value={animationSubtypes}
              onChange={onAnimationSubtypesChange}
            />
          ) : null}

          {hideGenreFilter ? null : (
            <GenreFilterDropdown
              options={genreOptions}
              value={state.genres}
              onChange={(genres) => commit({ ...state, genres })}
              placeholder="ژانر"
            />
          )}

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
          <button
            type="button"
            onClick={clearAll}
            className="order-2 shrink-0 rounded-xl border border-white/12 bg-[#0d1118] px-5 py-3.5 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/[0.04] lg:order-2"
          >
            حذف همه فیلترها
          </button>
          <div className="relative order-1 min-w-[240px] flex-1 lg:order-1">
            <HiMagnifyingGlass className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={state.search}
              onChange={(event) => commitSearch(event.target.value)}
              placeholder="جستجو..."
              className="w-full rounded-xl border border-white/10 bg-[#0d1118] py-3.5 pr-10 pl-4 text-right text-sm text-white outline-none placeholder:text-white/35 focus:border-[#3b82f6]/50"
            />
          </div>
        </div>
      </div>

      {!animationSubtypeMode ? (
        <div className="flex flex-wrap gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => navigateContentType(kind === "movie" ? "series" : "movie")}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80"
          >
            {kind === "movie" ? "سریال" : "فیلم"}
          </button>
        </div>
      ) : null}

      <div className="relative z-30 space-y-2 overflow-visible lg:hidden">
        {animationSubtypeMode && onAnimationSubtypesChange ? (
          <AnimationSubtypeFilter
            value={animationSubtypes}
            onChange={onAnimationSubtypesChange}
          />
        ) : null}
        {hideGenreFilter ? null : (
          <GenreFilterDropdown
            options={genreOptions}
            value={state.genres}
            onChange={(genres) => commit({ ...state, genres })}
            placeholder="ژانر"
          />
        )}
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
        <button
          type="button"
          onClick={clearAll}
          className="w-full rounded-xl border border-white/12 bg-[#0d1118] px-5 py-3.5 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]"
        >
          حذف همه فیلترها
        </button>
      </div>
    </div>
  );
}
