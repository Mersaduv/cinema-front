import { cache } from "react";
import {
  graphqlMovieToPublic,
  graphqlSeriesOverviewToPublic,
  type GraphqlSeriesOverview,
} from "../graphql/adapters";
import { graphqlRequest } from "../graphql/server";
import {
  GET_MOVIE_CRITICAL,
  GET_MOVIE_META,
  GET_SERIES_META,
  GET_SERIES_OVERVIEW_CRITICAL,
} from "../graphql/queries";
import type { PublicMovie } from "../movies";
import type { PublicSeries } from "../series";
import {
  DETAIL_MOVIE_REVALIDATE,
  DETAIL_SERIES_REVALIDATE,
} from "./constants";

type GraphqlMovieCritical = Parameters<typeof graphqlMovieToPublic>[0];

export const fetchMovieMetaBySlug = cache(async (slug: string) => {
  const data = await graphqlRequest<{
    movie: {
      title: string;
      meta_title?: string | null;
      meta_description?: string | null;
      synopsis?: string | null;
      poster_url?: string | null;
    } | null;
  }>(GET_MOVIE_META, { slug }, {
    revalidate: DETAIL_MOVIE_REVALIDATE,
    tags: ["movies", `movie:${slug}`],
  });

  return data.movie;
});

export const fetchMovieCriticalBySlug = cache(async (slug: string) => {
  const data = await graphqlRequest<{ movie: GraphqlMovieCritical | null }>(
    GET_MOVIE_CRITICAL,
    { slug },
    {
      revalidate: DETAIL_MOVIE_REVALIDATE,
      tags: ["movies", `movie:${slug}`, `movie-critical:${slug}`],
      retries: 3,
    },
  );

  if (!data.movie) {
    return null;
  }

  return graphqlMovieToPublic(data.movie);
});

export const fetchSeriesMetaBySlug = cache(async (slug: string) => {
  const data = await graphqlRequest<{
    seriesOverview: {
      title: string;
      meta_title?: string | null;
      meta_description?: string | null;
      synopsis?: string | null;
      poster_url?: string | null;
      poster_image?: { src?: string | null; original?: string | null } | null;
    } | null;
  }>(GET_SERIES_META, { slug }, {
    revalidate: DETAIL_SERIES_REVALIDATE,
    tags: ["series", `series:${slug}`],
  });

  return data.seriesOverview;
});

export const fetchSeriesCriticalBySlug = cache(async (slug: string) => {
  const data = await graphqlRequest<{ seriesOverview: GraphqlSeriesOverview | null }>(
    GET_SERIES_OVERVIEW_CRITICAL,
    { slug },
    {
      revalidate: DETAIL_SERIES_REVALIDATE,
      tags: ["series", `series:${slug}`, `series-critical:${slug}`],
      retries: 3,
    },
  );

  if (!data.seriesOverview) {
    return null;
  }

  return graphqlSeriesOverviewToPublic(data.seriesOverview);
});

export type { PublicMovie, PublicSeries };
