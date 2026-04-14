import { apiClient, type ApiResponse } from "./api";

export interface PublicMovie {
  id: number;
  title: string;
  slug: string;
  original_title: string | null;
  synopsis: string | null;
  release_year: number | null;
  duration_seconds: number | null;
  provider_name: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  has_dubbed_audio: boolean;
  audio_tracks: Array<{
    label: string;
    language: string;
  }>;
  has_subtitle: boolean;
  age_rating: string | null;
  cast_members: string[];
  publish_status: string;
  taxonomies: {
    genres: Array<{ id: number; name: string; slug: string }>;
    countries: Array<{ id: number; name: string; slug: string }>;
    languages: Array<{ id: number; name: string; slug: string }>;
    tags: Array<{ id: number; name: string; slug: string }>;
    actors: Array<{ id: number; name: string; slug: string }>;
  };
  playback: {
    master_playlist_url: string | null;
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
}

export const moviesService = {
  async list(): Promise<ApiResponse<{ movies: PublicMovie[] }>> {
    return apiClient.get<{ movies: PublicMovie[] }>("/movies");
  },

  async show(slug: string): Promise<ApiResponse<{ movie: PublicMovie }>> {
    return apiClient.get<{ movie: PublicMovie }>(`/movies/${slug}`);
  },
};
