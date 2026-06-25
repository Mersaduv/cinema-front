"use client";

import type { CatalogFiltersState } from "../../lib/catalog/search-params";
import type { FilterOptions } from "../../lib/filter-options";
import { HiXMark } from "react-icons/hi2";
import { useIsTvCompat } from "../../hooks/useTvCapabilities";
import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";

export default function ActiveFilterChips({
  filters,
  filterOptions,
  onChange,
  onClearAll,
  lockedGenres = [],
  lockedGenreLabels = {},
}: {
  filters: CatalogFiltersState;
  filterOptions: FilterOptions;
  onChange: (next: CatalogFiltersState) => void;
  onClearAll: () => void;
  lockedGenres?: string[];
  lockedGenreLabels?: Record<string, string>;
}) {
  const isTvCompat = useIsTvCompat();
  const allGenres =
    filterOptions.catalog_genres ?? [
      ...filterOptions.movie_genres,
      ...filterOptions.tv_genres,
    ];
  const genreLabel = new Map(
    allGenres.flatMap((genre) => [
      [String(genre.id), genre.name],
      [genre.slug, genre.name],
    ]),
  );
  const countryLabel = new Map(
    filterOptions.countries.map((country) => [country.iso, country.name]),
  );
  const languageLabel = new Map(
    filterOptions.languages.map((language) => [language.iso, language.name]),
  );

  const chips: Array<{ key: string; label: string; locked?: boolean; remove?: () => void }> = [];

  filters.genres.forEach((slug) => {
    const locked = lockedGenres.includes(slug);
    chips.push({
      key: `genre-${slug}`,
      label: lockedGenreLabels[slug] ?? genreLabel.get(slug) ?? slug,
      locked,
      remove: locked
        ? undefined
        : () =>
            onChange({
              ...filters,
              genres: filters.genres.filter((item) => item !== slug),
            }),
    });
  });

  filters.countries.forEach((iso) => {
    chips.push({
      key: `country-${iso}`,
      label: countryLabel.get(iso) ?? iso,
      remove: () =>
        onChange({
          ...filters,
          countries: filters.countries.filter((item) => item !== iso),
        }),
    });
  });

  filters.languages.forEach((iso) => {
    chips.push({
      key: `lang-${iso}`,
      label: languageLabel.get(iso) ?? iso,
      remove: () =>
        onChange({
          ...filters,
          languages: filters.languages.filter((item) => item !== iso),
        }),
    });
  });

  if (filters.year_from || filters.year_to) {
    chips.push({
      key: "year-range",
      label: `${filters.year_from ?? "…"}–${filters.year_to ?? "…"}`,
      remove: () => onChange({ ...filters, year_from: null, year_to: null }),
    });
  }

  if (filters.min_rating) {
    chips.push({
      key: "rating",
      label: `IMDb ${filters.min_rating}+`,
      remove: () => onChange({ ...filters, min_rating: "" }),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-start gap-2">
      {chips.map((chip) =>
        chip.locked ? (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-full border border-[#a855f7]/25 bg-[#a855f7]/10 px-3 py-1 text-xs text-[#e9d5ff]"
          >
            <span>{chip.label}</span>
          </span>
        ) : (
          <button
            key={chip.key}
            type="button"
            data-tv-focusable={isTvCompat ? true : undefined}
            onClick={chip.remove}
            className={`inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs text-white/85 hover:bg-white/10 ${isTvCompat ? TV_FOCUS_RING_CLASS : ""}`}
          >
            <HiXMark className="h-3.5 w-3.5" />
            <span>{chip.label}</span>
          </button>
        ),
      )}
      <button
        type="button"
        data-tv-focusable={isTvCompat ? true : undefined}
        onClick={onClearAll}
        className={`text-xs text-[#60a5fa] hover:underline ${isTvCompat ? TV_FOCUS_RING_CLASS : ""}`}
      >
        پاک کردن همه
      </button>
    </div>
  );
}
