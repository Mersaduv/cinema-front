"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiChevronDown,
  HiGlobeAlt,
  HiMagnifyingGlass,
  HiMiniPlay,
} from "react-icons/hi2";
import { RiBroadcastLine } from "react-icons/ri";
import { HiLogout } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { label: "خانه", href: "/" },
  { label: "فیلم", href: "/movies" },
  { label: "سریال", href: "/series" },
  { label: "انیمیشن", href: "#" },
  { label: "کالکشن‌ها", href: "#" },
  { label: "رویدادهای ورزشی", href: "#" },
  { label: "درخواست", href: "#" },
];

const popularSearches = [
  "گناهکاران",
  "ایندیانا جونز",
  "اینترستلار",
  "برکینگ بد",
  "آخرین بازمانده از ما",
];

export default function Header({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const { user, isAuthenticated, loading: authLoading, logout, hasRole } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const userInitial = useMemo(
    () => user?.name?.trim()?.charAt(0)?.toUpperCase() || "G",
    [user?.name],
  );

  const headerClassName = overlay
    ? "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[linear-gradient(180deg,rgba(6,9,14,0.88),rgba(6,9,14,0.44)_70%,transparent)] text-white backdrop-blur-xl"
    : "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#06090e]/88 text-white backdrop-blur-xl";

  return (
    <header className={headerClassName} dir="rtl">
      <div className="mx-auto flex max-w-[1820px] items-center justify-between gap-3 px-4 py-4 md:px-7">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="relative block h-10 w-[132px] shrink-0 transition hover:opacity-90"
            aria-label="Movie"
          >
            <Image
              src="/images/cinema_logo.png"
              alt="Movie"
              fill
              sizes="132px"
              className="object-contain object-right"
              priority
            />
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-start gap-2 xl:flex" dir="rtl">
          {navItems.map((item) => {
            const isActive =
              item.href !== "#" &&
              (pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href)));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-2xl px-5 py-3 text-base font-semibold transition ${
                  isActive
                    ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-white/86 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center gap-3">

          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-white transition hover:bg-white/12"
              aria-label="جستجو"
            >
              <HiMagnifyingGlass className="h-5 w-5" />
            </button>

            {searchOpen ? (
              <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-[min(92vw,420px)] overflow-hidden rounded-[28px] border border-white/10 bg-[#090d12]/96 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                <input
                  type="text"
                  placeholder="جستجوی فیلم، سریال و بازیگران"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#ef4444]"
                  autoFocus
                />
                <div className="mt-3 space-y-1">
                  {(searchQuery
                    ? popularSearches.filter((item) => item.includes(searchQuery))
                    : popularSearches
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setSearchQuery(item);
                        setSearchOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-right text-sm text-white/82 transition hover:bg-white/[0.06]"
                    >
                      <span>{item}</span>
                      <HiMiniPlay className="h-4 w-4 text-[#ef4444]" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {!authLoading && !isAuthenticated ? (
            <Link
              href={`/login${pathname && pathname !== "/login" ? `?redirect=${encodeURIComponent(pathname)}` : ""}`}
              className="hidden rounded-2xl border border-[#f5c518]/30 bg-[#f5c518]/10 px-5 py-2.5 text-sm font-bold text-[#f8d977] transition hover:bg-[#f5c518]/20 md:inline-flex"
            >
              ورود
            </Link>
          ) : null}

          {isAuthenticated && user ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.1]"
              >
                <span>{user.name}</span>
                <HiChevronDown className="h-4 w-4" />
              </button>

              {userMenuOpen ? (
                <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-64 overflow-hidden rounded-[28px] border border-white/10 bg-[#090d12]/96 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                  <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="mt-1 text-xs text-white/45">{user.email}</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    {(hasRole("admin") || hasRole("super-admin")) && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block rounded-2xl px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/[0.06]"
                      >
                        پنل مدیریت
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-2xl px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/[0.06]"
                    >
                      پروفایل
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        void logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-[#fda4af] transition hover:bg-white/[0.06]"
                    >
                      <HiLogout className="h-4 w-4" />
                      خروج
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <nav className="overflow-x-auto border-t border-white/8 px-4 pb-4 xl:hidden" dir="rtl">
        <div className="mx-auto flex max-w-[1820px] min-w-max items-center gap-2 pt-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/82 transition hover:bg-white/[0.08]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
