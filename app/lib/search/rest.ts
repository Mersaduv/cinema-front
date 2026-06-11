import type { CatalogFiltersState } from "../catalog/search-params";
import {
  fetchMoviesCatalogRest,
  fetchSeriesCatalogRest,
  type CatalogListItem,
  type PaginationMeta,
} from "../catalog/rest";

const emptyMeta: PaginationMeta = {
  total: 0,
  per_page: 24,
  current_page: 1,
  last_page: 1,
};

export type SearchResults = {
  movies: CatalogListItem[];
  series: CatalogListItem[];
  moviesMeta: PaginationMeta;
  seriesMeta: PaginationMeta;
  error: string;
};

export async function fetchSearchResults(
  query: string,
  perPage = 24,
  signal?: AbortSignal,
): Promise<SearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      movies: [],
      series: [],
      moviesMeta: emptyMeta,
      seriesMeta: emptyMeta,
      error: "",
    };
  }

  const filters: CatalogFiltersState = {
    search: trimmed,
    sort: "",
    genres: [],
    countries: [],
    languages: [],
    year_from: null,
    year_to: null,
    min_rating: "",
  };

  const [moviesResult, seriesResult] = await Promise.all([
    fetchMoviesCatalogRest(filters, 1, perPage, signal),
    fetchSeriesCatalogRest(filters, 1, perPage, signal),
  ]);

  const errors = [moviesResult.error, seriesResult.error].filter(Boolean);

  return {
    movies: moviesResult.items,
    series: seriesResult.items,
    moviesMeta: moviesResult.meta,
    seriesMeta: seriesResult.meta,
    error: errors.join(" "),
  };
}
