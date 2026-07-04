"use client";

import useSWR from "swr";
import {
  fetchFilterOptions,
  type FilterOptions,
} from "../lib/filter-options";
import { REVISIT_DEDUPING_MS } from "../lib/swr/public-cache";

const EMPTY_FILTER_OPTIONS: FilterOptions = {
  movie_genres: [],
  tv_genres: [],
  countries: [],
  languages: [],
  release_years: [],
  age_ratings: [],
  content_types: [],
  sort_options: [],
};

export function useFilterOptions() {
  const { data, isLoading, isValidating } = useSWR(
    "filter-options",
    () => fetchFilterOptions(),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      dedupingInterval: REVISIT_DEDUPING_MS,
    },
  );

  const filterOptions = data ?? EMPTY_FILTER_OPTIONS;
  const filterOptionsLoading =
    (isLoading || isValidating) && filterOptions.movie_genres.length === 0;

  return { filterOptions, filterOptionsLoading };
}
