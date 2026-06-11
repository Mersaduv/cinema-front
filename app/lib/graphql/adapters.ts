import {
  normalizeImageAsset,
  pickImageSrc,
  pickProfileImageSrc,
  type ResponsiveImageAsset,
} from "../cinema-image";
import type { PublicMovie } from "../movies";
import type { PublicSeries, PublicSeriesSeason } from "../series";
import type { Review, ReviewsPayload } from "../reviews";

type GraphqlResponsiveImage = {
  original?: string | null;
  blur?: string | null;
  src?: string | null;
  srcset?: Array<{ url: string; width: number; descriptor?: string }>;
  srcset_string?: string | null;
  width?: number | null;
  height?: number | null;
  mime_type?: string | null;
};

function mapResponsiveImage(
  image?: GraphqlResponsiveImage | null,
): ResponsiveImageAsset | null {
  return normalizeImageAsset(image);
}

type GraphqlMovieDetail = {
  id: string;
  slug: string;
  title: string;
  original_title?: string | null;
  synopsis?: string | null;
  release_year?: number | null;
  duration_seconds?: number | null;
  age_rating?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  poster_image?: GraphqlResponsiveImage | null;
  backdrop_image?: GraphqlResponsiveImage | null;
  trailer_url?: string | null;
  has_dubbed_audio: boolean;
  has_subtitle: boolean;
  genres?: string[];
  genre_tags?: Array<{ id: string; slug: string; name: string }>;
  provider_name?: string | null;
  tmdb_id?: number | null;
  details?: {
    rating?: number | null;
    original_language?: string | null;
    directors?: string[];
    writers?: string[];
    genres?: string[];
    languages?: string[];
    countries?: string[];
    network?: string | null;
    runtime_minutes?: number | null;
    actors?: Array<{
      name?: string | null;
      character?: string | null;
      profile_url?: string | null;
      profile_image?: GraphqlResponsiveImage | null;
    }>;
    gallery?: string[];
  } | null;
  cast?: Array<{
    character_name?: string | null;
    order?: number | null;
    person: {
      slug: string;
      name: string;
      profile_url?: string | null;
      profile_image?: GraphqlResponsiveImage | null;
    };
  }>;
  crew?: Array<{
    job: string;
    department?: string | null;
    person: {
      slug: string;
      name: string;
      profile_url?: string | null;
      profile_image?: GraphqlResponsiveImage | null;
    };
  }>;
  metadata?: {
    playback?: {
      hls_url?: string | null;
      downloads?: Array<{ quality: string; url: string }>;
    } | null;
  } | null;
  cached_avg_rating?: number | null;
  reviews?: GraphqlReviewsPayload | null;
};

type GraphqlReviewsPayload = {
  reviews?: Array<{
    id: string;
    user: { id: string; name: string; avatar_url?: string | null };
    rating: number;
    body?: string | null;
    created_at: string;
    is_own: boolean;
  }>;
  summary?: {
    total_count: number;
    average_rating: number;
    distribution:
      | Record<string, number>
      | Array<{ rating: number; count: number }>;
  };
  paginatorInfo?: {
    currentPage: number;
    lastPage: number;
    total: number;
  };
  user_review?: {
    id: string;
    rating: number;
    body?: string | null;
  } | null;
};

