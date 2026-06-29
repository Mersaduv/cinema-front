export function preserveContentWarnings<T extends { content_warnings?: string[] | null }>(
  initial: T,
  refreshed: T,
): T {
  if ((refreshed.content_warnings?.length ?? 0) > 0) {
    return refreshed;
  }

  if ((initial.content_warnings?.length ?? 0) === 0) {
    return refreshed;
  }

  return {
    ...refreshed,
    content_warnings: initial.content_warnings ?? [],
  };
}
