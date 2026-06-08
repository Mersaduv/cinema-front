// LEGACY — do not import. Catalog list pages use REST (see lib/catalog/rest.ts).

import {
  graphqlMovieCardToCatalogItem,
  graphqlSeriesCardToCatalogItem,
  type CatalogFilterMeta,
  type CatalogMovieItem,
  type GraphqlMovieListItem,
  type GraphqlSeriesListItem,
} from "./adapters";
import { graphqlRequest } from "./server";
import { GET_CATALOG_FILTER_META, GET_MOVIES_LIST, GET_SERIES_LIST } from "./queries";

const catalogFetchOptions = {
  revalidate: 60 as const,
  retries: 3,
  cache: "no-store" as RequestCache,
};

export async function fetchMoviesCatalog(options?: {
  page?: number;
  first?: number;
  genre?: string;
  search?: string;
  genre_ids?: string[];
  country_ids?: string[];
  year?: number;
  min_rating?: number;
  sort_by?: string;
}): Promise<{ items: CatalogMovieItem[]; error: string }> {
  try {
    const data = await graphqlRequest<{
      moviesList: {
        data: GraphqlMovieListItem[];
      };
    }>(
      GET_MOVIES_LIST,
      {
        page: options?.page ?? 1,
        first: options?.first ?? 24,
        genre: options?.genre,
        search: options?.search,
        genre_ids: options?.genre_ids,
        country_ids: options?.country_ids,
        year: options?.year,
        min_rating: options?.min_rating,
        sort_by: options?.sort_by,
      },
      {
        ...catalogFetchOptions,
        tags: ["catalog-movies"],
      },
    );

    return {
      items: (data.moviesList?.data ?? []).map(graphqlMovieCardToCatalogItem),
      error: "",
    };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : "دریافت فیلم‌ها انجام نشد.",
    };
  }
}

export async function fetchSeriesCatalog(options?: {
  page?: number;
  first?: number;
  search?: string;
  genre_ids?: string[];
  country_ids?: string[];
  year?: number;
  min_rating?: number;
  sort_by?: string;
}) {
  try {
    const data = await graphqlRequest<{
      seriesList: {
        data: GraphqlSeriesListItem[];
        paginatorInfo?: { total?: number };
      };
    }>(
      GET_SERIES_LIST,
      {
        page: options?.page ?? 1,
        first: options?.first ?? 24,
        search: options?.search,
        genre_ids: options?.genre_ids,
        country_ids: options?.country_ids,
        year: options?.year,
        min_rating: options?.min_rating,
        sort_by: options?.sort_by,
      },
      {
        ...catalogFetchOptions,
        tags: ["catalog-series"],
      },
    );

    return {
      items: (data.seriesList?.data ?? []).map(graphqlSeriesCardToCatalogItem),
      error: "",
      total: data.seriesList?.paginatorInfo?.total ?? 0,
    };
  } catch (error) {
    return {
      items: [],
      error:
        error instanceof Error ? error.message : "دریافت سریال‌ها انجام نشد.",
      total: 0,
    };
  }
}

export async function fetchCatalogFilterMeta(kind: "movie" | "series"): Promise<{
  data: CatalogFilterMeta;
  error: string;
}> {
  try {
    const result = await graphqlRequest<{ catalogFilterMeta: CatalogFilterMeta }>(
      GET_CATALOG_FILTER_META,
      { kind },
      {
        ...catalogFetchOptions,
        tags: [`catalog-filter-meta-${kind}`],
      },
    );

    return {
      data: result.catalogFilterMeta,
      error: "",
    };
  } catch (error) {
    return {
      data: {
        genres: [],
        countries: [],
        networks: [],
        years: [],
        show_types: [],
        min_rating: null,
        max_rating: null,
      },
      error: error instanceof Error ? error.message : "دریافت فیلترها انجام نشد.",
    };
  }
}
