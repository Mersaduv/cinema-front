import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { VIEWER_CACHE_TAGS, VIEWER_REVALIDATE_PATHS } from "../../../lib/catalog/cache-tags";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

function isAdminUser(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const user = (payload as { data?: { user?: { roles?: Array<{ slug?: string }> } } }).data?.user;
  const roles = user?.roles ?? [];

  return roles.some((role) => role.slug === "admin");
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meResponse = await fetch(`${API_BASE_URL}/me`, {
    headers: {
      Accept: "application/json",
      Authorization: authorization,
    },
    cache: "no-store",
  });

  if (!meResponse.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mePayload = (await meResponse.json()) as unknown;

  if (!isAdminUser(mePayload)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    paths?: string[];
    tags?: string[];
  };

  const tags = body.tags ?? [...VIEWER_CACHE_TAGS];
  const paths = body.paths ?? [...VIEWER_REVALIDATE_PATHS];

  for (const tag of tags) {
    if (tag.trim()) {
      revalidateTag(tag.trim(), "max");
    }
  }

  for (const path of paths) {
    if (path.trim()) {
      revalidatePath(path.trim());
    }
  }

  return NextResponse.json({ revalidated: true, paths, tags });
}
