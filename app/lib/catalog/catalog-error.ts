const TRANSPORT_ERROR =
  /^(fetch failed|failed to fetch|networkerror.*|load failed)$/i;

/** Hide Node/browser transport text. The list request already has a Persian fallback. */
export function sanitizeCatalogError(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "";
  }

  if (TRANSPORT_ERROR.test(trimmed)) {
    return "دریافت فهرست انجام نشد.";
  }

  return trimmed;
}

/**
 * A successful client refetch stores `error: ""`. That must not fall through to
 * the server `initialError`, or a stale "fetch failed" stays on screen next to a full list.
 */
export function resolveVisibleCatalogError(input: {
  loadMoreError?: string;
  dataError?: string;
  swrMessage?: string;
  initialError?: string;
  hasSettledData: boolean;
  itemCount: number;
  isInitialQuery: boolean;
}): string {
  const loadMoreError = sanitizeCatalogError(input.loadMoreError ?? "");
  if (loadMoreError) {
    return loadMoreError;
  }

  if (input.hasSettledData) {
    const dataError = sanitizeCatalogError(input.dataError ?? "");
    if (dataError) {
      return dataError;
    }

    if (input.itemCount > 0) {
      return "";
    }

    return sanitizeCatalogError(input.swrMessage ?? "");
  }

  const swrMessage = sanitizeCatalogError(input.swrMessage ?? "");
  if (swrMessage) {
    return swrMessage;
  }

  if (input.isInitialQuery) {
    return sanitizeCatalogError(input.initialError ?? "");
  }

  return "";
}
