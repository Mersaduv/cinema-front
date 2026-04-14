import { apiClient, type ApiResponse } from "./api";

export type PublishStatus = "draft" | "scheduled" | "published";
export type ProcessingStatus =
  | "pending"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export interface AdminMovieVariant {
  id: number;
  profile_key: string;
  resolution: string;
  bandwidth: number;
  playlist_relative_path: string;
  playlist_url: string | null;
  codecs: string | null;
  is_active: boolean;
}

export interface AdminMovieProcessingRun {
  id: number;
  status: string;
  error_message: string | null;
  ffmpeg_command: string | null;
  logs: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface AdminMovieMediaAsset {
  id: number;
  kind: string;
  source_path: string;
  source_is_external: boolean;
  managed_relative_directory: string;
  hls_output_relative_directory: string;
  hls_output_absolute_directory: string;
  master_playlist_relative_path: string;
  master_playlist_url: string | null;
  processing_status: ProcessingStatus;
  processing_error: string | null;
  last_processed_at: string | null;
  variants: AdminMovieVariant[];
  processing_runs?: AdminMovieProcessingRun[];
}

export interface AdminMovie {
  id: number;
  title: string;
  slug: string;
  original_title: string | null;
  synopsis: string | null;
  release_year: number | null;
  duration_seconds: number | null;
  provider_name: string | null;
  poster_path: string | null;
  poster_url: string | null;
  publish_status: PublishStatus;
  processing_status: ProcessingStatus;
  processing_error: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  media_folder: string;
  media_folder_absolute: string;
  created_at: string | null;
  updated_at: string | null;
  created_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  media_asset: AdminMovieMediaAsset | null;
}

export interface AdminMoviesSummary {
  total: number;
  drafts: number;
  published: number;
  processing: number;
  ready: number;
}

export interface AdminMoviesPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminMoviesResponse {
  movies: AdminMovie[];
  summary: AdminMoviesSummary;
  pagination: AdminMoviesPagination;
}

export interface AdminMovieOptionsResponse {
  publish_statuses: Array<{
    value: PublishStatus;
    label: string;
  }>;
  processing_statuses: Array<{
    value: ProcessingStatus;
    label: string;
  }>;
  hls_profiles: Array<{
    key: string;
    label: string;
    resolution: string;
    bandwidth: number;
  }>;
  media_root: string;
}

export interface CreateAdminMoviePayload {
  title: string;
  slug?: string;
  original_title?: string;
  synopsis?: string;
  release_year?: number | null;
  duration_seconds?: number | null;
  provider_name?: string;
  poster_path?: string;
  source_path: string;
  publish_status: PublishStatus;
  scheduled_for?: string | null;
  start_processing?: boolean;
}

export const adminMoviesService = {
  async list(params: {
    search?: string;
    publish_status?: string;
    processing_status?: string;
    page?: number;
  }): Promise<ApiResponse<AdminMoviesResponse>> {
    const query = new URLSearchParams();

    if (params.search) {
      query.set("search", params.search);
    }
    if (params.publish_status) {
      query.set("publish_status", params.publish_status);
    }
    if (params.processing_status) {
      query.set("processing_status", params.processing_status);
    }
    if (params.page) {
      query.set("page", String(params.page));
    }

    const endpoint = `/admin/movies${query.toString() ? `?${query.toString()}` : ""}`;

    return apiClient.get<AdminMoviesResponse>(endpoint);
  },

  async options(): Promise<ApiResponse<AdminMovieOptionsResponse>> {
    return apiClient.get<AdminMovieOptionsResponse>("/admin/movies/options");
  },

  async create(payload: CreateAdminMoviePayload) {
    return apiClient.post<{ movie: AdminMovie }>("/admin/movies", payload);
  },

  async show(movieId: string | number) {
    return apiClient.get<{ movie: AdminMovie }>(`/admin/movies/${movieId}`);
  },

  async queueProcessing(movieId: string | number) {
    return apiClient.post<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/process`
    );
  },
};
