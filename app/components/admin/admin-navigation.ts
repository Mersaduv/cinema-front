import type { IconType } from "react-icons";
import {
  HiOutlineCollection,
  HiOutlineUsers,
  HiOutlineViewGrid,
} from "react-icons/hi";
import {
  MdOutlineCategory,
  MdOutlineFace,
  MdOutlineLanguage,
  MdOutlineLiveTv,
  MdOutlineLocalMovies,
  MdOutlineMovieCreation,
  MdOutlinePublic,
  MdOutlineRateReview,
  MdOutlineRequestPage,
  MdOutlineSell,
  MdOutlineSubscriptions,
  MdOutlineVideoLibrary,
} from "react-icons/md";

export interface AdminNavBase {
  id: string;
  href: string;
  label: string;
  description: string;
  badge: string;
  icon: IconType;
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
    description: "نمای کلی پنل مدیریت و وضعیت فعلی پروژه Cinema",
    badge: "اصلی",
    icon: HiOutlineViewGrid,
  },
  {
    type: "tree",
    id: "media-management",
    href: "/admin/content-management",
    label: "مدیریت مدیا",
    description: "مدیریت فیلم، سریال، استریم و داده‌های مرجع محتوا",
    badge: "ساختار",
    icon: MdOutlineVideoLibrary,
    children: [
      {
        type: "section",
        id: "movies",
        label: "Movies",
        items: [
          {
            type: "link",
            id: "all-movies",
            href: "/admin/content-management/movies",
            label: "All Movies",
            description: "فهرست کامل فیلم‌های ثبت‌شده",
            badge: "فیلم",
            icon: MdOutlineLocalMovies,
          },
          {
            type: "link",
            id: "movie-drafts",
            href: "/admin/content-management/movies/drafts",
            label: "Drafts",
            description: "فیلم‌های ذخیره‌شده در حالت پیش‌نویس",
            badge: "فیلم",
            icon: MdOutlineMovieCreation,
          },
          {
            type: "link",
            id: "movie-scheduled",
            href: "/admin/content-management/movies/scheduled",
            label: "Scheduled",
            description: "فیلم‌های زمان‌بندی‌شده برای انتشار",
            badge: "فیلم",
            icon: MdOutlineMovieCreation,
          },
          {
            type: "link",
            id: "add-movie",
            href: "/admin/content-management/movies/add",
            label: "Add Movie",
            description: "ثبت سریع فیلم در حالت پیش‌نویس",
            badge: "فیلم",
            icon: MdOutlineMovieCreation,
          },
        ],
      },
      {
        type: "section",
        id: "series",
        label: "Series",
        items: [
          {
            type: "link",
            id: "all-series",
            href: "/admin/content-management/series",
            label: "All Series",
            description: "مرور سریال‌ها و وضعیت مجموعه‌ها",
            badge: "سریال",
            icon: MdOutlineSubscriptions,
          },
          {
            type: "link",
            id: "series-seasons",
            href: "/admin/content-management/series/seasons",
            label: "Seasons",
            description: "مدیریت فصل‌های هر سریال",
            badge: "سریال",
            icon: MdOutlineSubscriptions,
          },
          {
            type: "link",
            id: "series-episodes",
            href: "/admin/content-management/series/episodes",
            label: "Episodes",
            description: "ساختار اولیه اپیزودها و اتصال به مدیا",
            badge: "سریال",
            icon: MdOutlineSubscriptions,
          },
        ],
      },
      {
        type: "section",
        id: "taxonomy",
        label: "طبقه بندی ها",
        items: [
          {
            type: "link",
            id: "genres",
            href: "/admin/taxonomy/genres",
            label: "Genres",
            description: "ژانرهای اصلی محتوا",
            badge: "مرجع",
            icon: MdOutlineCategory,
          },
          {
            type: "link",
            id: "countries",
            href: "/admin/taxonomy/countries",
            label: "Countries",
            description: "کشورها و مبدا تولید محتوا",
            badge: "مرجع",
            icon: MdOutlinePublic,
          },
          {
            type: "link",
            id: "languages",
            href: "/admin/taxonomy/languages",
            label: "Languages",
            description: "زبان‌های صوت و زیرنویس",
            badge: "مرجع",
            icon: MdOutlineLanguage,
          },
          {
            type: "link",
            id: "tags",
            href: "/admin/taxonomy/tags",
            label: "Tags",
            description: "برچسب‌های تکمیلی برای جست‌وجو و فیلتر",
            badge: "مرجع",
            icon: MdOutlineSell,
          },
          {
            type: "link",
            id: "actors",
            href: "/admin/taxonomy/actors",
            label: "Actors",
            description: "بازیگران برای استفاده در فرم‌های فیلم",
            badge: "مرجع",
            icon: MdOutlineFace,
          },
        ],
      },
      {
        type: "link",
        id: "live-streams",
        href: "/admin/content-management/live-streams",
        label: "Live TV / Streams",
        description: "آماده‌سازی صفحه استریم‌های زنده و کانال‌ها",
        badge: "استریم",
        icon: MdOutlineLiveTv,
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
  },
  {
    type: "link",
    id: "comments",
    href: "/admin/comments",
    label: "دیدگاه ها",
    description: "مرور و مدیریت دیدگاه‌های کاربران",
    badge: "ارتباط",
    icon: MdOutlineRateReview,
  },
  {
    type: "link",
    id: "requests",
    href: "/admin/requests",
    label: "درخواست ها",
    description: "پیگیری درخواست‌های ثبت‌شده کاربران",
    badge: "ارتباط",
    icon: MdOutlineRequestPage,
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

export const adminPageLinks = [
  {
    type: "link" as const,
    id: "taxonomy-root",
    href: "/admin/taxonomy",
    label: "طبقه بندی ها",
    description: "مدیریت داده‌های مرجع محتوا در کنار مدیریت مدیا",
    badge: "مرجع",
    icon: MdOutlineCategory,
  },
  ...flattenNavigation(adminNavigation),
];

export const adminPrimaryNavigation = adminNavigation.filter(
  (item) => item.href !== "/"
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
