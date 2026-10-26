import "./catalog/server-fetch-dns";
import { cacheLife, cacheTag } from "next/cache";
import { fetchFilterOptions, type FilterOptions } from "./filter-options";

export async function getCachedFilterOptions(): Promise<FilterOptions> {
  "use cache";
  cacheLife("catalog");
  cacheTag("catalog");

  return fetchFilterOptions({ cache: "force-cache" });
}
