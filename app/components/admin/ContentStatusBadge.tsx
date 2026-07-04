"use client";

import type { PublishStatus, ProcessingStatus } from "../../lib/admin-movies";
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
  processing_status?: ProcessingStatus | string;
  image_status?: string | null;
}

interface ContentStatusBadgeProps {
  item: ContentStatusItem;
  className?: string;
}

function isProcessing(item: ContentStatusItem): boolean {
  const pipelineStatus = item.pipeline_status ?? "idle";

  if (pipelineStatus === "pending" || pipelineStatus === "running") {
    return true;
  }

  if (item.image_status === "processing") {
    return true;
  }

  const processingStatus = item.processing_status;

  if (
    processingStatus &&
    !["ready", "failed"].includes(processingStatus)
  ) {
    return true;
  }

  return false;
}

export function ContentStatusBadge({ item, className = "" }: ContentStatusBadgeProps) {
  const { publish_status, pipeline_status = "idle" } = item;

  if (isProcessing(item)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs font-medium text-[#f8d977] ${className}`}
        title="پردازش HLS، تصاویر یا pipeline در پس‌زمینه"
      >
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#f5c518] border-t-transparent" />
        در حال پردازش
      </span>
    );
  }

  if (pipeline_status === "failed" || item.processing_status === "failed" || item.image_status === "failed") {
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
