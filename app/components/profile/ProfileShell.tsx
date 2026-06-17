"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  HiArrowLeft,
  HiOutlineBookmark,
  HiOutlineChat,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiOutlinePencil,
  HiOutlineTicket,
  HiOutlineViewGrid,
} from "react-icons/hi";
import { useAuth } from "../../contexts/AuthContext";
import { formatAfghanShamsiToday } from "../../lib/date-format";

export type ProfileNavId =
  | "dashboard"
  | "tickets"
  | "tickets-new"
  | "watchlist"
  | "requests"
  | "comments"
  | "edit-profile";

type ProfileShellProps = {
  active: ProfileNavId;
  children: ReactNode;
  ticketWaitingCount?: number;
  summaryLoading?: boolean;
};

export default function ProfileShell({
  active,
  children,
  ticketWaitingCount = 0,
  summaryLoading = false,
}: ProfileShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [ticketsExpanded, setTicketsExpanded] = useState(
    active === "tickets" || active === "tickets-new",
  );

  const menuItems = [
    { id: "dashboard" as const, label: "داشبورد", icon: HiOutlineViewGrid, href: "/profile" },
    {
      id: "tickets" as const,
      label: "تیکت ها",
      icon: HiOutlineTicket,
      expandable: true,
    },
    {
      id: "watchlist" as const,
      label: "لیست بعداً ببینم",
      icon: HiOutlineBookmark,
      href: "/profile?panel=watchlist",
    },
    {
      id: "requests" as const,
      label: "درخواست ها",
      icon: HiOutlineDocumentText,
      href: "/requests",
    },
    { id: "comments" as const, label: "دیدگاه ها", icon: HiOutlineChat, href: "/profile?panel=comments" },
    {
      id: "edit-profile" as const,
      label: "ویرایش پروفایل",
      icon: HiOutlinePencil,
      href: "/profile?panel=edit-profile",
    },
  ];

  return (
    <div
      className="flex min-h-screen bg-[radial-gradient(circle_at_top,#1f1a0b_0%,#0b0b0b_45%,#080808_100%)]"
      dir="rtl"
    >
      <aside className="sticky top-0 flex h-screen w-80 flex-col border-l border-[#3c3212] bg-[#111111]/95 backdrop-blur">
        <div className="border-b border-[#3c3212] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5c518] text-lg font-black text-black shadow-[0_0_25px_rgba(245,197,24,0.25)]">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="font-semibold text-white">{user?.name || "کاربر"}</h3>
              <p className="text-sm text-[#d2c28a]">{formatAfghanShamsiToday()}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isTickets = item.id === "tickets";
            const isActive =
              active === item.id ||
              (isTickets && (active === "tickets" || active === "tickets-new"));

            if (isTickets) {
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setTicketsExpanded((current) => !current)}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                      isActive
                        ? "bg-[#f5c518]/15 text-[#f8d977]"
                        : "text-[#c5c5c5] hover:bg-[#201b0f] hover:text-[#f8d977]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    <HiArrowLeft
                      className={`h-4 w-4 transition ${ticketsExpanded ? "-rotate-90" : ""}`}
                    />
                  </button>

                  {ticketsExpanded ? (
                    <div className="mr-4 mt-1 space-y-1 border-r border-[#2f2f2f] pr-3">
                      <button
                        type="button"
                        onClick={() => router.push("/tickets/new")}
                        className={`block w-full rounded-lg px-4 py-2 text-right text-sm transition ${
                          active === "tickets-new"
                            ? "bg-[#f5c518]/15 text-[#f8d977]"
                            : "text-[#b8b8b8] hover:bg-[#201b0f] hover:text-[#f8d977]"
                        }`}
                      >
                        تیکت جدید
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/tickets")}
                        className={`block w-full rounded-lg px-4 py-2 text-right text-sm transition ${
                          active === "tickets"
                            ? "bg-[#f5c518]/15 text-[#f8d977]"
                            : "text-[#b8b8b8] hover:bg-[#201b0f] hover:text-[#f8d977]"
                        }`}
                      >
                        تیکت ها
                        {!summaryLoading && ticketWaitingCount > 0 ? (
                          <span className="mr-2 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">
                            {ticketWaitingCount}
                          </span>
                        ) : summaryLoading ? (
                          <span className="mr-2 inline-flex h-5 w-7 animate-pulse rounded-full bg-white/10" />
                        ) : null}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.href) {
                    router.push(item.href);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                  active === item.id
                    ? "bg-[#f5c518]/15 text-[#f8d977]"
                    : "text-[#c5c5c5] hover:bg-[#201b0f] hover:text-[#f8d977]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.href ? <HiArrowLeft className="h-4 w-4" /> : null}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-400 transition-colors hover:bg-[#201b0f]"
          >
            <HiOutlineLogout className="h-5 w-5" />
            <span>خروج از حساب</span>
          </button>
        </nav>

        <div className="border-t border-[#3c3212] p-4">
          <div className="rounded-xl border border-[#f5c518]/35 bg-gradient-to-br from-[#1f1a0b] to-[#131313] p-4">
            <h4 className="mb-2 font-semibold text-[#f8d977]">فیلم های جدید منتظر شما هستند!</h4>
            <p className="mb-4 text-sm text-[#d7d7d7]">
              به دنیای سینما قدم بگذارید و جدیدترین فیلم ها و سریال ها را همین حالا ببینید.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f5c518] px-4 py-2 font-bold text-black transition-colors hover:bg-[#e7b900]"
            >
              <span>رفتن به سایت</span>
              <HiArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
