"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiChevronDown,
  HiMagnifyingGlass,
} from "react-icons/hi2";
import { HiLogout } from "react-icons/hi";
import { TV_FOCUS_RING_CLASS } from "../lib/tv/focus";
import { useAuth } from "../contexts/AuthContext";
import { IoTvOutline } from "react-icons/io5";

const navItems = [
  { label: "خانه", href: "/" },
  { label: "فیلم", href: "/movies" },
  { label: "سریال", href: "/series" },
  { label: "کارتون و انیمیشن", href: "/animation" },
  { label: "کالکشن‌ها", href: "/collections" },
  { label: "درخواست", href: "/requests/new" },
];

export default function Header({ overlay = false, isTv = false }: { overlay?: boolean; isTv?: boolean }) {
  const pathname = usePathname();
  const { user, isAuthenticated, hasToken, authReady, loading: authLoading, logout, hasRole, isViewer, isStaff } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
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

  if (isTv) {
    return null;
  }

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
              pathname === item.href ||
              (item.href === "/requests/new" && pathname?.startsWith("/requests")) ||
              (item.href !== "/" && item.href !== "/requests/new" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                data-tv-focusable
                className={`rounded-2xl px-5 py-3 text-base font-semibold transition ${TV_FOCUS_RING_CLASS} ${
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
          <a
            href="http://cinema.af/live/"
            data-tv-focusable
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#f5c518] px-3 text-sm font-black text-[#12100a] shadow-[0_8px_24px_rgba(245,197,24,0.25)] transition hover:bg-[#e8bb0d] md:px-4 ${TV_FOCUS_RING_CLASS}`}
          >
            <IoTvOutline className="h-5 w-5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">شبکه‌های تلویزیون</span>
          </a>

          <Link
            href="/search"
            data-tv-focusable
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-white transition hover:bg-white/12 ${TV_FOCUS_RING_CLASS} ${
              pathname === "/search" ? "border-[#f5c518]/40 bg-[#f5c518]/15" : ""
            }`}
            aria-label="جستجو"
          >
            <HiMagnifyingGlass className="h-5 w-5" />
          </Link>

          {!authReady ? (
            <div
              className="hidden h-11 w-28 rounded-2xl md:block"
              aria-hidden
            />
          ) : null}

          {authReady && !hasToken && !authLoading ? (
            <Link
              href={`/login${pathname && pathname !== "/login" ? `?redirect=${encodeURIComponent(pathname)}` : ""}`}
              className="hidden rounded-2xl border border-[#f5c518]/30 bg-[#f5c518]/10 px-5 py-2.5 text-sm font-bold text-[#f8d977] transition hover:bg-[#f5c518]/20 md:inline-flex"
            >
              ورود
            </Link>
          ) : null}

          {authReady && hasToken && !user && authLoading ? (
            <div
              className="hidden h-11 w-28 animate-pulse rounded-2xl bg-white/10 md:block"
              aria-hidden
            />
          ) : null}

          {authReady && isAuthenticated && user ? (
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
                    {isStaff && (hasRole("admin") || hasRole("super-admin")) && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block rounded-2xl px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/[0.06]"
                      >
                        پنل مدیریت
                      </Link>
                    )}
                    {isViewer ? (
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block rounded-2xl px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/[0.06]"
                      >
                        پروفایل
                      </Link>
                    ) : null}
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
