"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { HiSearch, HiUser, HiArrowLeft, HiX } from "react-icons/hi";

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
  const searchRef = useRef<HTMLDivElement>(null);

  // بستن dropdown با کلیک خارج از آن
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);
  return (
    <header className="bg-[#121212] text-white border-b border-[#2f2f2f]">
      <div className="mx-auto flex max-w-[1350px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Right side: logo + nav (RTL) */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/cinema_logo.png" alt="logo" width={130} height={120} />
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

          {/* Login icon button */}
          <Link
            href="/login"
            className="group hidden h-10 w-10 items-center justify-center rounded-full border border-[#2f2f2f] bg-[#1f1f1f] text-gray-300 transition-all duration-200 hover:border-[#f5c518] hover:bg-[#2a2a2a] hover:text-white hover:shadow-lg hover:shadow-[#f5c518]/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-offset-2 focus:ring-offset-[#121212] active:scale-105 md:flex"
            aria-label="ورود / حساب کاربری"
          >
            <HiUser className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          </Link>
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

