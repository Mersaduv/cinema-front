import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlineSparkles } from "react-icons/hi";

type AdminModuleIndexPageProps = {
  badge: string;
  title: string;
  description: string;
  groups: Array<{
    title: string;
    description: string;
    links: Array<{
      label: string;
      href: string;
      description: string;
    }>;
  }>;
  nextStep: string;
};

export default function AdminModuleIndexPage({
  badge,
  title,
  description,
  groups,
  nextStep,
}: AdminModuleIndexPageProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(140deg,rgba(245,197,24,0.15),rgba(8,16,24,0.95)_40%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
            <HiOutlineSparkles className="h-4 w-4" />
            {badge}
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-8 text-[#dbe6ed] md:text-lg">
            {description}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {groups.map((group) => (
          <article
            key={group.title}
            className="rounded-[30px] border border-white/10 bg-[#0b1720] p-6 shadow-[0_16px_35px_rgba(0,0,0,0.18)]"
          >
            <h3 className="text-xl font-bold text-white">{group.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#8ea4b3]">
              {group.description}
            </p>

            <div className="mt-6 space-y-3">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">
                      {link.label}
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-[#8ea4b3]">
                      {link.description}
                    </span>
                  </span>
                  <span className="mt-1 rounded-2xl bg-white/[0.05] p-2 text-[#f8d977] transition group-hover:bg-[#f5c518]/15">
                    <HiOutlineArrowLeft className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[30px] border border-[#38bdf8]/18 bg-[#08121a] p-6">
        <p className="text-sm font-semibold text-[#7dd3fc]">گام بعدی</p>
        <p className="mt-3 text-sm leading-7 text-[#d6e2e9]">{nextStep}</p>
      </section>
    </div>
  );
}
