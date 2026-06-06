import type { PublicMovie } from "../movies";
import type { PublicSeries, PublicSeriesSeason } from "../series";

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
    }>;
    gallery?: string[];
  } | null;
  cast?: Array<{
    character_name?: string | null;
    order?: number | null;
    person: { slug: string; name: string; profile_url?: string | null };
  }>;
  crew?: Array<{
    job: string;
    department?: string | null;
    person: { slug: string; name: string; profile_url?: string | null };
  }>;
  metadata?: {
    playback?: {
      hls_url?: string | null;
      downloads?: Array<{ quality: string; url: string }>;
    } | null;
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
    order?: number | null;
  }>;
  crew?: Array<{
    name?: string | null;
    slug?: string | null;
    job?: string | null;
    department?: string | null;
    profile_url?: string | null;
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
    }>;
    gallery?: string[];
  };
};

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
    poster_url: movie.poster_url ?? null,
    trailer_url: movie.trailer_url ?? null,
    has_dubbed_audio: movie.has_dubbed_audio,
    audio_tracks: [],
    has_subtitle: movie.has_subtitle,
    subtitle_source_url: null,
    age_rating: movie.age_rating ?? null,
    cast_members: [],
    cast:
      movie.cast?.map((row) => ({
        name: row.person.name,
        slug: row.person.slug,
        character: row.character_name ?? null,
        profile_url: row.person.profile_url ?? null,
        order: row.order ?? null,
      })) ?? [],
    crew:
      movie.crew?.map((row) => ({
        name: row.person.name,
        slug: row.person.slug,
        job: row.job,
        department: row.department ?? null,
        profile_url: row.person.profile_url ?? null,
      })) ?? [],
    publish_status: "published",
    download_links: downloadRecord,
    details: {
      backdrop_url: movie.backdrop_url ?? movie.poster_url ?? null,
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
        details?.actors?.map((actor) => ({
          name: actor.name ?? null,
          character: actor.character ?? null,
          profile_url: actor.profile_url ?? null,
        })) ??
        movie.cast?.map((row) => ({
          name: row.person.name,
          character: row.character_name ?? null,
          profile_url: row.person.profile_url ?? null,
        })) ??
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
      details.actors?.map((actor) => ({
        name: actor.name ?? null,
        character: actor.character ?? null,
        profile_url: actor.profile_url ?? null,
      })) ?? [],
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
    poster_url: series.poster_url ?? null,
    backdrop_url: series.backdrop_url ?? null,
    trailer_url: series.trailer_url ?? null,
    age_rating: series.age_rating ?? null,
    has_subtitle: series.has_subtitle ?? false,
    has_dubbed: series.has_dubbed ?? false,
    cast:
      series.cast?.map((row) => ({
        name: row.name ?? null,
        slug: row.slug ?? null,
        character: row.character_name ?? null,
        profile_url: row.profile_url ?? null,
        order: row.order ?? null,
      })) ?? [],
    crew:
      series.crew?.map((row) => ({
        name: row.name ?? null,
        slug: row.slug ?? null,
        job: row.job ?? null,
        department: row.department ?? null,
        profile_url: row.profile_url ?? null,
      })) ?? [],
    seasons,
    details,
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

  return {
    id: Number(series.id),
    title: series.title,
    slug: series.slug,
    synopsis: series.synopsis ?? null,
    release_year: series.release_year ?? null,
    poster_url: series.poster_url ?? null,
    backdrop_url: series.backdrop_url ?? meta?.detail_backdrop_url ?? null,
    status_label_fa: meta?.status_label_fa ?? null,
    has_subtitle: series.has_subtitle ?? false,
    has_dubbed: series.has_dubbed ?? false,
    details: {
      genres: meta?.genres ?? [],
      backdrop_url: meta?.detail_backdrop_url ?? series.backdrop_url ?? null,
      rating: meta?.rating ?? null,
    },
  };
}
