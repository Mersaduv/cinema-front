import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { VIEWER_CACHE_TAGS, VIEWER_REVALIDATE_PATHS } from "../../../lib/catalog/cache-tags";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

type RevalidatePayload = {
  paths?: unknown;
  tags?: unknown;
};

type MeResponse = {
  user?: {
    roles?: Array<{
      slug?: string | null;
      name?: string | null;
    }>;
  };
  data?: {
    user?: {
      roles?: Array<{
        slug?: string | null;
        name?: string | null;
      }>;
    };
  };
};

function normalizeStringList(value: unknown, fallback: readonly string[] = []): string[] {
  const source = Array.isArray(value) ? value : [...fallback];

  return source
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function hasAdminRole(payload: MeResponse): boolean {
  const roles = payload.user?.roles ?? payload.data?.user?.roles ?? [];

  return roles.some((role) => {
    const slug = role.slug?.trim().toLowerCase();
    const name = role.name?.trim().toLowerCase();

    return slug === "admin" || name === "admin";
  });
}

async function isAuthorizedAdmin(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as MeResponse;
    return hasAdminRole(payload);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await isAuthorizedAdmin(authorization);

  if (!isAdmin) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  let payload: RevalidatePayload;

  try {
    payload = (await request.json()) as RevalidatePayload;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const paths = normalizeStringList(payload.paths, VIEWER_REVALIDATE_PATHS);
  const tags = normalizeStringList(payload.tags, VIEWER_CACHE_TAGS);

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    success: true,
    revalidated: {
      paths,
      tags,
    },
  });
}