export type GraphqlSeriesOverview = {
  id: string;
  slug: string;
  title: string;
  original_title?: string | null;
  synopsis?: string | null;
  release_year?: number | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  status?: string | null;
  status_label_fa?: string | null;
  episode_runtime_minutes?: number | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  network?: string | null;
  provider_name?: string | null;
  genre_tags?: Array<{ id: string; slug: string; name: string }>;
  poster_url?: string | null;
  backdrop_url?: string | null;
  poster_image?: GraphqlResponsiveImage | null;
  backdrop_image?: GraphqlResponsiveImage | null;
  trailer_url?: string | null;
  age_rating?: string | null;
  has_subtitle?: boolean;
  has_dubbed?: boolean;
  total_seasons?: number | null;
  seasons?: Array<{ id: string; season_number: number; title?: string | null }>;
  cast?: Array<{
    name?: string | null;
    slug?: string | null;
    character_name?: string | null;
    profile_url?: string | null;
    profile_image?: GraphqlResponsiveImage | null;
    order?: number | null;
  }>;
  crew?: Array<{
    name?: string | null;
    slug?: string | null;
    job?: string | null;
    department?: string | null;
    profile_url?: string | null;
    profile_image?: GraphqlResponsiveImage | null;
  }>;
  details: {
    backdrop_url?: string | null;
    rating?: number | null;
    original_language?: string | null;
    creators?: string[];
    directors?: string[];
    writers?: string[];
    genres?: string[];
    languages?: string[];
    countries?: string[];
    network?: string | null;
    actors?: Array<{
      name?: string | null;
      character?: string | null;
      profile_url?: string | null;
      profile_image?: GraphqlResponsiveImage | null;
    }>;
    gallery?: string[];
  };
  cached_avg_rating?: number | null;
  reviews?: GraphqlReviewsPayload | null;
};

function mapGraphqlReviews(payload?: GraphqlReviewsPayload | null): ReviewsPayload | undefined {
  if (!payload) {
    return undefined;
  }

  const mapReview = (
    row: NonNullable<GraphqlReviewsPayload["reviews"]>[number] | NonNullable<GraphqlReviewsPayload["user_review"]>,
    includeUser = true,
  ) => {
    const user = "user" in row && row.user ? row.user : { id: "0", name: "", avatar_url: null };

    return {
      id: Number(row.id),
      user: {
        id: Number(user.id),
        name: user.name,
        avatar_url: user.avatar_url ?? null,
      },
      rating: Number(row.rating),
      body: ("body" in row ? row.body : null) ?? null,
      status: "status" in row ? (row.status as Review["status"]) : undefined,
      is_pending:
        "is_pending" in row
          ? Boolean(row.is_pending)
          : "status" in row && row.status === "pending",
      created_at: "created_at" in row ? row.created_at : "",
      is_own: "is_own" in row ? Boolean(row.is_own) : false,
    };
  };

  const distribution = Array.isArray(payload.summary?.distribution)
    ? Object.fromEntries(
        payload.summary.distribution.map((bucket) => [
          String(bucket.rating),
          bucket.count,
        ]),
      )
    : (payload.summary?.distribution ?? Object.fromEntries(
        Array.from({ length: 10 }, (_, index) => [String(index + 1), 0]),
      ));

  return {
    reviews: (payload.reviews ?? []).map((row) => mapReview(row)),
    summary: {
      total_count: payload.summary?.total_count ?? 0,
      average_rating: payload.summary?.average_rating ?? 0,
      distribution,
    },
    user_review: payload.user_review ? mapReview(payload.user_review, false) : null,
    paginatorInfo: payload.paginatorInfo ?? {
      currentPage: 1,
      lastPage: 1,
      total: 0,
    },
  };
}

export type GraphqlSeriesListItem = {
  id: string;
  slug: string;
  title: string;
  synopsis?: string | null;
  release_year?: number | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  status?: string | null;
  has_subtitle?: boolean;
  has_dubbed?: boolean;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  list_meta?: {
    status_label_fa?: string | null;
    poster_url?: string | null;
    backdrop_url?: string | null;
    poster_image?: GraphqlResponsiveImage | null;
    backdrop_image?: GraphqlResponsiveImage | null;
    genres?: string[];
    rating?: number | null;
    detail_backdrop_url?: string | null;
  };
};

