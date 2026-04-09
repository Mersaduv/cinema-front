"use client";

import type { IconType } from "react-icons";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  icon: IconType;
  accentClassName: string;
};

export default function AdminStatCard({
  label,
  value,
  icon: Icon,
  accentClassName,
}: AdminStatCardProps) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[rgba(9,18,26,0.86)] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition hover:border-white/14 hover:bg-[rgba(11,23,32,0.96)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[#90a5b4]">{label}</p>
          <p className="mt-3 truncate text-2xl font-black leading-none text-white md:text-[2rem]">
            {value}
          </p>
        </div>
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accentClassName}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
