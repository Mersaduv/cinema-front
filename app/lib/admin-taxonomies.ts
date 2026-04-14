import { apiClient, type ApiResponse } from "./api";

export type TaxonomyType = "genres" | "countries" | "languages" | "tags" | "actors";

export interface AdminTaxonomyItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imdb_url: string | null;
  image_path: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  movies_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminTaxonomyPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminTaxonomySummary {
  total: number;
  active: number;
  inactive: number;
  attached_movies: number;
}

export interface AdminTaxonomyMeta {
  type: TaxonomyType;
  singular_label: string;
  plural_label: string;
}

export interface AdminTaxonomyListResponse {
  meta: AdminTaxonomyMeta;
  items: AdminTaxonomyItem[];
  summary: AdminTaxonomySummary;
  statuses: Array<{
    value: "active" | "inactive";
    label: string;
  }>;
  pagination: AdminTaxonomyPagination;
}

export interface AdminTaxonomyPayload {
  name: string;
  slug?: string;
  description?: string;
  imdb_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export const adminTaxonomiesService = {
  async list(
    type: TaxonomyType,
    params: {
      search?: string;
      status?: string;
      page?: number;
    }
  ): Promise<ApiResponse<AdminTaxonomyListResponse>> {
    const query = new URLSearchParams();

    if (params.search) {
      query.set("search", params.search);
    }
    if (params.status) {
      query.set("status", params.status);
    }
    if (params.page) {
      query.set("page", String(params.page));
    }

    return apiClient.get<AdminTaxonomyListResponse>(
      `/admin/taxonomies/${type}${query.toString() ? `?${query.toString()}` : ""}`
    );
  },

  async create(type: TaxonomyType, payload: AdminTaxonomyPayload) {
    return apiClient.post<{ item: AdminTaxonomyItem }>(
      `/admin/taxonomies/${type}`,
      payload
    );
  },

  async update(type: TaxonomyType, id: number, payload: AdminTaxonomyPayload) {
    return apiClient.put<{ item: AdminTaxonomyItem }>(
      `/admin/taxonomies/${type}/${id}`,
      payload
    );
  },

  async remove(type: TaxonomyType, id: number) {
    return apiClient.delete<{ deleted_item: { name: string; slug: string } }>(
      `/admin/taxonomies/${type}/${id}`
    );
  },
};
