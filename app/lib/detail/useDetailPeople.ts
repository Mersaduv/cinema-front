"use client";

import useSWR from "swr";
import {
  mergeMoviePeople,
  mergeSeriesPeople,
  type GraphqlSeriesOverview,
} from "../graphql/adapters";
import { graphqlBrowserRequest } from "../graphql/browser";
import { GET_MOVIE_PEOPLE, GET_SERIES_PEOPLE } from "../graphql/queries";
import type { PublicMovie } from "../movies";
import type { PublicSeries } from "../series";
import { DETAIL_SWR_DEDUP_MS } from "./constants";

type MoviePeoplePayload = {
  movie: Parameters<typeof mergeMoviePeople>[1] | null;
};

type SeriesPeoplePayload = {
  seriesOverview: Pick<
    GraphqlSeriesOverview,
    "cast" | "crew" | "details"
  > | null;
};

export function useMovieDetailPeople(
  slug: string,
  base: PublicMovie,
  enabled = true,
) {
  const { data, isLoading } = useSWR(
    enabled ? `movie-people:${slug}` : null,
    async () =>
      graphqlBrowserRequest<MoviePeoplePayload>(GET_MOVIE_PEOPLE, { slug }),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      dedupingInterval: DETAIL_SWR_DEDUP_MS,
    },
  );

  const movie = data?.movie ? mergeMoviePeople(base, data.movie) : base;

  return { movie, peopleLoading: enabled && isLoading && !data?.movie };
}

export function useSeriesDetailPeople(
  slug: string,
  base: PublicSeries,
  enabled = true,
) {
  const { data, isLoading } = useSWR(
    enabled ? `series-people:${slug}` : null,
    async () =>
      graphqlBrowserRequest<SeriesPeoplePayload>(GET_SERIES_PEOPLE, { slug }),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      dedupingInterval: DETAIL_SWR_DEDUP_MS,
    },
  );

  const series = data?.seriesOverview
    ? mergeSeriesPeople(base, data.seriesOverview)
    : base;

  return { series, peopleLoading: enabled && isLoading && !data?.seriesOverview };
}
