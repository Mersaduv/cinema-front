"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";

const navItems = [
  { label: "خانه", href: "/" },
  { label: "فیلم", href: "/movies" },
  { label: "سریال", href: "/series" },
  { label: "کارتون و انیمیشن", href: "/animation" },
  { label: "کالکشن‌ها", href: "/collections" },
  { label: "جستجو", href: "/search" },
  { label: "درخواست", href: "/requests/new" },
];

export default function TvSidebarNav() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-[220px] flex-col border-l border-white/10 bg-[#06090e]/96 py-6 backdrop-blur-xl"
      dir="rtl"
      aria-label="منوی اصلی"
    >
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/requests/new" && pathname?.startsWith("/requests")) ||
            (item.href !== "/" &&
              item.href !== "/requests/new" &&
              item.href !== "/search" &&
              pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tv-focusable
              className={`rounded-2xl px-4 py-3.5 text-base font-semibold transition ${TV_FOCUS_RING_CLASS} ${
                isActive
                  ? "bg-[#f5c518] text-[#12100a]"
                  : "text-white/88 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
