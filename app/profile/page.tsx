"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import ProfileWatchlistPanel from "../components/profile/ProfileWatchlistPanel";
import { useAuth } from "../contexts/AuthContext";
import { watchlistCount } from "../lib/watchlist";
import {
  HiOutlineViewGrid,
  HiOutlineTicket,
  HiOutlineBookmark,
  HiOutlineDocumentText,
  HiOutlineChat,
  HiOutlinePencil,
  HiOutlineLogout,
  HiArrowLeft,
  HiX,
} from "react-icons/hi";
import { MdComment, MdBookmark, MdLocalMovies } from "react-icons/md";

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setSavedCount(0);
      return;
    }

    setSavedCount(watchlistCount(user.id));
  }, [user, activeMenu]);

  const handleDismissWelcome = () => {
    setShowWelcomeMessage(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { id: "dashboard", label: "داشبورد", icon: HiOutlineViewGrid },
    { id: "tickets", label: "تیکت ها", icon: HiOutlineTicket, hasArrow: true },
    {
      id: "watchlist",
      label: "لیست بعداً ببینم",
      icon: HiOutlineBookmark,
    },
    {
      id: "requests",
      label: "درخواست ها",
      icon: HiOutlineDocumentText,
      hasArrow: true,
    },
    { id: "comments", label: "دیدگاه ها", icon: HiOutlineChat },
    { id: "edit-profile", label: "ویرایش پروفایل", icon: HiOutlinePencil },
    {
      id: "logout",
      label: "خروج از حساب",
      icon: HiOutlineLogout,
      isDanger: true,
    },
  ];

  const stats = useMemo(
    () => [
      { label: "دیدگاه های شما", icon: MdComment, count: 0 },
      { label: "لیست بعداً ببینم", icon: MdBookmark, count: savedCount },
      { label: "تیکت های پاسخ داده شده", icon: HiOutlineTicket, count: 0 },
      { label: "تیکت های منتظر پاسخ", icon: HiOutlineTicket, count: 0 },
    ],
    [savedCount],
  );

  const pageTitle =
    activeMenu === "watchlist"
      ? "لیست بعداً ببینم"
      : activeMenu === "tickets"
        ? "تیکت‌ها"
        : activeMenu === "requests"
          ? "درخواست‌ها"
          : activeMenu === "comments"
            ? "دیدگاه‌ها"
            : activeMenu === "edit-profile"
              ? "ویرایش پروفایل"
              : "داشبورد";

  const getCurrentDate = () => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());
  };

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
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-[#121212] flex">
        <aside className="w-80 bg-[#1f1f1f] border-l border-[#2f2f2f] flex flex-col h-screen sticky top-0">
          <div className="p-6 border-b border-[#2f2f2f]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f5c518] flex items-center justify-center text-black font-bold text-lg">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {user?.name || "کاربر"}
                </h3>
                <p className="text-gray-400 text-sm">{getCurrentDate()}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              if (item.id === "logout") {
                return (
                  <button
                    key={item.id}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-red-400 hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#2a2a2a] text-white"
                      : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.hasArrow && <HiArrowLeft className="w-4 h-4" />}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#2f2f2f]">
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">
                فیلم های جدید منتظر شما هستند!
              </h4>
              <p className="text-gray-300 text-sm mb-4">
                به دنیای سینما قدم بگذارید و جدیدترین فیلم ها و سریال ها را همین
                حالا ببینید.
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <span>رفتن به سایت</span>
                <HiArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="mb-6">
              <h1 className="mb-2 text-4xl font-bold text-white">{pageTitle}</h1>
              {activeMenu === "dashboard" ? (
                <p className="text-gray-400">به پنل کاربری خوش آمدید 👋</p>
              ) : null}
            </div>

            {activeMenu === "watchlist" && user ? (
              <ProfileWatchlistPanel userId={user.id} />
            ) : null}

            {activeMenu === "dashboard" && showWelcomeMessage && (
              <div className="mb-8 bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg p-6 relative">
                <button
                  onClick={handleDismissWelcome}
                  className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
                >
                  <HiX className="w-5 h-5" />
                </button>
                <div className="pr-8">
                  <p className="text-gray-300 leading-relaxed">
                    سلام کاربر عزیز، خوش آمدید به وب سایت مووی لند! برای درخواست
                    فیلم و سریال، لطفاً از منوی سمت راست گزینه
                    {" "}
                    &quot;درخواست فیلم و سریال&quot;
                    {" "}
                    را انتخاب کرده و درخواست خود را ثبت کنید. همکاران ما در
                    اسرع وقت فیلم مورد نظر شما را اضافه خواهند کرد. لطفاً قبل از
                    ارسال درخواست، نام فیلم یا سریال را در سایت جستجو کنید تا از
                    موجود بودن آن مطمئن شوید.
                  </p>
                </div>
              </div>
            )}

            {activeMenu === "dashboard" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={index}
                    className="bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">
                          {stat.label}
                        </p>
                        <p className="text-white text-2xl font-bold">
                          {stat.count}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : null}

            {activeMenu === "dashboard" ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  وضعیت تیکت ها
                </h2>
                <button className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm">
                  <span>مشاهده همه</span>
                  <HiArrowLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-6">
                    <MdLocalMovies className="w-24 h-24 text-gray-600" />
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded">
                      TICKET
                    </div>
                  </div>
                  <p className="text-gray-400">هیچ تیکت وجود ندارد</p>
                </div>
              </div>
            </div>
            ) : null}

            {activeMenu === "dashboard" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  تاریخچه تماشای شما
                </h2>
                <button className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm">
                  <span>مشاهده همه</span>
                  <HiArrowLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-gray-600 mb-4">
                    <MdBookmark className="w-16 h-16" />
                  </div>
                  <p className="text-gray-400">
                    هیچ تاریخچه تماشایی وجود ندارد
                  </p>
                </div>
              </div>
            </div>
            ) : null}

            {activeMenu !== "dashboard" && activeMenu !== "watchlist" ? (
              <div className="rounded-xl border border-[#2f2f2f] bg-[#1f1f1f] p-12 text-center text-gray-400">
                این بخش به‌زودی فعال می‌شود.
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
