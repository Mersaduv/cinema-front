import { apiClient, type ApiResponse } from "./api";
import type { ResponsiveImageAsset } from "./cinema-image";
import type { ReviewsPayload } from "./reviews";

export interface PublicMovieActor {
  name: string | null;
  character: string | null;
  profile_url: string | null;
  profile_image?: ResponsiveImageAsset | null;
}

export interface PublicMovieCastMember {
  person_id?: number;
  name: string | null;
  character: string | null;
  profile_url: string | null;
  profile_image?: ResponsiveImageAsset | null;
  slug?: string | null;
  order?: number | null;
}

export interface PublicMovieCrewMember {
  person_id?: number;
  name: string | null;
  job: string | null;
  department: string | null;
  profile_url: string | null;
  slug?: string | null;
}

export type PublicGenre = {
  id: number;
  tmdb_id: number | null;
  name: string;
  slug: string;
  type?: string;
};

export interface PublicMovie {
  id: number;
  title: string;
  slug: string;
  tmdb_id?: number | null;
  original_title: string | null;
  synopsis: string | null;
  release_year: number | null;
  duration_seconds: number | null;
  provider_name: string | null;
  poster_url: string | null;
  poster_image?: ResponsiveImageAsset | null;
  backdrop_image?: ResponsiveImageAsset | null;
  trailer_url: string | null;
  has_dubbed_audio: boolean;
  audio_tracks: Array<{
    label: string;
    language: string;
  }>;
  has_subtitle: boolean;
  subtitle_source_url: string | null;
  age_rating: string | null;
  genres?: PublicGenre[];
  origin_country?: string | null;
  original_language?: string | null;
  cast_members: string[];
  cast?: PublicMovieCastMember[];
  crew?: PublicMovieCrewMember[];
  publish_status: string;
  download_links?: Record<string, string>;
  details: {
    backdrop_url: string | null;
    rating: number | null;
    original_language: string | null;
    network?: string | null;
    production_companies?: string[];
    runtime_minutes: number | null;
    directors: string[];
    writers: string[];
    genres: string[];
    languages: string[];
    countries: string[];
    actors: PublicMovieActor[];
    gallery: string[];
  };
  playback: {
    master_playlist_url: string | null;
    subtitle_url?: string | null;
    audio_tracks?: Array<{
      key: string;
      label: string;
      language: string;
      is_default: boolean;
    }>;
    variants: Array<{
      profile_key: string;
      resolution: string;
      bandwidth: number;
    }>;
  } | null;
  reviews?: ReviewsPayload;
  cached_avg_rating?: number | null;
}

export type PublicMovieListItem = {
  id: number;
  title: string;
  slug: string;
  synopsis: string | null;
  release_year: number | null;
  poster_url: string | null;
  genres?: PublicGenre[];
  details: PublicMovie["details"];
};

export const moviesService = {
  async list(): Promise<ApiResponse<{ movies: PublicMovieListItem[]; pagination?: unknown }>> {
    return apiClient.get<{ movies: PublicMovieListItem[] }>("/movies");
  },

  async show(slug: string): Promise<ApiResponse<{ movie: PublicMovie }>> {
    return apiClient.get<{ movie: PublicMovie }>(`/movies/${slug}`);
  },

  async related(slug: string, limit = 12): Promise<ApiResponse<{ movies: PublicMovieListItem[] }>> {
    return apiClient.get<{ movies: PublicMovieListItem[] }>(
      `/movies/${slug}/related?limit=${limit}`,
    );
  },
};
