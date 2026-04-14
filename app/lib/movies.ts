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
  publish_status: string;
  playback: {
    master_playlist_url: string | null;
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
