import type { CatalogListItem } from "../lib/catalog/rest";

export type CarouselMeta = {
  current_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
  next_cursor: string | null;
};

export type CarouselRailOptions = {
  initialItems: CatalogListItem[];
  initialMeta: CarouselMeta;
  sort: string;
  kind: "movies" | "series";
  filters?: import("../lib/catalog/search-params").CatalogFiltersState;
  batchSize?: number;
};

export type UseCarouselRailReturn = {
  items: CatalogListItem[];
  isLoadingMore: boolean;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
};

export type CarouselTier = "small" | "medium" | "large";

export type CarouselConfig = {
  tier: CarouselTier;
  initialFetch: number;
  batchSize: number;
  sentinelAtIndex: number;
  maxItems: number;
  skeletonCount: number;
};

export type CarouselFetchResult = {
  items: CatalogListItem[];
  meta: CarouselMeta;
  error: string;
};
