"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import ProfileShell from "../components/profile/ProfileShell";
import ProfileCommentsPanel from "../components/profile/ProfileCommentsPanel";
import ProfileWatchlistPanel from "../components/profile/ProfileWatchlistPanel";
import { useAuth } from "../contexts/AuthContext";
import { useProfileSummary } from "../hooks/useProfileSummary";
import { HiOutlineArrowLeft, HiOutlineBookmark, HiOutlineChatAlt2, HiOutlineTicket } from "react-icons/hi";
import { MdComment } from "react-icons/md";

function ProfilePageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#f5c518]"></div>
        <p className="mt-4 text-gray-400">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { summary, loading: summaryLoading } = useProfileSummary(user?.id);
  const panel = searchParams.get("panel");
  const activeNav =
    panel === "comments"
      ? "comments"
      : panel === "watchlist"
        ? "watchlist"
        : panel === "edit-profile"
          ? "edit-profile"
          : "dashboard";

  const stats = useMemo(
    () => [
      { label: "دیدگاه های شما", icon: MdComment, count: summary.commentsCount },
      { label: "لیست بعداً ببینم", icon: HiOutlineBookmark, count: summary.savedCount },
      { label: "تیکت های پاسخ داده شده", icon: HiOutlineTicket, count: summary.ticketAnswered },
      { label: "تیکت های منتظر پاسخ", icon: HiOutlineTicket, count: summary.ticketWaiting },
      { label: "تیکت های بسته شده", icon: HiOutlineTicket, count: summary.ticketClosed },
    ],
    [summary.commentsCount, summary.savedCount, summary.ticketAnswered, summary.ticketWaiting, summary.ticketClosed],
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#f5c518]"></div>
          <p className="mt-4 text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAuth requireViewer>
      <ProfileShell
        active={activeNav}
        ticketWaitingCount={summary.ticketWaiting}
        summaryLoading={summaryLoading}
      >
        <div className="mb-6">
          <h1 className="mb-2 text-4xl font-black text-[#f8d977]">
            {activeNav === "comments"
              ? "دیدگاه‌ها"
              : activeNav === "watchlist"
                ? "لیست بعداً ببینم"
                : "داشبورد"}
          </h1>
          <p className="text-[#d0d0d0]">
            {activeNav === "comments"
              ? "اینجا می‌توانید دیدگاه‌های ثبت‌شده‌ی خودتان را مدیریت کنید."
              : activeNav === "watchlist"
                ? "مدیریت عنوان‌هایی که برای تماشا ذخیره کرده‌اید."
                : "به پنل کاربری خوش آمدید 👋"}
          </p>
        </div>

        {activeNav === "dashboard" && user ? (
          <div className="mb-8 rounded-2xl border border-[#f5c518]/25 bg-[#121212]/90 p-6">
            <p className="leading-8 text-[#d9d9d9]">
              از منوی سمت راست می‌توانید تیکت جدید ثبت کنید، درخواست فیلم/سریال بفرستید
              و وضعیت پاسخ‌ها را پیگیری کنید.
            </p>
          </div>
        ) : null}

        {activeNav === "dashboard" ? (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(summaryLoading
                ? Array.from({ length: 5 }).map((_, index) => ({
                    label: `skeleton-${index}`,
                    icon: HiOutlineTicket,
                    count: 0,
                    skeleton: true,
                  }))
                : stats
              ).map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-[#f5c518]/20 bg-[#121212]/90 p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f5c518]/15">
                        <Icon className="h-6 w-6 text-[#f8d977]" />
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-[#c3c3c3]">
                          {"skeleton" in stat ? (
                            <span className="inline-flex h-4 w-28 animate-pulse rounded bg-white/10" />
                          ) : (
                            stat.label
                          )}
                        </p>
                        <p className="text-2xl font-black text-white">
                          {"skeleton" in stat ? (
                            <span className="inline-flex h-7 w-12 animate-pulse rounded bg-white/10" />
                          ) : (
                            stat.count
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-8 rounded-2xl border border-[#2c2c2c] bg-[#111111] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">لیست بعداً ببینم</h2>
                <span className="inline-flex items-center gap-2 text-sm text-[#f8d977]">
                  <span>مشاهده موارد ذخیره‌شده</span>
                  <HiOutlineArrowLeft className="h-4 w-4" />
                </span>
              </div>
              {user ? <ProfileWatchlistPanel userId={user.id} loading={summaryLoading} /> : null}
            </div>

            <div className="rounded-2xl border border-[#2c2c2c] bg-[#111111] p-6">
              <div className="mb-4 flex items-center gap-2 text-white">
                <HiOutlineChatAlt2 className="h-5 w-5 text-[#f8d977]" />
                <h2 className="text-lg font-bold">وضعیت تیکت‌ها</h2>
              </div>
              <p className="text-sm leading-7 text-[#c7c7c7]">
                تیکت‌های منتظر پاسخ: <span className="font-bold text-[#f8d977]">{summary.ticketWaiting}</span>
                {" — "}
                تیکت‌های پاسخ داده شده: <span className="font-bold text-[#f8d977]">{summary.ticketAnswered}</span>
                {" — "}
                تیکت‌های بسته شده: <span className="font-bold text-[#f8d977]">{summary.ticketClosed}</span>
              </p>
            </div>
          </>
        ) : null}

        {activeNav === "watchlist" ? (
          <div className="rounded-2xl border border-[#2c2c2c] bg-[#111111] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">لیست بعداً ببینم</h2>
              <span className="inline-flex items-center gap-2 text-sm text-[#f8d977]">
                <span>مشاهده موارد ذخیره‌شده</span>
                <HiOutlineArrowLeft className="h-4 w-4" />
              </span>
            </div>
            {user ? <ProfileWatchlistPanel userId={user.id} loading={summaryLoading} /> : null}
          </div>
        ) : null}

        {activeNav === "comments" ? <ProfileCommentsPanel /> : null}
      </ProfileShell>
    </ProtectedRoute>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfilePageContent />
    </Suspense>
  );
}
