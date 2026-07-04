import { cacheLife, cacheTag } from "next/cache";
import { fetchCollectionsCatalogRest } from "./rest";
import { CATALOG_CACHE_TAG } from "../catalog/cache-tags";

export async function getCachedCollectionsList(page = 1, perPage = 48) {
  "use cache";
  cacheLife("catalog");
  cacheTag(CATALOG_CACHE_TAG);

  return fetchCollectionsCatalogRest(page, perPage, "", undefined, {
    skipFetchCache: true,
  });
}
