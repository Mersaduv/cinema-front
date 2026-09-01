import type { IconType } from "react-icons";
import {
  HiOutlineCollection,
  HiOutlineUsers,
  HiOutlineViewGrid,
} from "react-icons/hi";
import {
  MdOutlineCollectionsBookmark,
  MdOutlineLocalMovies,
  MdOutlineRateReview,
  MdOutlineRequestPage,
  MdOutlineSubscriptions,
  MdOutlineVideoLibrary,
} from "react-icons/md";
import { ADMIN_PERMISSIONS } from "../../lib/admin-permissions";
import { hasAnyPermission } from "../../lib/admin-permissions";

export interface AdminNavBase {
  id: string;
  href: string;
  label: string;
  description: string;
  badge: string;
  icon: IconType;
  permissions?: string[];
}

export interface AdminNavLink extends AdminNavBase {
  type: "link";
}

export interface AdminNavSection {
  type: "section";
  id: string;
  label: string;
  items: AdminNavLink[];
}

export interface AdminNavTree extends AdminNavBase {
  type: "tree";
  children: Array<AdminNavSection | AdminNavLink | AdminNavTree>;
}

export type AdminNavItem = AdminNavLink | AdminNavTree;

export const adminNavigation: AdminNavItem[] = [
  {
    type: "link",
    id: "dashboard",
    href: "/admin",
    label: "داشبورد",
    description: "نمای کلی پنل مدیریت",
    badge: "اصلی",
    icon: HiOutlineViewGrid,
    permissions: [ADMIN_PERMISSIONS.view_dashboard],
  },
  {
    type: "tree",
    id: "media-management",
    href: "/admin/content-management",
    label: "مدیریت مدیا",
    description: "مدیریت فیلم، سریال و مجموعه",
    badge: "محتوا",
    icon: MdOutlineVideoLibrary,
    permissions: [
      ADMIN_PERMISSIONS.view_movies,
      ADMIN_PERMISSIONS.view_series,
      ADMIN_PERMISSIONS.view_collections,
    ],
    children: [
      {
        type: "section",
        id: "movies",
        label: "فیلم‌ها",
        items: [
          {
            type: "link",
            id: "all-movies",
            href: "/admin/content-management/movies",
            label: "همه فیلم‌ها",
            description: "فهرست کامل فیلم‌های ثبت‌شده",
            badge: "فیلم",
            icon: MdOutlineLocalMovies,
            permissions: [ADMIN_PERMISSIONS.view_movies],
          },
        ],
      },
      {
        type: "section",
        id: "series",
        label: "سریال‌ها",
        items: [
          {
            type: "link",
            id: "all-series",
            href: "/admin/content-management/series",
            label: "همه سریال‌ها",
            description: "مرور سریال‌ها و وضعیت مجموعه‌ها",
            badge: "سریال",
            icon: MdOutlineSubscriptions,
            permissions: [ADMIN_PERMISSIONS.view_series],
          },
        ],
      },
      {
        type: "section",
        id: "collections",
        label: "مجموعه‌های فیلم",
        items: [
          {
            type: "link",
            id: "all-collections",
            href: "/admin/content-management/collections",
            label: "همه مجموعه‌ها",
            description: "مشاهده فهرست مجموعه‌های فیلم",
            badge: "نمایش",
            icon: MdOutlineCollectionsBookmark,
            permissions: [ADMIN_PERMISSIONS.view_collections],
          },
        ],
      },
    ],
  },
  {
    type: "link",
    id: "users",
    href: "/admin/users",
    label: "کاربران",
    description: "مدیریت کاربران و حساب‌های پنل",
    badge: "فعال",
    icon: HiOutlineUsers,
    permissions: [ADMIN_PERMISSIONS.view_users],
  },
  {
    type: "link",
    id: "viewers",
    href: "/admin/viewers",
    label: "بیننده‌ها",
    description: "مدیریت حساب‌های بیننده و ثبت‌نام عمومی",
    badge: "مخاطب",
    icon: HiOutlineUsers,
    permissions: [ADMIN_PERMISSIONS.view_viewers],
  },
  {
    type: "link",
    id: "comments",
    href: "/admin/comments",
    label: "دیدگاه ها",
    description: "مرور و مدیریت دیدگاه‌های کاربران",
    badge: "ارتباط",
    icon: MdOutlineRateReview,
    permissions: [ADMIN_PERMISSIONS.view_comments],
  },
  {
    type: "link",
    id: "requests",
    href: "/admin/requests",
    label: "درخواست ها",
    description: "پیگیری درخواست‌های ثبت‌شده کاربران",
    badge: "ارتباط",
    icon: MdOutlineRequestPage,
    permissions: [ADMIN_PERMISSIONS.view_requests],
  },
  {
    type: "link",
    id: "tickets",
    href: "/admin/tickets",
    label: "تیکت ها",
    description: "پاسخ به تیکت‌های پشتیبانی کاربران",
    badge: "ارتباط",
    icon: MdOutlineRateReview,
    permissions: [ADMIN_PERMISSIONS.view_tickets],
  },
  {
    type: "link",
    id: "site-view",
    href: "/",
    label: "نمای سایت",
    description: "بازگشت سریع به سایت کاربری",
    badge: "عمومی",
    icon: HiOutlineCollection,
  },
];

