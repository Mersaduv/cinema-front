"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineChevronUp,
  HiOutlineLogout,
  HiOutlineUserCircle,
} from "react-icons/hi";
import type { User } from "../../lib/auth";

type AdminSidebarProfileMenuProps = {
  user: User | null;
  onLogout: () => Promise<void>;
};

const roleLabels: Record<string, string> = {
  admin: "مدیر پنل",
  support: "پشتیبان",
  user: "کاربر عادی",
};

function getRoleLabel(user: User | null) {
  const role = user?.roles[0];

  if (!role) {
    return "مدیر";
  }

  return roleLabels[role.slug] ?? role.name;
}

function getInitials(name: string | undefined) {
  if (!name) {
    return "A";
  }

  return name.trim().charAt(0).toUpperCase();
}

export default function AdminSidebarProfileMenu({
  user,
  onLogout,
}: AdminSidebarProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const primaryRole = useMemo(() => getRoleLabel(user), [user]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative mt-auto">
      {open ? (
        <div className="absolute bottom-[calc(100%+0.75rem)] left-0 right-0 overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1821] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name ?? "مدیر سیستم"}
                </p>
                <p className="mt-1 truncate text-xs text-[#8ea4b3]">
                  {user?.email ?? "admin@cinema.local"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-sm text-[#fecaca] transition hover:border-[#f87171]/40 hover:bg-[#f87171]/15"
          >
            <HiOutlineLogout className="h-4 w-4" />
            خروج
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-[26px] border px-3 py-3 text-right transition ${
          open
            ? "border-white/16 bg-white/[0.08]"
            : "border-white/10 bg-white/[0.04] hover:border-white/16 hover:bg-white/[0.06]"
        }`}
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f5c518]/14 text-sm font-bold text-[#f8d977]">
          {getInitials(user?.name)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {user?.name ?? "مدیر سیستم"}
          </span>
          <span className="mt-1 block truncate text-xs text-[#8ea4b3]">
            {primaryRole}
          </span>
        </span>

        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.05] text-[#b7c6d0]">
          {open ? (
            <HiOutlineChevronUp className="h-4 w-4" />
          ) : (
            <HiOutlineUserCircle className="h-5 w-5" />
          )}
        </span>
      </button>
    </div>
  );
}
