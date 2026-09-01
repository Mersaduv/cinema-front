"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  HiMenuAlt3,
  HiOutlineArrowLeft,
  HiOutlineChevronDown,
  HiOutlineChevronLeft,
  HiOutlineSparkles,
  HiX,
} from "react-icons/hi";
import AdminAccessGate from "./AdminAccessGate";
import { useAuth } from "../../contexts/AuthContext";
import {
  adminNavigation,
  filterAdminNavigation,
  findAdminPage,
  isAdminPathActive,
  type AdminNavLink,
  type AdminNavSection,
  type AdminNavTree,
} from "./admin-navigation";
import AdminSidebarProfileMenu from "./AdminSidebarProfileMenu";
import { resolveAdminRoutePermissions } from "../../lib/admin-route-permissions";
import { hasAnyPermission } from "../../lib/admin-permissions";

function SidebarLink({
  link,
  pathname,
  compact = false,
  onNavigate,
}: {
  link: AdminNavLink;
  pathname: string | null;
  compact?: boolean;
  onNavigate: () => void;
}) {
  const Icon = link.icon;
  const isActive = isAdminPathActive(pathname, link.href);

  if (compact) {
    return (
      <Link
        href={link.href}
        onClick={onNavigate}
        className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
          isActive
            ? "border-[#38bdf8]/28 bg-[#38bdf8]/10 text-white"
            : "border-transparent bg-white/[0.02] text-[#b1c1cb] hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
        }`}
      >
        <span
          className={`rounded-xl p-1.5 ${
            isActive
              ? "bg-[#38bdf8]/16 text-[#7dd3fc]"
              : "bg-white/[0.05] text-[#8ea4b3] group-hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex flex-1 items-center justify-between gap-3">
          <span className="block text-sm font-medium">{link.label}</span>
          <span
            className={`rounded-xl p-1 transition ${
              isActive
                ? "bg-[#38bdf8]/16 text-[#7dd3fc]"
                : "text-[#8ea4b3] group-hover:bg-white/[0.06] group-hover:text-white"
            }`}
          >
            <HiOutlineChevronLeft className="h-4 w-4" />
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-3xl border px-4 py-3 transition ${
        isActive
          ? "border-[#f5c518]/35 bg-[#f5c518]/12 text-white shadow-[0_18px_35px_rgba(245,197,24,0.12)]"
          : "border-transparent bg-white/[0.03] text-[#b1c1cb] hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <span
        className={`rounded-2xl p-2 ${
          isActive
            ? "bg-[#f5c518]/20 text-[#f8d977]"
            : "bg-white/[0.06] text-[#9db0bc] group-hover:text-white"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex flex-1 items-center justify-between gap-3">
        <span className="text-sm font-semibold">{link.label}</span>
        <span
          className={`rounded-xl p-1 transition ${
            isActive
              ? "bg-[#f5c518]/20 text-[#f8d977]"
              : "text-[#8ea4b3] group-hover:bg-white/[0.06] group-hover:text-white"
          }`}
        >
          <HiOutlineChevronLeft className="h-4 w-4" />
        </span>
      </span>
    </Link>
  );
}

function SidebarTreeSection({
  section,
  pathname,
  onNavigate,
}: {
  section: AdminNavSection;
  pathname: string | null;
  onNavigate: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f8795]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f5c518]/80" />
        <span>{section.label}</span>
      </div>
      <div className="mt-2 space-y-2">
        {section.items.map((link) => (
          <SidebarLink
            key={link.id}
            link={link}
            pathname={pathname}
            compact
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarTree({
  item,
  pathname,
  expandedTrees,
  setExpandedTrees,
  onNavigate,
  nested = false,
}: {
  item: AdminNavTree;
  pathname: string | null;
  expandedTrees: Record<string, boolean>;
  setExpandedTrees: Dispatch<SetStateAction<Record<string, boolean>>>;
  onNavigate: () => void;
  nested?: boolean;
}) {
  const Icon = item.icon;
  const isActive = isAdminPathActive(pathname, item.href);
  const open = expandedTrees[item.id] ?? false;

  return (
    <div
      className={`overflow-hidden border transition ${
        nested
          ? isActive
            ? "rounded-[24px] border-[#38bdf8]/22 bg-[#38bdf8]/[0.05]"
            : "rounded-[24px] border-white/8 bg-white/[0.025]"
          : isActive
            ? "rounded-[24px] border-[#38bdf8]/25 bg-[#38bdf8]/[0.06]"
            : "rounded-[24px] border-white/8 bg-white/[0.03]"
      }`}
    >
      <div className={nested ? "p-2.5" : "p-"}>
        <button
          type="button"
          onClick={() =>
            setExpandedTrees((current) => ({
              ...current,
              [item.id]: !open,
            }))
          }
          aria-label={open ? `بستن ${item.label}` : `باز کردن ${item.label}`}
          className="group flex w-full min-w-0 items-center gap-3 rounded-[22px] px-3 py-3 text-right transition hover:bg-white/[0.04]"
        >
          <span
            className={`rounded-2xl p-2 ${
              isActive
                ? "bg-[#38bdf8]/16 text-[#7dd3fc]"
                : "bg-white/[0.06] text-[#9db0bc] group-hover:text-white"
            }`}
          >
            <Icon className={nested ? "h-[18px] w-[18px]" : "h-5 w-5"} />
          </span>
          <span className="min-w-0 flex flex-1 items-center justify-between gap-3">
            <span
              className={`${nested ? "text-[13px]" : "text-sm"} font-semibold text-white`}
            >
              {item.label}
            </span>
            <span
              className={`rounded-xl p-1 transition ${
                isActive
                  ? "bg-[#38bdf8]/16 text-[#7dd3fc]"
                  : "text-[#8ea4b3] group-hover:bg-white/[0.06] group-hover:text-white"
              }`}
            >
              {open ? (
                <HiOutlineChevronDown className="h-4 w-4" />
              ) : (
                <HiOutlineChevronLeft className="h-4 w-4" />
              )}
            </span>
          </span>
        </button>
      </div>

      {open && (
        <div
          className={`${nested ? "mr-5 ml-2 mb-3 pr-3" : "mr-6 ml-3 mb-4 pr-4 pt-4"} border-r border-white/10`}
        >
          <div className="space-y-4">
            {item.children.map((child) => {
              if (child.type === "section") {
                return (
                  <SidebarTreeSection
                    key={child.id}
                    section={child}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                );
              }

              if (child.type === "tree") {
                return (
                  <SidebarTree
                    key={child.id}
                    item={child}
                    pathname={pathname}
                    expandedTrees={expandedTrees}
                    setExpandedTrees={setExpandedTrees}
                    onNavigate={onNavigate}
                    nested
                  />
                );
              }

              return (
                <SidebarLink
                  key={child.id}
                  link={child}
                  pathname={pathname}
                  compact
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTrees, setExpandedTrees] = useState<Record<string, boolean>>({});
  const { user, logout, hasPermission } = useAuth();
  const currentPage = findAdminPage(pathname);
  const visibleNavigation = filterAdminNavigation(adminNavigation, hasPermission);
  const routePermissions = resolveAdminRoutePermissions(pathname);
  const canAccessCurrentRoute = hasAnyPermission(hasPermission, routePermissions);

  const closeSidebar = () => setSidebarOpen(false);
  const handleTopLevelNavigate = (href: string) => {
    if (!href.startsWith("/admin/content-management")) {
      setExpandedTrees((current) => ({
        ...current,
        "media-management": false,
      }));
    }

    closeSidebar();
  };

  return (
    <AdminAccessGate>
      <div className="relative min-h-screen overflow-hidden bg-[#07131b] text-white">
        <style jsx>{`
          .admin-sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
          }

          .admin-sidebar-scroll:hover {
            scrollbar-color: rgba(142, 164, 179, 0.55) transparent;
          }

          .admin-sidebar-scroll::-webkit-scrollbar {
            width: 7px;
          }

          .admin-sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .admin-sidebar-scroll::-webkit-scrollbar-thumb {
            background: transparent;
            border-radius: 999px;
            border: 2px solid transparent;
          }

          .admin-sidebar-scroll:hover::-webkit-scrollbar-thumb {
            background: rgba(142, 164, 179, 0.55);
          }

          .admin-sidebar-scroll:hover::-webkit-scrollbar-thumb:hover {
            background: rgba(216, 229, 236, 0.72);
          }
        `}</style>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,197,24,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />

        {sidebarOpen && (
          <button
            type="button"
            aria-label="بستن منوی پنل"
            className="fixed inset-0 z-30 bg-[#02070b]/70 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <aside
          className={`fixed inset-y-0 right-0 z-40 flex w-[330px] flex-col overflow-hidden border-l border-white/10 bg-[#081018]/95 px-2 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-4 py-1 text-xs text-[#f7d76b]">
                  <HiOutlineSparkles className="h-4 w-4" />
                  محیط توسعه
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
                  Cinema Admin
                </h2>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/5 p-2 text-[#b1c1cb] transition hover:border-white/20 hover:text-white lg:hidden"
                onClick={closeSidebar}
                aria-label="بستن سایدبار"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-8 space-y-3">
              {visibleNavigation.map((item) => {
                if (item.type === "link") {
                  return (
                    <SidebarLink
                      key={item.id}
                      link={item}
                      pathname={pathname}
                      onNavigate={() => handleTopLevelNavigate(item.href)}
                    />
                  );
                }

                return (
                  <SidebarTree
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    expandedTrees={expandedTrees}
                    setExpandedTrees={setExpandedTrees}
                    onNavigate={closeSidebar}
                  />
                );
              })}
            </nav>
          </div>

          <div className="shrink-0 pt-4">
            <AdminSidebarProfileMenu user={user} onLogout={logout} />
          </div>
        </aside>

        <div className="relative lg:pr-[330px]">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07131b]/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 p-2 text-[#b1c1cb] transition hover:border-white/20 hover:text-white lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="باز کردن سایدبار"
                >
                  <HiMenuAlt3 className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#6e8796]">
                    control panel
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-white">
                    {currentPage.label}
                  </h1>
                  <p className="mt-1 text-sm text-[#8ea4b3]">
                    {currentPage.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#dbe7ee] transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <span>نمای سایت</span>
                  <HiOutlineArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
            {canAccessCurrentRoute ? (
              children
            ) : (
              <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-8 text-center">
                <h2 className="text-2xl font-bold text-white">دسترسی محدود</h2>
                <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
                  شما مجوز لازم برای مشاهده این بخش از پنل را ندارید.
                </p>
              </section>
            )}
          </main>
        </div>
      </div>
    </AdminAccessGate>
  );
}
