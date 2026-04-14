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

export interface AdminMovieTaxonomyReference {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
}

export interface AdminMovieProcessingRun {
  id: number;
  status: string;
  progress_percent: number | null;
  eta_seconds: number | null;
  current_profile_key: string | null;
  source_duration_seconds: number | null;
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
  selected_hls_profiles: string[];
  master_playlist_url: string | null;
  processing_status: ProcessingStatus;
  processing_progress_percent: number | null;
  processing_eta_seconds: number | null;
  current_profile_key: string | null;
  processing_started_at: string | null;
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
  trailer_path: string | null;
  trailer_url: string | null;
  has_dubbed_audio: boolean;
  dubbed_source_path: string | null;
  dubbed_source_url: string | null;
  audio_tracks: Array<{
    label: string;
    language: string;
    source_path: string | null;
    source_url: string | null;
  }>;
  has_subtitle: boolean;
  subtitle_source_path: string | null;
  subtitle_source_url: string | null;
  age_rating: string | null;
  cast_members: string[];
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
  taxonomies: {
    genres: AdminMovieTaxonomyReference[];
    countries: AdminMovieTaxonomyReference[];
    languages: AdminMovieTaxonomyReference[];
    tags: AdminMovieTaxonomyReference[];
    actors: AdminMovieTaxonomyReference[];
  };
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
  taxonomies: {
    genres: AdminMovieTaxonomyReference[];
    countries: AdminMovieTaxonomyReference[];
    languages: AdminMovieTaxonomyReference[];
    tags: AdminMovieTaxonomyReference[];
    actors: AdminMovieTaxonomyReference[];
  };
  media_root: string;
  upload_limits?: {
    upload_max_filesize: string | null;
    post_max_size: string | null;
    max_execution_time: string | null;
    max_input_time: string | null;
  };
}

export interface MediaBrowserRoot {
  path: string;
  label: string;
  is_media_root: boolean;
}

export interface MediaBrowserFileEntry {
  name: string;
  path: string;
  extension: string;
  size_bytes: number;
  size_label: string;
  last_modified_at: string | null;
  is_supported: boolean;
  public_url?: string | null;
}

export interface MediaBrowserDirectoryEntry {
  name: string;
  path: string;
}

export type MediaBrowserKind = "video" | "image" | "subtitle" | "dubbed";

export interface MediaBrowserEntriesResponse {
  kind: MediaBrowserKind;
  allowed_extensions: string[];
  current_path: string;
  parent_path: string | null;
  directories: MediaBrowserDirectoryEntry[];
  files: MediaBrowserFileEntry[];
}

export interface MediaBrowserRootsResponse {
  kind: MediaBrowserKind;
  allowed_extensions: string[];
  roots: MediaBrowserRoot[];
}

export interface CreateAdminMoviePayload {
  title?: string;
  slug?: string;
  original_title: string;
  release_year?: number | null;
  provider_name?: string;
  source_path: string;
  start_processing?: boolean;
  selected_hls_profiles?: string[];
  has_dubbed_audio?: boolean;
  dubbed_source_path?: string;
  audio_tracks?: Array<{
    label: string;
    language?: string;
    source_path: string;
  }>;
  has_subtitle?: boolean;
  subtitle_source_path?: string;
}

export interface UpdateAdminMovieDraftPayload {
  title: string;
  original_title: string;
  slug: string;
  release_year?: number | null;
  provider_name?: string;
  source_path: string;
  selected_hls_profiles?: string[];
  poster_path?: string;
  trailer_path?: string;
  has_dubbed_audio?: boolean;
  dubbed_source_path?: string;
  audio_tracks?: Array<{
    label: string;
    language?: string;
    source_path: string;
  }>;
  has_subtitle?: boolean;
  subtitle_source_path?: string;
  synopsis?: string;
  age_rating?: string;
  genre_ids?: number[];
  country_ids?: number[];
  language_ids?: number[];
  tag_ids?: number[];
  actor_ids?: number[];
}

