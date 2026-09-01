import { ADMIN_PERMISSIONS } from "./admin-permissions";

export interface AdminRoutePermissionRule {
  path: string;
  permissions: string[];
}

export const adminRoutePermissions: AdminRoutePermissionRule[] = [
  { path: "/admin", permissions: [ADMIN_PERMISSIONS.view_dashboard] },
  {
    path: "/admin/content-management/movies/add",
    permissions: [ADMIN_PERMISSIONS.create_movies],
  },
  {
    path: "/admin/content-management/series/add",
    permissions: [ADMIN_PERMISSIONS.create_series],
  },
  {
    path: "/admin/content-management/movies",
    permissions: [ADMIN_PERMISSIONS.view_movies],
  },
  {
    path: "/admin/content-management/series",
    permissions: [ADMIN_PERMISSIONS.view_series],
  },
  {
    path: "/admin/content-management/collections",
    permissions: [ADMIN_PERMISSIONS.view_collections],
  },
  {
    path: "/admin/content-management",
    permissions: [
      ADMIN_PERMISSIONS.view_movies,
      ADMIN_PERMISSIONS.view_series,
      ADMIN_PERMISSIONS.view_collections,
    ],
  },
  { path: "/admin/users/create", permissions: [ADMIN_PERMISSIONS.create_users] },
  { path: "/admin/users", permissions: [ADMIN_PERMISSIONS.view_users] },
  {
    path: "/admin/viewers/create",
    permissions: [ADMIN_PERMISSIONS.create_viewers],
  },
  { path: "/admin/viewers", permissions: [ADMIN_PERMISSIONS.view_viewers] },
  { path: "/admin/comments", permissions: [ADMIN_PERMISSIONS.view_comments] },
  { path: "/admin/requests", permissions: [ADMIN_PERMISSIONS.view_requests] },
  { path: "/admin/tickets", permissions: [ADMIN_PERMISSIONS.view_tickets] },
];

export function resolveAdminRoutePermissions(pathname: string | null): string[] {
  const normalized = pathname ?? "/admin";

  if (
    /^\/admin\/content-management\/movies\/[^/]+/.test(normalized) &&
    !normalized.startsWith("/admin/content-management/movies/add")
  ) {
    return [ADMIN_PERMISSIONS.edit_movies];
  }

  if (
    /^\/admin\/content-management\/series\/[^/]+/.test(normalized) &&
    !normalized.startsWith("/admin/content-management/series/add")
  ) {
    return [ADMIN_PERMISSIONS.edit_series];
  }

  if (/^\/admin\/content-management\/collections/.test(normalized)) {
    return [ADMIN_PERMISSIONS.view_collections];
  }

  if (/^\/admin\/tickets\/[^/]+/.test(normalized)) {
    return [ADMIN_PERMISSIONS.view_tickets];
  }

  const match = [...adminRoutePermissions]
    .sort((left, right) => right.path.length - left.path.length)
    .find((rule) => {
      if (rule.path === "/admin") {
        return normalized === "/admin";
      }

      return (
        normalized === rule.path || normalized.startsWith(`${rule.path}/`)
      );
    });

  return match?.permissions ?? [ADMIN_PERMISSIONS.view_dashboard];
}
