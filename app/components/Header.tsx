"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiBars3,
  HiChevronDown,
  HiMagnifyingGlass,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { HiLogout } from "react-icons/hi";
import { TV_FOCUS_RING_CLASS } from "../lib/tv/focus";
import { useAuth } from "../contexts/AuthContext";
import { IoTvOutline } from "react-icons/io5";
import MobileNavSidebar from "./MobileNavSidebar";

const navItems = [
  { label: "خانه", href: "/" },
  { label: "فیلم", href: "/movies" },
  { label: "سریال", href: "/series" },
  { label: "کارتون و انیمیشن", href: "/animation" },
  { label: "کالکشن‌ها", href: "/collections" },
  { label: "درخواست", href: "/requests/new" },
];

const SCROLL_COMPACT_AT = 28;

/** Match HomeHero title readability on bright backdrop art. */
const HEADER_TEXT_SHADOW =
  "drop-shadow-[0_4px_28px_rgba(0,0,0,0.55)]";

const iconBtnClass =
  "inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-white transition hover:bg-white/12";

export default function Header({ overlay = false, isTv = false }: { overlay?: boolean; isTv?: boolean }) {
  const pathname = usePathname();
  const { user, isAuthenticated, hasToken, authReady, loading: authLoading, logout, hasRole, isViewer, isStaff } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const compactRef = useRef(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

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

  useEffect(() => {
    let frame = 0;

    const syncCompact = () => {
      frame = 0;
      const next = window.scrollY > SCROLL_COMPACT_AT;
      if (next !== compactRef.current) {
        compactRef.current = next;
        setCompact(next);
      }
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(syncCompact);
    };

    syncCompact();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  if (isTv) {
    return null;
  }

  const headerSurface = compact
    ? "bg-white/[0.08] backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
    : "bg-transparent";

  const loginHref = `/login${pathname && pathname !== "/login" ? `?redirect=${encodeURIComponent(pathname)}` : ""}`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 isolate border-0 text-white transition-[padding,background-color,backdrop-filter,box-shadow] duration-300 ease-out ${headerSurface}`}
        dir="rtl"
        data-header-compact={compact ? "true" : "false"}
        data-header-overlay={overlay ? "true" : "false"}
      >
        {!compact ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[72%] backdrop-blur-2xl backdrop-saturate-150"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.01) 68%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(180deg, #000 0%, #000 48%, transparent 100%)",
              maskImage:
                "linear-gradient(180deg, #000 0%, #000 48%, transparent 100%)",
            }}
          />
        ) : null}

        {/* Mobile / small tablet chrome — logo center, menu + actions */}
        <div
          className={`relative z-10 mx-auto flex max-w-[1820px] items-center justify-between px-4 lg:hidden ${
            compact ? "py-2.5" : "py-3.5"
          }`}
        >
          <button
            type="button"
            aria-label="باز کردن منو"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
            className={`${iconBtnClass} ${TV_FOCUS_RING_CLASS} ${compact ? "h-9 w-9" : "h-10 w-10"}`}
          >
            <HiBars3 className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className={`absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 transition-[height,width] duration-300 ${
              compact ? "h-8 w-[108px]" : "h-9 w-[120px]"
            }`}
            aria-label="Movie"
          >
            <Image
              src="/images/cinema_logo.png"
              alt="Movie"
              fill
              sizes="120px"
              className="object-contain object-center"
              priority
            />
          </Link>

          <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2"}`}>
            <Link
              href="/search"
              aria-label="جستجو"
              className={`${iconBtnClass} ${TV_FOCUS_RING_CLASS} ${compact ? "h-9 w-9" : "h-10 w-10"} ${
                pathname === "/search" ? "border-[#f5c518]/40 bg-[#f5c518]/15" : ""
              }`}
            >
              <HiMagnifyingGlass className="h-5 w-5" />
            </Link>
            {authReady && isAuthenticated && user ? (
              <Link
                href={isViewer ? "/profile" : isStaff ? "/admin" : "/"}
                aria-label="حساب کاربری"
                className={`${iconBtnClass} ${TV_FOCUS_RING_CLASS} ${compact ? "h-9 w-9" : "h-10 w-10"}`}
              >
                <HiOutlineUserCircle className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href={loginHref}
                aria-label="ورود"
                className={`${iconBtnClass} ${TV_FOCUS_RING_CLASS} ${compact ? "h-9 w-9" : "h-10 w-10"}`}
              >
                <HiOutlineUserCircle className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Desktop / large tablet — single-row nav (no second line) */}
        <div
          className={`relative z-10 mx-auto hidden max-w-[1820px] items-center justify-between px-4 lg:flex md:px-7 ${
            compact ? "py-2 md:py-2.5" : "py-3.5 xl:py-4"
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 xl:gap-3">
            <Link
              href="/"
              className={`relative block shrink-0 transition-[height,width,opacity] duration-300 ease-out hover:opacity-90 ${
                compact ? "h-8 w-[108px]" : "h-10 w-[132px]"
              }`}
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

            <nav
              className="flex min-w-0 flex-1 items-center justify-start gap-0.5 xl:gap-1.5 2xl:gap-2"
              dir="rtl"
            >
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/requests/new" && pathname?.startsWith("/requests")) ||
                  (item.href !== "/" &&
                    item.href !== "/requests/new" &&
                    pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    data-tv-focusable
                    className={`shrink-0 rounded-2xl font-semibold whitespace-nowrap transition-[padding,background-color,color,font-size] duration-300 ${HEADER_TEXT_SHADOW} ${TV_FOCUS_RING_CLASS} ${
                      compact
                        ? "px-2.5 py-1.5 text-xs xl:px-3.5 xl:py-2 xl:text-sm"
                        : "px-3 py-2 text-sm xl:px-4 xl:py-2.5 xl:text-[15px] 2xl:px-5 2xl:py-3 2xl:text-base"
                    } ${
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
          </div>

          <div className={`flex shrink-0 items-center ${compact ? "gap-1.5 xl:gap-2" : "gap-2 xl:gap-3"}`}>
            <a
              href="http://cinema.af/live/"
              data-tv-focusable
              className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f5c518] text-sm font-black text-[#12100a] shadow-[0_8px_24px_rgba(245,197,24,0.25)] transition-[height,padding] duration-300 hover:bg-[#e8bb0d] ${TV_FOCUS_RING_CLASS} ${
                compact ? "h-9 px-2.5 xl:px-3" : "h-10 px-3 xl:h-11 xl:px-4"
              }`}
            >
              <IoTvOutline className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden xl:inline">شبکه‌های تلویزیون</span>
            </a>

            <Link
              href="/search"
              data-tv-focusable
              className={`${iconBtnClass} ${TV_FOCUS_RING_CLASS} ${
                compact ? "h-9 w-9" : "h-10 w-10 xl:h-11 xl:w-11"
              } ${pathname === "/search" ? "border-[#f5c518]/40 bg-[#f5c518]/15" : ""}`}
              aria-label="جستجو"
            >
              <HiMagnifyingGlass className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </Link>

            {!authReady ? (
              <div className={`rounded-2xl ${compact ? "h-9 w-20" : "h-10 w-24 xl:h-11 xl:w-28"}`} aria-hidden />
            ) : null}

            {authReady && !hasToken && !authLoading ? (
              <Link
                href={loginHref}
                className={`inline-flex rounded-2xl border border-[#f5c518]/30 bg-[#f5c518]/10 font-bold text-[#f8d977] transition hover:bg-[#f5c518]/20 ${
                  compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm xl:px-5 xl:py-2.5"
                }`}
              >
                ورود
              </Link>
            ) : null}

            {authReady && hasToken && !user && authLoading ? (
              <div
                className={`animate-pulse rounded-2xl bg-white/10 ${
                  compact ? "h-9 w-20" : "h-10 w-24 xl:h-11 xl:w-28"
                }`}
                aria-hidden
              />
            ) : null}

            {authReady && isAuthenticated && user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((current) => !current)}
                  className={`inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] font-medium text-white transition hover:bg-white/[0.1] ${
                    compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm xl:px-4 xl:py-2.5"
                  }`}
                >
                  <span className="max-w-[7rem] truncate xl:max-w-[10rem]">{user.name}</span>
                  <HiChevronDown className="h-4 w-4 shrink-0" />
                </button>

                {userMenuOpen ? (
                  <div className="absolute left-0 top-[calc(100%+12px)] z-50 w-64 overflow-hidden rounded-[28px] border border-white/10 bg-[#090d12]/96 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                    <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                      <p className="text-sm font-bold text-white">{user.name}</p>
                      <p className="mt-1 text-xs text-white/45">{user.email}</p>
                    </div>
                    <div className="mt-2 space-y-1">
                      {isStaff && (hasRole("admin") || hasRole("super-admin")) ? (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-2xl px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/[0.06]"
                        >
                          پنل مدیریت
                        </Link>
                      ) : null}
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
      </header>

      <MobileNavSidebar open={sidebarOpen} onClose={closeSidebar} />
    </>
  );
}
