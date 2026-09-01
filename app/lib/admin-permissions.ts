export const ADMIN_PERMISSIONS = {
  view_dashboard: "view_dashboard",

  view_movies: "view_movies",
  create_movies: "create_movies",
  edit_movies: "edit_movies",
  delete_movies: "delete_movies",

  view_series: "view_series",
  create_series: "create_series",
  edit_series: "edit_series",
  delete_series: "delete_series",

  view_collections: "view_collections",

  view_users: "view_users",
  create_users: "create_users",

  view_viewers: "view_viewers",
  create_viewers: "create_viewers",
  manage_viewers: "manage_viewers",

  view_comments: "view_comments",
  moderate_comments: "moderate_comments",
  delete_comments: "delete_comments",

  view_requests: "view_requests",
  manage_requests: "manage_requests",

  view_tickets: "view_tickets",
  reply_tickets: "reply_tickets",
  manage_tickets: "manage_tickets",
} as const;

export type AdminPermissionSlug =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export function hasAnyPermission(
  check: (permission: string) => boolean,
  permissions: string | string[],
): boolean {
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return list.some((permission) => check(permission));
}
