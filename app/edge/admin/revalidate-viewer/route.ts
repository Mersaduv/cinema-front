import { NextRequest, NextResponse } from "next/server";
import { invalidatePublicViewerCache } from "../../../lib/catalog/invalidate-public-cache";
import {
  PUBLIC_HOME_INVALIDATION_PATHS,
  PUBLIC_HOME_INVALIDATION_TAGS,
} from "../../../lib/catalog/cache-tags";
import { cinemaLoopbackFetch } from "../../../lib/cinema-loopback-fetch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";

type RevalidatePayload = {
  paths?: unknown;
  tags?: unknown;
  movieSlugs?: unknown;
  seriesSlugs?: unknown;
};

type StaffRole = {
  slug?: string | null;
  name?: string | null;
};

type StaffPermission = {
  slug?: string | null;
};

type MeResponse = {
  user?: {
    account_type?: string | null;
    roles?: StaffRole[];
    permissions?: StaffPermission[];
  };
  data?: {
    user?: {
      account_type?: string | null;
      roles?: StaffRole[];
      permissions?: StaffPermission[];
    };
  };
};

const ALLOWED_ROLE_SLUGS = new Set(["admin", "media"]);
const ALLOWED_PERMISSION_SLUGS = new Set([
  "edit_movies",
  "create_movies",
  "edit_series",
  "create_series",
  "view_dashboard",
]);

function normalizeStringList(value: unknown, fallback: readonly string[] = []): string[] {
  const source = Array.isArray(value) ? value : [...fallback];

  return source
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function detailPathsFromSlugs(movieSlugs: string[], seriesSlugs: string[]): string[] {
  return [
    ...movieSlugs.map((slug) => `/movies/${slug}`),
    ...seriesSlugs.map((slug) => `/series/${slug}`),
  ];
}

function canRevalidatePublicCache(payload: MeResponse): boolean {
  const user = payload.user ?? payload.data?.user;

  if (!user) {
    return false;
  }

  if (user.account_type === "viewer") {
    return false;
  }

  const roles = user.roles ?? [];
  const permissions = user.permissions ?? [];

  if (
    roles.some((role) => {
      const slug = role.slug?.trim().toLowerCase();
      const name = role.name?.trim().toLowerCase();

      return (
        (slug != null && ALLOWED_ROLE_SLUGS.has(slug)) ||
        name === "admin" ||
        name === "media"
      );
    })
  ) {
    return true;
  }

  return permissions.some((permission) => {
    const slug = permission.slug?.trim().toLowerCase();
    return slug != null && ALLOWED_PERMISSION_SLUGS.has(slug);
  });
}

async function isAuthorizedStaff(token: string): Promise<boolean> {
  try {
    const response = await cinemaLoopbackFetch(`${API_BASE_URL}/me?include_permissions=1`, {
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
    return canRevalidatePublicCache(payload);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const isStaff = await isAuthorizedStaff(authorization);

  if (!isStaff) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  let payload: RevalidatePayload = {};

  try {
    payload = (await request.json()) as RevalidatePayload;
  } catch {
    payload = {};
  }

  const movieSlugs = normalizeStringList(payload.movieSlugs);
  const seriesSlugs = normalizeStringList(payload.seriesSlugs);
  const paths = normalizeStringList(payload.paths, PUBLIC_HOME_INVALIDATION_PATHS);
  const tags = normalizeStringList(payload.tags, PUBLIC_HOME_INVALIDATION_TAGS);

  const result = invalidatePublicViewerCache({
    tags,
    paths: [...paths, ...detailPathsFromSlugs(movieSlugs, seriesSlugs)],
    mode: "immediate",
  });

  return NextResponse.json({
    success: true,
    revalidated: {
      paths: result.paths,
      tags: result.tags,
    },
  });
}
