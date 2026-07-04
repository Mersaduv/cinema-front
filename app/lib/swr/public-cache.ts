import type { Cache } from "swr";

/** Session-persistent SWR cache — survives route unmount/remount within the same tab. */
let sharedCache: Map<string, unknown> | undefined;

export function getSharedSwrCache(): Cache<unknown> {
  if (!sharedCache) {
    sharedCache = new Map();
  }
  return sharedCache as Cache<unknown>;
}

/** Default revisit dedupe — filter/page key changes bypass this via new keys. */
export const REVISIT_DEDUPING_MS = 15_000;

export const PUBLIC_SWR_DEFAULTS = {
  provider: getSharedSwrCache,
  revalidateIfStale: true,
  dedupingInterval: REVISIT_DEDUPING_MS,
} as const;

export const CATALOG_LIST_SWR_OPTIONS = {
  keepPreviousData: true,
  revalidateOnMount: true,
  revalidateOnFocus: true,
  revalidateIfStale: true,
  dedupingInterval: REVISIT_DEDUPING_MS,
} as const;