export function graphqlMovieToPublic(movie: GraphqlMovieDetail): PublicMovie {
  const downloads = movie.metadata?.playback?.downloads ?? [];
  const downloadRecord = Object.fromEntries(
    downloads.map((item) => [item.quality, item.url]),
  );
  const details = movie.details ?? null;

  return {
    id: Number(movie.id),
    title: movie.title,
    slug: movie.slug,
    tmdb_id: movie.tmdb_id ?? null,
    original_title: movie.original_title ?? null,
    synopsis: movie.synopsis ?? null,
    release_year: movie.release_year ?? null,
    duration_seconds: movie.duration_seconds ?? null,
    provider_name: movie.provider_name ?? details?.network ?? null,
    genres:
      movie.genre_tags?.map((genre) => ({
        id: Number(genre.id),
        tmdb_id: null,
        name: genre.name,
        slug: genre.slug,
      })) ?? [],
    poster_image: mapResponsiveImage(movie.poster_image),
    backdrop_image: mapResponsiveImage(movie.backdrop_image),
    poster_url:
      pickImageSrc(movie.poster_image, movie.poster_url) ?? movie.poster_url ?? null,
    trailer_url: movie.trailer_url ?? null,
    has_dubbed_audio: movie.has_dubbed_audio,
    audio_tracks: [],
    has_subtitle: movie.has_subtitle,
    subtitle_source_url: null,
    age_rating: movie.age_rating ?? null,
    cast_members: [],
    cast:
      movie.cast?.map((row) => {
        const profileImage = mapResponsiveImage(row.person.profile_image);
        const metadataActor = movie.details?.actors?.find(
          (actor) => actor.name && actor.name === row.person.name,
        );
        const metadataProfileImage = mapResponsiveImage(metadataActor?.profile_image);

        return {
          name: row.person.name,
          slug: row.person.slug,
          character: row.character_name ?? null,
          profile_url:
            pickProfileImageSrc(metadataProfileImage, metadataActor?.profile_url) ??
            pickProfileImageSrc(profileImage, row.person.profile_url),
          profile_image: metadataProfileImage ?? profileImage,
          order: row.order ?? null,
        };
      }) ?? [],
    crew:
      movie.crew?.map((row) => {
        const profileImage = mapResponsiveImage(row.person.profile_image);

        return {
          name: row.person.name,
          slug: row.person.slug,
          job: row.job,
          department: row.department ?? null,
          profile_url: pickProfileImageSrc(profileImage, row.person.profile_url),
          profile_image: profileImage,
        };
      }) ?? [],
    publish_status: "published",
    download_links: downloadRecord,
    details: {
      backdrop_url:
        pickImageSrc(movie.backdrop_image, movie.backdrop_url, movie.poster_url) ??
        movie.backdrop_url ??
        movie.poster_url ??
        null,
      rating: details?.rating ?? null,
      original_language: details?.original_language ?? null,
      network: details?.network ?? null,
      runtime_minutes: details?.runtime_minutes ?? null,
      directors: details?.directors ?? [],
      writers: details?.writers ?? [],
      genres: details?.genres ?? movie.genres ?? [],
      languages: details?.languages ?? [],
      countries: details?.countries ?? [],
      actors:
        details?.actors?.map((actor) => {
          const profileImage = mapResponsiveImage(actor.profile_image);

          return {
            name: actor.name ?? null,
            character: actor.character ?? null,
            profile_url: pickProfileImageSrc(profileImage, actor.profile_url),
            profile_image: profileImage,
          };
        }) ??
        movie.cast?.map((row) => {
          const profileImage = mapResponsiveImage(row.person.profile_image);

          return {
            name: row.person.name,
            character: row.character_name ?? null,
            profile_url: pickProfileImageSrc(profileImage, row.person.profile_url),
            profile_image: profileImage,
          };
        }) ??
        [],
      gallery: details?.gallery ?? (movie.poster_url ? [movie.poster_url] : []),
    },
    playback: movie.metadata?.playback?.hls_url
      ? {
          master_playlist_url: movie.metadata.playback.hls_url,
          subtitle_url: null,
          audio_tracks: [],
          variants: [],
        }
      : null,
    reviews: mapGraphqlReviews(movie.reviews),
    cached_avg_rating: movie.cached_avg_rating ?? null,
  };
}

