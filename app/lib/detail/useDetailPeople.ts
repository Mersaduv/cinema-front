"use client";

import useSWR from "swr";
import {
  mergeMoviePeople,
  mergeSeriesPeople,
  type GraphqlSeriesOverview,
} from "../graphql/adapters";
import { graphqlRequest } from "../graphql/server";
import { GET_MOVIE_PEOPLE, GET_SERIES_PEOPLE } from "../graphql/queries";
import type { PublicMovie } from "../movies";
import type { PublicSeries } from "../series";
import { DETAIL_SWR_DEDUP_MS, DETAIL_MOVIE_REVALIDATE, DETAIL_SERIES_REVALIDATE } from "./constants";

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
      graphqlRequest<MoviePeoplePayload>(GET_MOVIE_PEOPLE, { slug }, {
        revalidate: DETAIL_MOVIE_REVALIDATE,
        tags: ["movies", `movie:${slug}`, `movie-people:${slug}`],
      }),
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
      graphqlRequest<SeriesPeoplePayload>(GET_SERIES_PEOPLE, { slug }, {
        revalidate: DETAIL_SERIES_REVALIDATE,
        tags: ["series", `series:${slug}`, `series-people:${slug}`],
      }),
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
