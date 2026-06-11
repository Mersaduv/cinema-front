"use client";

import type { PublishStatus } from "../../lib/admin-movies";
import type { SeriesPublishStatus } from "../../lib/admin-series";

export type PipelineStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface ContentStatusItem {
  publish_status: PublishStatus | SeriesPublishStatus;
  pipeline_status?: PipelineStatus;
}

interface ContentStatusBadgeProps {
  item: ContentStatusItem;
  className?: string;
}

export function ContentStatusBadge({ item, className = "" }: ContentStatusBadgeProps) {
  const { publish_status, pipeline_status = "idle" } = item;

  if (pipeline_status === "pending" || pipeline_status === "running") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs font-medium text-[#f8d977] ${className}`}
      >
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#f5c518] border-t-transparent" />
        در حال پردازش
      </span>
    );
  }

  if (pipeline_status === "failed") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-[#fb7185]/25 bg-[#fb7185]/10 px-3 py-1 text-xs font-medium text-[#fda4af] ${className}`}
      >
        خطا در پردازش
      </span>
    );
  }

  const badges: Record<string, { label: string; className: string }> = {
    published: {
      label: "منتشر شده",
      className: "border-[#34d399]/25 bg-[#34d399]/10 text-[#86efac]",
    },
    draft: {
      label: "پیش‌نویس",
      className: "border-[#f5c518]/25 bg-[#f5c518]/10 text-[#f8d977]",
    },
    scheduled: {
      label: "زمان‌بندی",
      className: "border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#7dd3fc]",
    },
  };

  const badge = badges[publish_status] ?? badges.draft;

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${badge.className} ${className}`}
    >
      {badge.label}
    </span>
  );
}