function emptySeriesDetails(): PublicSeries["details"] {
  return {
    backdrop_url: null,
    rating: null,
    original_language: null,
    creators: [],
    directors: [],
    writers: [],
    genres: [],
    languages: [],
    countries: [],
    network: null,
    actors: [],
    gallery: [],
  };
}

function mapSeriesDetails(
  details?: GraphqlSeriesOverview["details"],
): PublicSeries["details"] {
  if (!details) {
    return emptySeriesDetails();
  }

  return {
    backdrop_url: details.backdrop_url ?? null,
    rating: details.rating ?? null,
    original_language: details.original_language ?? null,
    creators: details.creators ?? [],
    directors: details.directors ?? [],
    writers: details.writers ?? [],
    genres: details.genres ?? [],
    languages: details.languages ?? [],
    countries: details.countries ?? [],
    network: details.network ?? null,
    actors:
      details.actors?.map((actor) => {
        const profileImage = mapResponsiveImage(actor.profile_image);

        return {
          name: actor.name ?? null,
          character: actor.character ?? null,
          profile_url: pickProfileImageSrc(profileImage, actor.profile_url),
          profile_image: profileImage,
        };
      }) ?? [],
    gallery: details.gallery ?? [],
  };
}

export function graphqlSeriesOverviewToPublic(
  series: GraphqlSeriesOverview,
): PublicSeries {
  const seasons: PublicSeriesSeason[] =
    series.seasons?.map((season) => {
      const parsedId = Number(season.id);

      return {
        id:
          Number.isFinite(parsedId) && parsedId > 0
            ? parsedId
            : -season.season_number,
        season_number: season.season_number,
        name: season.title ?? null,
        synopsis: null,
        air_date: null,
        episode_count: 0,
        poster_url: null,
        episodes: [],
      };
    }) ?? [];

  const details = mapSeriesDetails(series.details);

  return {
    id: Number(series.id),
    title: series.title,
    slug: series.slug,
    original_title: series.original_title ?? null,
    synopsis: series.synopsis ?? null,
    first_air_date: series.first_air_date ?? null,
    last_air_date: series.last_air_date ?? null,
    release_year: series.release_year ?? null,
    status: series.status ?? null,
    status_label_fa: series.status_label_fa ?? null,
    episode_runtime_minutes: series.episode_runtime_minutes ?? null,
    number_of_seasons: series.number_of_seasons ?? series.total_seasons ?? seasons.length,
    number_of_episodes: series.number_of_episodes ?? 0,
    network: series.network ?? null,
    provider_name: series.provider_name ?? series.network ?? null,
    genres:
      series.genre_tags?.map((genre) => ({
        id: Number(genre.id),
        tmdb_id: null,
        name: genre.name,
        slug: genre.slug,
      })) ?? [],
    poster_image: mapResponsiveImage(series.poster_image),
    backdrop_image: mapResponsiveImage(series.backdrop_image),
    poster_url:
      pickImageSrc(series.poster_image, series.poster_url) ?? series.poster_url ?? null,
    backdrop_url:
      pickImageSrc(series.backdrop_image, series.backdrop_url) ??
      series.backdrop_url ??
      null,
    trailer_url: series.trailer_url ?? null,
    age_rating: series.age_rating ?? null,
    has_subtitle: series.has_subtitle ?? false,
    has_dubbed: series.has_dubbed ?? false,
    cast:
      series.cast?.map((row) => {
        const profileImage = mapResponsiveImage(row.profile_image);
        const metadataActor = series.details?.actors?.find(
          (actor) => actor.name && actor.name === row.name,
        );
        const metadataProfileImage = mapResponsiveImage(metadataActor?.profile_image);

        return {
          name: row.name ?? null,
          slug: row.slug ?? null,
          character: row.character_name ?? null,
          profile_url:
            pickProfileImageSrc(metadataProfileImage, metadataActor?.profile_url) ??
            pickProfileImageSrc(profileImage, row.profile_url),
          profile_image: metadataProfileImage ?? profileImage,
          order: row.order ?? null,
        };
      }) ?? [],
    crew:
      series.crew?.map((row) => ({
        name: row.name ?? null,
        slug: row.slug ?? null,
        job: row.job ?? null,
        department: row.department ?? null,
        profile_url:
          pickImageSrc(mapResponsiveImage(row.profile_image), row.profile_url) ??
          row.profile_url ??
          null,
        profile_image: mapResponsiveImage(row.profile_image),
      })) ?? [],
    seasons,
    details,
    reviews: mapGraphqlReviews(series.reviews),
    cached_avg_rating: series.cached_avg_rating ?? null,
  };
}

