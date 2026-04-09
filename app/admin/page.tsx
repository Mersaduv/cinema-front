"use client";

import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineChip,
  HiOutlineDatabase,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { MdOutlineCategory, MdOutlineVideoLibrary } from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import AdminStatCard from "../components/admin/AdminStatCard";
import { adminPrimaryNavigation } from "../components/admin/admin-navigation";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const uniquePermissions = new Set(
    user?.roles.flatMap((role) =>
      (role.permissions ?? []).map((permission) => permission.slug)
    ) ?? []
  ).size;

  const moduleCards = adminPrimaryNavigation.filter(
    (item) => item.href !== "/admin"
  );

  const overviewCards = [
    {
      label: "نقش‌های بارگذاری‌شده",
      value: user?.roles.length ?? 0,
      icon: HiOutlineShieldCheck,
      accent: "border-[#f5c518]/18 bg-[#f5c518]/10 text-[#f8d977]",
    },
    {
      label: "مجوزهای یکتای فعلی",
      value: uniquePermissions,
      icon: HiOutlineChip,
      accent: "border-[#38bdf8]/18 bg-[#38bdf8]/10 text-[#7dd3fc]",
    },
    {
      label: "ماژول‌های فعال پنل",
      value: moduleCards.length,
      icon: HiOutlineDatabase,
      accent: "border-[#34d399]/18 bg-[#34d399]/10 text-[#86efac]",
    },
    {
      label: "ریشه‌ی مدیای توسعه",
      value: "D:\\media",
      icon: MdOutlineVideoLibrary,
      accent: "border-[#fb7185]/18 bg-[#fb7185]/10 text-[#fda4af]",
    },
  ];

  const roadmap = [
    {
      title: "کاربران",
      status: "فعال",
      description:
        "مدیریت کاربران آماده است و ساخت حساب با نقش‌های ثابت از داخل پنل انجام می‌شود.",
    },
    {
      title: "مدیریت مدیا",
      status: "ساختار",
      description:
        "ساختار درختی فیلم، سریال، استریم و طبقه بندی ها برای ادامه‌ی توسعه‌ی فرم‌ها و جریان مدیا آماده شده است.",
    },
    {
      title: "گام بعدی",
      status: "فرم‌ها و media flow",
      description:
        "در ادامه فرم‌های واقعی محتوا، طبقه بندی ها و اتصال به مسیرهای مدیا و HLS روی همین پایه سوار می‌شوند.",
    },
  ];

  const architectureNotes = [
    "مدیریت مدیا هاب اصلی فیلم، سریال، استریم و طبقه بندی هاست تا رشد پنل پراکنده و نامنظم نشود.",
    "طبقه بندی ها زیرمجموعه‌ی مدیریت مدیا قرار گرفته تا داده‌های مرجع دقیقاً کنار جریان ثبت محتوا در دسترس باشند.",
    "ساختار sidebar به‌صورت درختی چیده شده تا اضافه شدن فرم‌ها، وضعیت‌ها و media flow بدون دوباره‌کاری جلو برود.",
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(140deg,rgba(245,197,24,0.15),rgba(8,16,24,0.96)_38%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
              ساختار اولیه پنل
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
              مدیریت مدیا و طبقه بندی ها به پنل ادمین اضافه شدند
            </h2>
            <p className="mt-5 text-base leading-8 text-[#dde7ed] md:text-lg">
              حالا پنل علاوه بر کاربران، یک ساختار روشن برای فیلم، سریال،
              استریم و داده‌های مرجع دارد. این پایه همان جایی است که فرم‌های
              واقعی محتوا و media flow در ادامه روی آن پیاده می‌شوند.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin/content-management"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e4b100]"
              >
                <span>ورود به مدیریت مدیا</span>
                <HiOutlineArrowLeft className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/taxonomy"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                <span>ورود به طبقه بندی ها</span>
                <HiOutlineArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 self-start">
            <div className="rounded-[28px] border border-white/10 bg-[#09121a]/90 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[#6e8796]">
                media hub
              </p>
              <p className="mt-3 text-xl font-bold text-white">
                Movies, Series, Live TV / Streams
              </p>
              <p className="mt-2 text-sm leading-7 text-[#91a7b5]">
                فیلم، سریال، فصل، اپیزود و استریم زنده از همین ساختار مرکزی
                مدیریت می‌شوند.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#09121a]/90 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[#6e8796]">
                طبقه بندی ها
              </p>
              <p className="mt-3 text-lg font-bold text-white">
                Genres, Countries, Languages, Tags
              </p>
              <p className="mt-2 text-sm leading-7 text-[#91a7b5]">
                طبقه بندی ها حالا زیر مدیریت مدیا قرار گرفته‌اند تا فرم‌های
                ثبت محتوا به‌صورت طبیعی به داده‌های مرجع وصل شوند.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <AdminStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            accentClassName={card.accent}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">ماژول‌های فعال پنل</h3>
              <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
                این بخش‌ها پایه‌ی مسیر توسعه‌ی فعلی ادمین را تشکیل می‌دهند.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {moduleCards.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-2xl bg-white/[0.06] p-3 text-[#f8d977] transition group-hover:bg-[#f5c518]/15">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#8ea4b3]">
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-white">
                    {item.label}
                  </h4>
                  <p className="mt-3 text-sm leading-7 text-[#b7c5cf]">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[32px] border border-[#38bdf8]/18 bg-[#08121a] p-6">
          <h3 className="text-xl font-bold text-white">قواعد این مرحله</h3>
          <div className="mt-5 space-y-3">
            {architectureNotes.map((note) => (
              <div
                key={note}
                className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d5e1e8]"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
        <h3 className="text-xl font-bold text-white">نقشه راه کوتاه</h3>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {roadmap.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-white">{item.title}</h4>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#8ea4b3]">
                  {item.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#b5c5cf]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/content-management"
          className="rounded-[30px] border border-white/10 bg-[linear-gradient(140deg,rgba(245,197,24,0.12),rgba(10,18,26,0.96))] p-6 transition hover:border-white/18"
        >
          <div className="flex items-center gap-3 text-[#f8d977]">
            <MdOutlineVideoLibrary className="h-6 w-6" />
            <span className="text-sm font-semibold">مدیریت مدیا</span>
          </div>
          <p className="mt-4 text-xl font-bold text-white">
            شروع مدیریت فیلم، سریال و استریم
          </p>
          <p className="mt-3 text-sm leading-7 text-[#d3dee5]">
            شاخه‌های Movies، Series و Live TV / Streams از همین‌جا در دسترس‌اند.
          </p>
        </Link>

        <Link
          href="/admin/taxonomy"
          className="rounded-[30px] border border-white/10 bg-[linear-gradient(140deg,rgba(56,189,248,0.12),rgba(10,18,26,0.96))] p-6 transition hover:border-white/18"
        >
          <div className="flex items-center gap-3 text-[#7dd3fc]">
            <MdOutlineCategory className="h-6 w-6" />
            <span className="text-sm font-semibold">طبقه بندی ها</span>
          </div>
          <p className="mt-4 text-xl font-bold text-white">
            مدیریت داده‌های مرجع محتوا
          </p>
          <p className="mt-3 text-sm leading-7 text-[#d3dee5]">
            Genres، Countries، Languages و Tags از این بخش مدیریت می‌شوند.
          </p>
        </Link>
      </section>
    </div>
  );
}
