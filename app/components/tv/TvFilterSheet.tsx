"use client";

import { useCallback, useEffect, useState } from "react";
import { HiXMark } from "react-icons/hi2";
import FilterCheckbox from "../ui/FilterCheckbox";
import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import { EMPTY_CATALOG_FILTERS } from "../../lib/catalog/search-params";
import type { FilterOptions } from "../../lib/filter-options";
import { buildGenreFilterOptions } from "../../lib/catalog/genre-filter-options";
import { useTvBodyScrollLock } from "../../hooks/useTvBodyScrollLock";
import { isBackKey, TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";
import TvOverlayPortal from "./TvOverlayPortal";

const IMDB_OPTIONS = [
  { value: "", label: "همه امتیازها" },
  { value: "6", label: "۶ به بالا" },
  { value: "7", label: "۷ به بالا" },
  { value: "8", label: "۸ به بالا" },
  { value: "9", label: "۹ به بالا" },
];

function chipClass(selected: boolean): string {
  return `rounded-full px-4 py-2 text-sm font-medium transition ${TV_FOCUS_RING_CLASS} ${
    selected
      ? "bg-[#f5c518] text-[#12100a]"
      : "border border-white/12 bg-white/[0.04] text-white/80"
  }`;
}

export default function TvFilterSheet({
  open,
  onClose,
  kind,
  filters,
  filterOptions,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  kind: "movie" | "series";
  filters: CatalogFiltersState;
  filterOptions: FilterOptions;
  onApply: (next: CatalogFiltersState) => void;
}) {
  const [draft, setDraft] = useState(filters);

  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [filters, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (isBackKey(event)) {
        event.preventDefault();
        closeSheet();
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [closeSheet, open]);

  useTvBodyScrollLock(open);

  if (!open) {
    return null;
  }

  const catalogGenres =
    filterOptions.catalog_genres ??
    (kind === "movie" ? filterOptions.movie_genres : filterOptions.tv_genres);
  const genreOptions = buildGenreFilterOptions(catalogGenres);

  const countryOptions = filterOptions.countries.map((country) => ({
    value: country.iso,
    label: country.name,
  }));

  const languageOptions = filterOptions.languages.map((language) => ({
    value: language.iso,
    label: language.name,
  }));

  const yearMin = 1900;
  const yearMax = Math.max(
    new Date().getFullYear(),
    ...(filterOptions.release_years.length ? filterOptions.release_years : [yearMin]),
  );
  const yearOptions = (
    filterOptions.release_years.length > 0
      ? [...filterOptions.release_years]
      : Array.from({ length: yearMax - yearMin + 1 }, (_, index) => yearMax - index)
  ).slice(0, 24);

  const apply = () => {
    onApply(draft);
    closeSheet();
  };

  return (
    <TvOverlayPortal>
      <div
        className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-[#05070b]"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="فیلترها"
        data-tv-filter-sheet
        data-tv-focus-group="filter-sheet"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-bold text-white">فیلترها</h2>
          <button
            type="button"
            data-tv-focusable
            onClick={closeSheet}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white ${TV_FOCUS_RING_CLASS}`}
            aria-label="بستن"
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6"
          data-tv-filter-sheet-body
        >
        <section>
          <h3 className="mb-3 text-sm font-semibold text-white/60">ژانر</h3>
          <div className="flex flex-wrap gap-2">
            {genreOptions.map((genre) => {
              const selected = draft.genres.includes(genre.value);

              return (
                <button
                  key={genre.value}
                  type="button"
                  data-tv-focusable
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      genres: selected
                        ? current.genres.filter((id) => id !== genre.value)
                        : [...current.genres, genre.value],
                    }))
                  }
                  className={chipClass(selected)}
                >
                  {genre.label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white/60">کشور</h3>
          <div className="flex flex-wrap gap-2">
            {countryOptions.map((country) => {
              const selected = draft.countries.includes(country.value);

              return (
                <button
                  key={country.value}
                  type="button"
                  data-tv-focusable
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      countries: selected
                        ? current.countries.filter((iso) => iso !== country.value)
                        : [...current.countries, country.value],
                    }))
                  }
                  className={chipClass(selected)}
                >
                  {country.label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white/60">زبان</h3>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((language) => {
              const selected = draft.languages.includes(language.value);

              return (
                <button
                  key={language.value}
                  type="button"
                  data-tv-focusable
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      languages: selected
                        ? current.languages.filter((iso) => iso !== language.value)
                        : [...current.languages, language.value],
                    }))
                  }
                  className={chipClass(selected)}
                >
                  {language.label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white/60">سال</h3>
          <p className="mb-2 text-xs text-white/45">از سال</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              data-tv-focusable
              onClick={() => setDraft((current) => ({ ...current, year_from: null }))}
              className={chipClass(draft.year_from === null)}
            >
              همه
            </button>
            {yearOptions.map((year) => (
              <button
                key={`from-${year}`}
                type="button"
                data-tv-focusable
                onClick={() => setDraft((current) => ({ ...current, year_from: year }))}
                className={chipClass(draft.year_from === year)}
              >
                {year}
              </button>
            ))}
          </div>
          <p className="mb-2 text-xs text-white/45">تا سال</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-tv-focusable
              onClick={() => setDraft((current) => ({ ...current, year_to: null }))}
              className={chipClass(draft.year_to === null)}
            >
              همه
            </button>
            {yearOptions.map((year) => (
              <button
                key={`to-${year}`}
                type="button"
                data-tv-focusable
                onClick={() => setDraft((current) => ({ ...current, year_to: year }))}
                className={chipClass(draft.year_to === year)}
              >
                {year}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white/60">امتیاز IMDB</h3>
          <div className="space-y-1">
            {IMDB_OPTIONS.map((option) => (
              <FilterCheckbox
                key={option.value || "all"}
                checked={draft.min_rating === option.value}
                onChange={() => setDraft((current) => ({ ...current, min_rating: option.value }))}
                label={option.label}
                tvFocusable
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-white/60">مرتب‌سازی</h3>
          <div className="space-y-1">
            {filterOptions.sort_options.map((option) => (
              <FilterCheckbox
                key={option.value}
                checked={draft.sort === option.value}
                onChange={() => setDraft((current) => ({ ...current, sort: option.value }))}
                label={option.label}
                tvFocusable
              />
            ))}
          </div>
        </section>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-white/10 px-6 py-5">
        <button
          type="button"
          data-tv-focusable
          onClick={() => {
            setDraft(EMPTY_CATALOG_FILTERS);
            onApply(EMPTY_CATALOG_FILTERS);
            closeSheet();
          }}
          className={`flex-1 rounded-2xl border border-white/12 py-3.5 text-sm text-white/80 ${TV_FOCUS_RING_CLASS}`}
        >
          حذف همه
        </button>
        <button
          type="button"
          data-tv-focusable
          onClick={apply}
          className={`flex-1 rounded-2xl bg-[#f5c518] py-3.5 text-sm font-bold text-[#12100a] ${TV_FOCUS_RING_CLASS}`}
        >
          اعمال فیلتر
        </button>
      </div>
    </div>
    </TvOverlayPortal>
  );
}