export interface UpdateMoviePublicationPayload {
  title: string;
  poster_path?: string;
  trailer_path?: string;
  has_dubbed_audio?: boolean;
  dubbed_source_path?: string;
  audio_tracks?: Array<{
    label: string;
    language?: string;
    source_path: string;
  }>;
  has_subtitle?: boolean;
  subtitle_source_path?: string;
  synopsis?: string;
  age_rating?: string;
  genre_ids?: number[];
  country_ids?: number[];
  language_ids?: number[];
  tag_ids?: number[];
  actor_ids?: number[];
}

export interface CreateAdminMovieUploadPayload {
  title: string;
  slug?: string;
  original_title?: string;
  synopsis?: string;
  release_year?: number | null;
  duration_seconds?: number | null;
  provider_name?: string;
  publish_status: PublishStatus;
  scheduled_for?: string | null;
  start_processing?: boolean;
  source_file: File;
  poster_file?: File | null;
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

  async create(payload: CreateAdminMoviePayload | CreateAdminMovieUploadPayload) {
    if ("source_file" in payload) {
      const formData = new FormData();
      formData.append("title", payload.title);

      if (payload.slug) {
        formData.append("slug", payload.slug);
      }
      if (payload.original_title) {
        formData.append("original_title", payload.original_title);
      }
      if (payload.synopsis) {
        formData.append("synopsis", payload.synopsis);
      }
      if (typeof payload.release_year === "number") {
        formData.append("release_year", String(payload.release_year));
      }
      if (typeof payload.duration_seconds === "number") {
        formData.append("duration_seconds", String(payload.duration_seconds));
      }
      if (payload.provider_name) {
        formData.append("provider_name", payload.provider_name);
      }

      formData.append("publish_status", payload.publish_status);
      formData.append("start_processing", payload.start_processing ? "1" : "0");
      formData.append("source_file", payload.source_file);

      if (payload.scheduled_for) {
        formData.append("scheduled_for", payload.scheduled_for);
      }
      if (payload.poster_file) {
        formData.append("poster_file", payload.poster_file);
      }

      return apiClient.postForm<{ movie: AdminMovie }>("/admin/movies", formData);
    }

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

  async queueProcessingWithProfiles(
    movieId: string | number,
    selected_hls_profiles: string[]
  ) {
    return apiClient.post<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/process`,
      { selected_hls_profiles }
    );
  },

  async stopProcessing(movieId: string | number) {
    return apiClient.post<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/stop-processing`
    );
  },

  async updatePublishStatus(
    movieId: string | number,
    publish_status: "draft" | "published"
  ) {
    return apiClient.put<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/publish-status`,
      { publish_status }
    );
  },

  async updatePublicationForm(
    movieId: string | number,
    payload: UpdateMoviePublicationPayload
  ) {
    return apiClient.put<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/publication-form`,
      payload
    );
  },

  async updateDraftForm(
    movieId: string | number,
    payload: UpdateAdminMovieDraftPayload
  ) {
    return apiClient.put<{ movie: AdminMovie }>(
      `/admin/movies/${movieId}/draft-form`,
      payload
    );
  },

  async remove(movieId: string | number) {
    return apiClient.delete<{
      deleted_movie: {
        title: string;
        slug: string;
      };
    }>(`/admin/movies/${movieId}`);
  },

  async browserRoots(kind: MediaBrowserKind) {
    return apiClient.get<MediaBrowserRootsResponse>(
      `/admin/media-browser/roots?kind=${kind}`
    );
  },

  async browseEntries(kind: MediaBrowserKind, path?: string | null) {
    const query = new URLSearchParams({ kind });

    if (path) {
      query.set("path", path);
    }

    return apiClient.get<MediaBrowserEntriesResponse>(
      `/admin/media-browser/entries?${query.toString()}`
    );
  },
};
