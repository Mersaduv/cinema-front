import { revalidatePath, revalidateTag } from "next/cache";
import {
  PUBLIC_HOME_INVALIDATION_PATHS,
  PUBLIC_HOME_INVALIDATION_TAGS,
} from "./cache-tags";

export type PublicCacheInvalidationMode = "immediate" | "stale-while-revalidate";

function revalidateTagWithMode(tag: string, mode: PublicCacheInvalidationMode): void {
  if (mode === "immediate") {
    revalidateTag(tag, { expire: 0 });
    return;
  }

  revalidateTag(tag, "max");
}

function uniquePaths(...groups: Array<Array<string | null | undefined>>): string[] {
  return Array.from(
    new Set(
      groups
        .flat()
        .map((path) => path?.trim())
        .filter((path): path is string => Boolean(path))
        .map((path) => (path.startsWith("/") ? path : `/${path}`)),
    ),
  );
}

export function invalidatePublicViewerCache(options?: {
  tags?: string[];
  paths?: string[];
  mode?: PublicCacheInvalidationMode;
}): { tags: string[]; paths: string[] } {
  const mode = options?.mode ?? "immediate";
  const tags = Array.from(
    new Set([...PUBLIC_HOME_INVALIDATION_TAGS, ...(options?.tags ?? [])].filter(Boolean)),
  );
  const paths = uniquePaths(
    [...PUBLIC_HOME_INVALIDATION_PATHS],
    options?.paths ?? [],
  );

  for (const tag of tags) {
    revalidateTagWithMode(tag, mode);
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return { tags, paths };
}
