import { apiClient, type ApiResponse } from "./api";
import type { ResponsiveImageAsset } from "./cinema-image";
import { cleanPayload } from "./clean-payload";
import type { CatalogListItem } from "./catalog/rest";

export interface AdminCollectionMovie extends CatalogListItem {
  publish_status?: string;
  sort_order?: number;
}

export interface AdminCollection {
  id: number;
  name: string;
  slug: string;
  tmdb_collection_id: number | null;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  poster_image?: ResponsiveImageAsset | null;
  backdrop_image?: ResponsiveImageAsset | null;
  is_visible: boolean;
  sort_order: number;
  movies_count?: number;
  movies?: AdminCollectionMovie[];
  updated_at?: string | null;
}

export interface AdminCollectionsPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminCollectionsListResponse {
  collections: AdminCollection[];
  pagination: AdminCollectionsPagination;
}

export type AdminCollectionPayload = {
  name: string;
  slug?: string;
  tmdb_collection_id?: number | null;
  description?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  is_visible?: boolean;
  sort_order?: number;
  movies?: Array<{ id: number; sort_order?: number }>;
};

export const adminCollectionsService = {
  list(params?: {
    page?: number;
    search?: string;
    visibility?: string;
    per_page?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.search) query.set("search", params.search);
    if (params?.visibility) query.set("visibility", params.visibility);
    if (params?.per_page) query.set("per_page", String(params.per_page));
    const suffix = query.toString() ? `?${query}` : "";
    return apiClient.get<AdminCollectionsListResponse>(`/admin/collections${suffix}`);
  },

  show(id: number) {
    return apiClient.get<{ collection: AdminCollection }>(`/admin/collections/${id}`);
  },

  create(payload: AdminCollectionPayload) {
    return apiClient.post<{ collection: AdminCollection }>(
      "/admin/collections",
      cleanPayload(payload),
    );
  },

  update(id: number, payload: AdminCollectionPayload) {
    return apiClient.put<{ collection: AdminCollection }>(
      `/admin/collections/${id}`,
      cleanPayload(payload),
    );
  },

  remove(id: number) {
    return apiClient.delete(`/admin/collections/${id}`);
  },

  fetchTmdb(tmdbId: number) {
    return apiClient.get<{
      collection: {
        tmdb_collection_id: number;
        name: string;
        description: string | null;
        poster_url: string | null;
        backdrop_url: string | null;
        parts: Array<{ tmdb_id: number; title: string; release_year: number | null }>;
      };
    }>(`/admin/tmdb/collection/fetch?tmdb_id=${tmdbId}`);
  },
};
