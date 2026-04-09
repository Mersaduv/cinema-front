import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineClock } from "react-icons/hi";

export default function AdminPlaceholderPage({
  badge,
  title,
  description,
  highlights,
  nextStep,
}: {
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  nextStep: string;
}) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_45%,rgba(56,189,248,0.12))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] md:p-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
            <HiOutlineClock className="h-4 w-4" />
            {badge}
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-8 text-[#d8e3ea]">
            {description}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#0b1720] p-6">
          <h3 className="text-lg font-bold text-white">مواردی که در این بخش می‌سازیم</h3>
          <div className="mt-5 grid gap-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]"
              >
                {highlight}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#38bdf8]/20 bg-[#08121a] p-6">
          <p className="text-sm font-semibold text-[#7dd3fc]">گام بعدی</p>
          <p className="mt-3 text-sm leading-7 text-[#d5e2e9]">{nextStep}</p>
          <Link
            href="/admin"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            <span>بازگشت به داشبورد ادمین</span>
            <HiOutlineArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
