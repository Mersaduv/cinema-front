export type CatalogSearchParamsInput = Record<string, string | string[] | undefined>;

export const MAX_CATALOG_GENRES = 3;
export const MAX_CATALOG_COUNTRIES = 3;

export type CatalogFiltersState = {
  search: string;
  sort: string;
  genres: string[];
  countries: string[];
  languages: string[];
  year_from: number | null;
  year_to: number | null;
  min_rating: string;
};

export const EMPTY_CATALOG_FILTERS: CatalogFiltersState = {
  search: "",
  sort: "",
  genres: [],
  countries: [],
  languages: [],
  year_from: null,
  year_to: null,
  min_rating: "",
};

function first(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => item.split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toOptionalNumber(value: string | string[] | undefined): number | null {
  const raw = first(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseCatalogFilters(query: CatalogSearchParamsInput): CatalogFiltersState {
  const countries = toArray(query.countries ?? query.country_ids);
  const country = first(query.country_id ?? query.country);
  if (country && !countries.includes(country)) {
    countries.unshift(country);
  }

  const languages = toArray(query.languages ?? query.language_ids);
  const language = first(query.language);
  if (language && !languages.includes(language)) {
    languages.unshift(language);
  }

  const genreIds = toArray(query.genre_ids);
  const legacyGenres = toArray(query.genres);

  const genres = (genreIds.length > 0 ? genreIds : legacyGenres).slice(0, MAX_CATALOG_GENRES);

  return {
    search: first(query.search),
    sort: first(query.sort ?? query.sort_by),
    genres,
    countries: countries.slice(0, MAX_CATALOG_COUNTRIES),
    languages,
    year_from:
      toOptionalNumber(query.year_from) ??
      toOptionalNumber(query.year),
    year_to: toOptionalNumber(query.year_to),
    min_rating: first(query.min_rating),
  };
}

export function buildCatalogQueryString(
  state: CatalogFiltersState,
  page?: number,
): string {
  const params = new URLSearchParams();
  if (state.search.trim()) params.set("search", state.search.trim());
  if (state.sort) params.set("sort", state.sort);
  if (state.genres.length) params.set("genre_ids", state.genres.join(","));
  if (state.countries.length) params.set("countries", state.countries.join(","));
  if (state.languages.length) params.set("languages", state.languages.join(","));
  if (state.year_from) params.set("year_from", String(state.year_from));
  if (state.year_to) params.set("year_to", String(state.year_to));
  if (state.min_rating) params.set("min_rating", state.min_rating);
  if (page && page > 1) params.set("page", String(page));
  return params.toString();
}

export function catalogFiltersSignature(
  state: CatalogFiltersState,
  page = 1,
): string {
  return `${buildCatalogQueryString(state, page)}`;
}

export function countActiveFilters(state: CatalogFiltersState): number {
  let count = 0;
  if (state.search.trim()) count += 1;
  if (state.sort) count += 1;
  count += state.genres.length;
  count += state.countries.length;
  count += state.languages.length;
  if (state.year_from || state.year_to) count += 1;
  if (state.min_rating) count += 1;
  return count;
}

export function parseSearchParamsRecord(
  searchParams: URLSearchParams,
): CatalogSearchParamsInput {
  const record: CatalogSearchParamsInput = {};
  searchParams.forEach((value, key) => {
    const existing = record[key];
    if (existing === undefined) {
      record[key] = value;
    } else if (Array.isArray(existing)) {
      record[key] = [...existing, value];
    } else {
      record[key] = [existing, value];
    }
  });
  return record;
}