function flattenNavigation(items: AdminNavItem[]): AdminNavLink[] {
  const links: AdminNavLink[] = [];

  items.forEach((item) => {
    if (item.type === "link") {
      links.push(item);
      return;
    }

    links.push({
      type: "link",
      id: `${item.id}-root`,
      href: item.href,
      label: item.label,
      description: item.description,
      badge: item.badge,
      icon: item.icon,
      permissions: item.permissions,
    });

    item.children.forEach((child) => {
      if (child.type === "link") {
        links.push(child);
        return;
      }

      if (child.type === "tree") {
        links.push(...flattenNavigation([child]));
        return;
      }

      child.items.forEach((leaf) => {
        links.push(leaf);
      });
    });
  });

  return links;
}

export const adminPageLinks = [...flattenNavigation(adminNavigation)];

export const adminPrimaryNavigation = adminNavigation.filter(
  (item) => item.href !== "/",
);

export function findAdminPage(pathname: string | null): AdminNavLink {
  const normalizedPathname = pathname ?? "/admin";

  return (
    [...adminPageLinks]
      .sort((left, right) => right.href.length - left.href.length)
      .find((page) => {
        if (page.href === "/") {
          return normalizedPathname === "/";
        }

        return (
          normalizedPathname === page.href ||
          normalizedPathname.startsWith(`${page.href}/`)
        );
      }) ?? adminPageLinks[0]
  );
}

export function isAdminPathActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function canSeeNavItem(
  item: { permissions?: string[] },
  hasPermission: (permission: string) => boolean,
): boolean {
  if (!item.permissions || item.permissions.length === 0) {
    return true;
  }

  return hasAnyPermission(hasPermission, item.permissions);
}

export function filterAdminNavigation(
  items: AdminNavItem[],
  hasPermission: (permission: string) => boolean,
): AdminNavItem[] {
  return items
    .map((item) => {
      if (item.type === "link") {
        return canSeeNavItem(item, hasPermission) ? item : null;
      }

      const children = item.children
        .map((child) => {
          if (child.type === "link") {
            return canSeeNavItem(child, hasPermission) ? child : null;
          }

          if (child.type === "tree") {
            const nested = filterAdminNavigation([child], hasPermission)[0];
            return nested?.type === "tree" ? nested : null;
          }

          const sectionItems = child.items.filter((leaf) =>
            canSeeNavItem(leaf, hasPermission),
          );

          if (sectionItems.length === 0) {
            return null;
          }

          return {
            ...child,
            items: sectionItems,
          };
        })
        .filter(Boolean) as AdminNavTree["children"];

      if (children.length === 0 && !canSeeNavItem(item, hasPermission)) {
        return null;
      }

      if (children.length === 0) {
        return null;
      }

      return {
        ...item,
        children,
      };
    })
    .filter(Boolean) as AdminNavItem[];
}