export type CatalogMovieItem = {
  id: number;
  title: string;
  slug: string;
  synopsis: string | null;
  release_year: number | null;
  poster_url: string | null;
  backdrop_url?: string | null;
  has_subtitle?: boolean;
  has_dubbed?: boolean;
  details: {
    genres: string[];
    backdrop_url?: string | null;
    rating?: number | null;
  };
};

export type CatalogFilterMeta = {
  genres: string[];
  countries: string[];
  networks: string[];
  years: number[];
  show_types: string[];
  min_rating: number | null;
  max_rating: number | null;
};

export type GraphqlMovieListItem = {
  id: string;
  title: string;
  slug: string;
  synopsis?: string | null;
  release_year?: number | null;
  has_subtitle?: boolean;
  has_dubbed_audio?: boolean;
  list_meta?: {
    poster_url?: string | null;
    backdrop_url?: string | null;
    genres?: string[];
    rating?: number | null;
  };
};

export function graphqlMovieCardToCatalogItem(movie: GraphqlMovieListItem): CatalogMovieItem {
  const meta = movie.list_meta;
  const backdrop = meta?.backdrop_url ?? null;

  return {
    id: Number(movie.id),
    title: movie.title,
    slug: movie.slug,
    synopsis: movie.synopsis ?? null,
    release_year: movie.release_year ?? null,
    poster_url: meta?.poster_url ?? null,
    backdrop_url: backdrop,
    has_subtitle: movie.has_subtitle ?? false,
    has_dubbed: movie.has_dubbed_audio ?? false,
    details: {
      genres: meta?.genres ?? [],
      backdrop_url: backdrop,
      rating: meta?.rating ?? null,
    },
  };
}

export function graphqlSeriesCardToCatalogItem(series: GraphqlSeriesListItem) {
  const meta = series.list_meta;
  const posterImage = mapResponsiveImage(meta?.poster_image);
  const backdropImage = mapResponsiveImage(meta?.backdrop_image);
  const backdrop =
    meta?.backdrop_url ?? series.backdrop_url ?? meta?.detail_backdrop_url ?? null;

  return {
    id: Number(series.id),
    title: series.title,
    slug: series.slug,
    synopsis: series.synopsis ?? null,
    release_year: series.release_year ?? null,
    poster_url:
      pickImageSrc(posterImage, meta?.poster_url ?? series.poster_url) ??
      meta?.poster_url ??
      series.poster_url ??
      null,
    poster_image: posterImage,
    backdrop_url: pickImageSrc(backdropImage, backdrop) ?? backdrop,
    backdrop_image: backdropImage,
    status_label_fa: meta?.status_label_fa ?? null,
    has_subtitle: series.has_subtitle ?? false,
    has_dubbed: series.has_dubbed ?? false,
    details: {
      genres: meta?.genres ?? [],
      backdrop_url: pickImageSrc(backdropImage, backdrop) ?? backdrop,
      rating: meta?.rating ?? null,
    },
  };
}
