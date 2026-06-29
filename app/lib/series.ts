import { apiClient, type ApiResponse } from "./api";
import type { ResponsiveImageAsset } from "./cinema-image";
import type { PublicGenre } from "./movies";
import type { ReviewsPayload } from "./reviews";

export interface PublicSeriesActor {
  name: string | null;
  character: string | null;
  profile_url: string | null;
  profile_image?: ResponsiveImageAsset | null;
}

export interface PublicSeriesCastMember {
  person_id?: number;
  name: string | null;
  character: string | null;
  profile_url: string | null;
  profile_image?: ResponsiveImageAsset | null;
  slug?: string | null;
  order?: number | null;
}

export interface PublicSeriesCrewMember {
  person_id?: number;
  name: string | null;
  job: string | null;
  department: string | null;
  profile_url: string | null;
  profile_image?: ResponsiveImageAsset | null;
  slug?: string | null;
}

export interface PublicSeriesEpisode {
  id: number;
  season_number: number;
  episode_number: number;
  title: string;
  slug: string;
  synopsis: string | null;
  air_date: string | null;
  duration_minutes: number | null;
  still_url: string | null;
  still_image?: ResponsiveImageAsset | null;
  hls_url: string | null;
  dash_url?: string | null;
  download_links?: Record<string, string>;
  subtitle_url: string | null;
  dubbed_audio_url: string | null;
}

export interface PublicSeriesSeason {
  id: number;
  season_number: number;
  name: string | null;
  synopsis: string | null;
  air_date: string | null;
  episode_count: number | null;
  poster_url: string | null;
  poster_image?: ResponsiveImageAsset | null;
  episodes: PublicSeriesEpisode[];
}

export interface PublicSeries {
  id: number;
  title: string;
  slug: string;
  tmdb_id?: number | null;
  original_title: string | null;
  synopsis: string | null;
  first_air_date: string | null;
  last_air_date: string | null;
  release_year: number | null;
  status: string | null;
  status_label_fa?: string | null;
  episode_runtime_minutes: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  network: string | null;
  provider_name?: string | null;
  poster_url: string | null;
  poster_image?: ResponsiveImageAsset | null;
  backdrop_url: string | null;
  backdrop_image?: ResponsiveImageAsset | null;
  trailer_url: string | null;
  age_rating: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  content_warnings?: string[];
  quality_badges?: string[];
  genres?: PublicGenre[];
  origin_country?: string | null;
  original_language?: string | null;
  has_subtitle: boolean;
  has_dubbed: boolean;
  cast?: PublicSeriesCastMember[];
  crew?: PublicSeriesCrewMember[];
  seasons?: PublicSeriesSeason[];
  details: {
    backdrop_url: string | null;
    rating: number | null;
    original_language: string | null;
    creators: string[];
    directors: string[];
    writers: string[];
    genres: string[];
    languages: string[];
    countries: string[];
    network?: string | null;
    actors: PublicSeriesActor[];
    gallery: string[];
  };
  reviews?: ReviewsPayload;
  cached_avg_rating?: number | null;
}

export const seriesService = {
  async list(): Promise<ApiResponse<{ series: PublicSeries[] }>> {
    return apiClient.get<{ series: PublicSeries[] }>("/series");
  },

  async show(
    slug: string,
    options?: { lite?: boolean },
  ): Promise<ApiResponse<{ series: PublicSeries }>> {
    const query = options?.lite ? "?lite=1" : "";

    return apiClient.get<{ series: PublicSeries }>(`/series/${slug}${query}`);
  },

  async episodes(slug: string): Promise<ApiResponse<{ seasons: PublicSeriesSeason[] }>> {
    return apiClient.get<{ seasons: PublicSeriesSeason[] }>(`/series/${slug}/episodes`);
  },

  async related(
    slug: string,
    limit = 12,
  ): Promise<ApiResponse<{ series: PublicSeries[] }>> {
    return apiClient.get<{ series: PublicSeries[] }>(
      `/series/${slug}/related?limit=${limit}`,
    );
  },
};
