export const HOME_CRITICAL_CACHE_TAG = "home-critical";
export const HOME_RAILS_CACHE_TAG = "home-rails";
export const CATALOG_CACHE_TAG = "catalog";
export const CATALOG_MOVIES_CACHE_TAG = "catalog-movies";
export const CATALOG_SERIES_CACHE_TAG = "catalog-series";

/** Tags invalidated when homepage hero/slider or catalog rails may change. */
export const PUBLIC_HOME_INVALIDATION_TAGS = [
  HOME_CRITICAL_CACHE_TAG,
  HOME_RAILS_CACHE_TAG,
  CATALOG_CACHE_TAG,
  CATALOG_MOVIES_CACHE_TAG,
  CATALOG_SERIES_CACHE_TAG,
] as const;

export const PUBLIC_HOME_INVALIDATION_PATHS = ["/", "/movies", "/series"] as const;

/** @deprecated Use PUBLIC_HOME_INVALIDATION_TAGS — kept for revalidate-viewer route. */
export const VIEWER_CACHE_TAGS = PUBLIC_HOME_INVALIDATION_TAGS;

/** @deprecated Use PUBLIC_HOME_INVALIDATION_PATHS — kept for revalidate-viewer route. */
export const VIEWER_REVALIDATE_PATHS = PUBLIC_HOME_INVALIDATION_PATHS;
