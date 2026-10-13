"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  HiChevronDown,
  HiMiniXMark,
} from "react-icons/hi2";
import { IoTvOutline } from "react-icons/io5";

type NavLink = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  href: string;
  children?: NavLink[];
};

const SIDEBAR_GROUPS: NavGroup[] = [
  {
    label: "فیلم",
    href: "/movies",
    children: [{ label: "همه فیلم‌ها", href: "/movies" }],
  },
  {
    label: "سریال",
    href: "/series",
    children: [{ label: "همه سریال‌ها", href: "/series" }],
  },
  { label: "کالکشن‌ها", href: "/collections" },
  { label: "کارتون و انیمیشن", href: "/animation" },
  { label: "پخش زنده", href: "http://cinema.af/live/" },
  { label: "درخواست فیلم", href: "/requests/new" },
];

const rowClass =
  "flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#141a24] px-4 py-3.5 text-right text-[15px] font-semibold text-white/92 transition hover:bg-[#1a2130] active:bg-[#1e2636]";

export default function MobileNavSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const titleId = useId();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    onClose();
    setExpanded(null);
  }, [pathname, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] lg:hidden" dir="rtl" role="dialog" aria-modal aria-labelledby={titleId}>
      <button
        type="button"
        aria-label="بستن منو"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 right-0 flex w-[min(100vw,22rem)] flex-col bg-[#05070b] p-3 shadow-[-24px_0_60px_rgba(0,0,0,0.55)]">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#12161f] px-3 py-3.5">
          <Link href="/" onClick={onClose} className="min-w-0 flex-1" aria-labelledby={titleId}>
            <div className="relative mx-auto h-9 w-[132px]">
              <Image
                src="/images/cinema_logo.png"
                alt="Movie"
                fill
                sizes="132px"
                className="object-contain object-center"
                priority
              />
            </div>
            <p id={titleId} className="mt-1.5 text-center text-[11px] text-white/55">
              مرجع جدیدترین فیلم و سریال‌ها
            </p>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-white transition hover:bg-white/12"
          >
            <HiMiniXMark className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pb-4" aria-label="منوی اصلی">
          <Link href="/" onClick={onClose} className={rowClass}>
            <span>خانه</span>
          </Link>

          {SIDEBAR_GROUPS.map((group) => {
            const hasChildren = Boolean(group.children?.length);
            const isOpen = expanded === group.label;
            const isExternal = group.href.startsWith("http");

            if (!hasChildren) {
              if (isExternal) {
                return (
                  <a
                    key={group.label}
                    href={group.href}
                    onClick={onClose}
                    className={rowClass}
                  >
                    <span className="inline-flex items-center gap-2">
                      {group.label === "پخش زنده" ? (
                        <IoTvOutline className="h-4 w-4 text-[#f5c518]" aria-hidden />
                      ) : null}
                      {group.label}
                    </span>
                  </a>
                );
              }

              return (
                <Link key={group.label} href={group.href} onClick={onClose} className={rowClass}>
                  <span>{group.label}</span>
                </Link>
              );
            }

            return (
              <div key={group.label} className="space-y-1.5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setExpanded((current) => (current === group.label ? null : group.label))
                  }
                  className={rowClass}
                >
                  <span>{group.label}</span>
                  <HiChevronDown
                    className={`h-4 w-4 text-white/55 transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen ? (
                  <div className="space-y-1.5 pe-2 ps-3">
                    {group.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className="flex w-full items-center rounded-xl border border-white/[0.05] bg-[#0d1118] px-3.5 py-2.5 text-sm text-white/75 transition hover:bg-[#151b26] hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
