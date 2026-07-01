"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCollection,
  HiOutlineUsers,
} from "react-icons/hi";
import {
  MdOutlineLocalMovies,
  MdOutlineRateReview,
  MdOutlineRequestPage,
  MdOutlineSubscriptions,
} from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import AdminStatCard from "../components/admin/AdminStatCard";
import {
  fetchAdminDashboardSummary,
  type AdminDashboardSummary,
} from "../lib/admin-dashboard";

type QuickLink = {
  href: string;
  label: string;
  description: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const quickLinks: QuickLink[] = [
  {
    href: "/admin/content-management/movies",
    label: "فیلم‌ها",
    description: "مدیریت فهرست و انتشار فیلم‌ها",
    icon: MdOutlineLocalMovies,
  },
  {
    href: "/admin/content-management/series",
    label: "سریال‌ها",
    description: "مدیریت سریال، فصل و قسمت",
    icon: MdOutlineSubscriptions,
  },
  {
    href: "/admin/content-management/collections",
    label: "مجموعه‌ها",
    description: "سازمان‌دهی فیلم‌ها در کالکشن",
    icon: HiOutlineCollection,
  },
  {
    href: "/admin/users",
    label: "کاربران",
    description: "حساب‌ها و نقش‌های دسترسی",
    icon: HiOutlineUsers,
  },
  {
    href: "/admin/comments",
    label: "دیدگاه‌ها",
    description: "تأیید و مدیریت نظرات",
    icon: MdOutlineRateReview,
  },
  {
    href: "/admin/requests",
    label: "درخواست‌ها",
    description: "درخواست محتوای کاربران",
    icon: MdOutlineRequestPage,
  },
];

function formatGreeting(name?: string | null): string {
  if (name?.trim()) {
    return `سلام، ${name.trim()}`;
  }

  return "خوش آمدید";
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      setError("");

      const result = await fetchAdminDashboardSummary();

      if (controller.signal.aborted) {
        return;
      }

      if (result.error) {
        setError(result.error);
      } else {
        setSummary(result.data);
      }

      setLoading(false);
    })();

    return () => controller.abort();
  }, []);

  const attentionTotal =
    (summary?.reviews_pending ?? 0) +
    (summary?.tickets_waiting ?? 0) +
    (summary?.requests_pending ?? 0);

  const statCards = summary
    ? [
        {
          label: "فیلم‌های منتشرشده",
          value: summary.movies.published,
          icon: MdOutlineLocalMovies,
          accent: "border-[#f5c518]/18 bg-[#f5c518]/10 text-[#f8d977]",
        },
        {
          label: "سریال‌های منتشرشده",
          value: summary.series.published,
          icon: MdOutlineSubscriptions,
          accent: "border-[#38bdf8]/18 bg-[#38bdf8]/10 text-[#7dd3fc]",
        },
        {
          label: "کاربران",
          value: summary.users,
          icon: HiOutlineUsers,
          accent: "border-[#34d399]/18 bg-[#34d399]/10 text-[#86efac]",
        },
        {
          label: "نیازمند رسیدگی",
          value: attentionTotal,
          icon: MdOutlineRateReview,
          accent: "border-[#fb7185]/18 bg-[#fb7185]/10 text-[#fda4af]",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#0b1720] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[#8ea4b3]">پنل مدیریت Cinema</p>
            <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              {formatGreeting(user?.name)}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#9eb0bc]">
              خلاصه وضعیت محتوا، کاربران و موارد نیازمند رسیدگی را از اینجا
              پیگیری کنید.
            </p>
          </div>

          <Link
            href="/admin/content-management/movies"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e4b100] md:self-center"
          >
            <span>مدیریت محتوا</span>
            <HiOutlineArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b1720] p-8 text-center text-sm text-[#8ea4b3]">
          در حال بارگذاری آمار...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <AdminStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                accentClassName={card.accent}
              />
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#0b1720] p-5 lg:col-span-2">
              <h2 className="text-lg font-semibold text-white">وضعیت محتوا</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs text-[#8ea4b3]">فیلم‌ها</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {summary.movies.total}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#9eb0bc]">
                    {summary.movies.published} منتشر · {summary.movies.drafts}{" "}
                    پیش‌نویس · {summary.movies.processing} در پردازش
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs text-[#8ea4b3]">سریال‌ها</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {summary.series.total}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#9eb0bc]">
                    {summary.series.published} منتشر · {summary.series.drafts}{" "}
                    پیش‌نویس · {summary.series.scheduled} زمان‌بندی‌شده
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:col-span-2">
                  <p className="text-xs text-[#8ea4b3]">مجموعه‌ها</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {summary.collections}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#9eb0bc]">
                    کالکشن‌های فعال در کاتالوگ
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b1720] p-5">
              <h2 className="text-lg font-semibold text-white">رسیدگی</h2>
              <div className="mt-5 space-y-3">
                <Link
                  href="/admin/comments"
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <span className="text-sm text-[#cbd5e1]">دیدگاه در انتظار</span>
                  <span className="text-lg font-bold text-white">
                    {summary.reviews_pending}
                  </span>
                </Link>
                <Link
                  href="/admin/tickets"
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <span className="text-sm text-[#cbd5e1]">تیکت باز</span>
                  <span className="text-lg font-bold text-white">
                    {summary.tickets_waiting}
                  </span>
                </Link>
                <Link
                  href="/admin/requests"
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <span className="text-sm text-[#cbd5e1]">درخواست جدید</span>
                  <span className="text-lg font-bold text-white">
                    {summary.requests_pending}
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-[#0b1720] p-6">
        <h2 className="text-lg font-semibold text-white">دسترسی سریع</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/16 hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-white/[0.06] p-2.5 text-[#f8d977] transition group-hover:bg-[#f5c518]/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{item.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#9eb0bc]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
