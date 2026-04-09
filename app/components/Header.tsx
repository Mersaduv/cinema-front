"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { HiSearch, HiArrowLeft, HiX, HiLogout } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";
import { RiUserReceived2Line } from "react-icons/ri";

const navItems = [
  { label: "فیلم", href: "#" },
  { label: "سریال", href: "#" },
  { label: "کارتون و انیمیشن", href: "#" },
  { label: "درخواست فیلم", href: "#" },
];

// Mock data - در آینده از API یا localStorage می‌آید
const popularSearches = [
  "آواتار",
  "اینتراستلار",
  "پیشتازان فضا",
  "بریکینگ بد",
  "بازی تاج و تخت",
];

const searchHistory = [
  "دیدنگران",
  "سوپرمن",
  "بتمن",
];

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  // بستن dropdown با کلیک خارج از آن
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isSearchOpen || isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, isUserMenuOpen]);

  // مدیریت نمایش/پنهان شدن Header هنگام اسکرول
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 10; // حداقل اسکرول برای فعال شدن

      // اگر در بالای صفحه هستیم، همیشه Header را نمایش بده
      if (currentScrollY < scrollThreshold) {
        setIsHeaderVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // اگر به سمت پایین اسکرول می‌کنیم، Header را پنهان کن
      if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        setIsHeaderVisible(false);
      }
      // اگر به سمت بالا اسکرول می‌کنیم، Header را نمایش بده
      else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // استفاده از throttle برای بهینه‌سازی عملکرد
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
    };
  }, [lastScrollY]);
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-md text-white border-b border-[#2f2f2f] transition-transform duration-300 ease-in-out shadow-lg ${
        isHeaderVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-[1350px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Right side: logo + nav (RTL) */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/cinema_logo.png"
              alt="logo"
              width={130}
              height={130}
              className="h-10 w-auto"
              loading="eager"
            />
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-8 font-medium text-gray-300 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative px-4 py-3 transition-all duration-300 ease-out hover:text-white"
              >
                <span className="relative z-10">{item.label}</span>
                {/* Background glow on hover */}
                <span className="absolute inset-0 z-0 rounded-md bg-[#f5c5183a] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Left side: search + login */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Search with dropdown */}
          <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجوی فیلم، سریال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onClick={() => setIsSearchOpen(true)}
                className="w-full rounded-md border border-[#2f2f2f] bg-[#1f1f1f] pr-11 pl-4 py-2.5 text-sm text-white placeholder:text-gray-500 transition-all duration-200 focus:border-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]/20 hover:border-[#3f3f3f]"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#f5c518] transition-colors duration-200"
                aria-label="جستجو"
              >
                <HiSearch className="w-5 h-5" />
              </button>
            </div>

            {/* Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-md border border-[#2f2f2f] bg-[#1f1f1f] shadow-xl shadow-black/50 overflow-hidden z-50">
                {searchQuery === "" ? (
                  <>
                    {/* بیشترین جستجو */}
                    <div className="border-b border-[#2f2f2f]">
                      <div className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        بیشترین جستجو
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {popularSearches.map((item, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSearchQuery(item);
                              setIsSearchOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-right text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors duration-150 flex items-center justify-between group"
                          >
                            <span>{item}</span>
                            <HiArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-[#f5c518] transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* تاریخچه جستجو */}
                    {searchHistory.length > 0 && (
                      <div>
                        <div className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                          <span>تاریخچه جستجو</span>
                          <button
                            type="button"
                            className="text-[#f5c518] hover:text-[#e0b615] text-xs font-normal transition-colors"
                          >
                            پاک کردن
                          </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {searchHistory.map((item, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setSearchQuery(item);
                                setIsSearchOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-right text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors duration-150 flex items-center justify-between group"
                            >
                              <span>{item}</span>
                              <div className="flex items-center gap-2">
                                <HiX className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" />
                                <HiArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-[#f5c518] transition-colors" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* نتایج جستجو - برای آینده */
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">
                    در حال جستجو برای &quot;{searchQuery}&quot;...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="group flex items-center gap-2 h-10 px-3 pt-0.5 rounded-full border border-[#2f2f2f] bg-[#1f1f1f] text-gray-300 transition-all duration-200 hover:border-[#f5c518] hover:bg-[#2a2a2a] hover:text-white hover:shadow-lg hover:shadow-[#f5c518]/20 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-offset-2 focus:ring-offset-[#121212]"
                aria-label="منوی کاربر"
              >
                <span className="text-sm font-medium whitespace-nowrap">{user.name}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-lg border border-[#2f2f2f] bg-[#1f1f1f] shadow-xl shadow-black/50 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#2f2f2f]">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {user.roles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f5c518]/20 text-[#f5c518]"
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    {hasRole('admin') || hasRole('super-admin') ? (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        پنل مدیریت
                      </Link>
                    ) : null}
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      پروفایل کاربری
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
                    >
                      <HiLogout className="w-4 h-4" />
                      خروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="group hidden items-center justify-center px-2 py-2 rounded-full border border-[#2f2f2f] bg-[#1f1f1f] text-gray-300 transition-all duration-200 hover:border-[#f5c518] hover:bg-[#2a2a2a] hover:text-white hover:shadow-lg hover:shadow-[#f5c518]/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-offset-2 focus:ring-offset-[#121212] active:scale-105 md:flex"
              aria-label="ورود / حساب کاربری"
            >
              <RiUserReceived2Line className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="border-t border-[#2f2f2f] bg-[#121212] px-4 py-3 text-sm lg:hidden">
        <div className="mx-auto flex max-w-[1350px] flex-wrap items-center justify-center gap-2.5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative rounded-full bg-[#1f1f1f] px-4 py-2 text-gray-300 transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white hover:shadow-md hover:shadow-black/20 active:scale-95"
            >
              <span className="relative z-10">{item.label}</span>
              <span className="absolute inset-0 rounded-full bg-[#f5c518] opacity-0 transition-opacity duration-200 group-hover:opacity-10"></span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

