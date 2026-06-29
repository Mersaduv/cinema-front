"use client";

import { useEffect, useState } from "react";
import {
  formatRelativeTimestamp,
  translateContentChangeAction,
  type ContentChangeLogEntry,
} from "../../lib/content-change-history";

type ContentChangeHistoryPanelProps = {
  entityLabel: string;
  loadHistory: (page?: number) => Promise<{
    history: ContentChangeLogEntry[];
    pagination: {
      current_page: number;
      last_page: number;
    };
  } | null>;
};

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ContentChangeHistoryPanel({
  entityLabel,
  loadHistory,
}: ContentChangeHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<ContentChangeLogEntry[]>([]);

  useEffect(() => {
    if (!open || entries.length > 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");

      try {
        const payload = await loadHistory(1);

        if (cancelled) {
          return;
        }

        if (!payload) {
          setError("دریافت تاریخچه انجام نشد.");
          return;
        }

        setEntries(payload.history);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, entries.length, loadHistory]);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
    >
      <summary className="cursor-pointer text-sm font-semibold text-white">
        تاریخچه {entityLabel}
      </summary>

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm text-[#8ea4b3]">در حال بارگذاری تاریخچه...</p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </p>
        ) : null}

        {!loading && !error && entries.length === 0 ? (
          <p className="text-sm text-[#8ea4b3]">هنوز رویدادی ثبت نشده است.</p>
        ) : null}

        {!loading && entries.length > 0 ? (
          <ol className="space-y-4">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex gap-3 rounded-2xl border border-white/8 bg-[#071019]/70 px-4 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-bold text-white">
                  {entry.user?.name ? userInitials(entry.user.name) : "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {entry.user?.name ?? "سیستم"} — {translateContentChangeAction(entry.action)}
                    </p>
                    <span className="text-xs text-[#8ea4b3]">
                      {formatRelativeTimestamp(entry.created_at)}
                    </span>
                  </div>
                  {entry.changed_fields.length > 0 ? (
                    <p className="mt-2 text-xs leading-6 text-[#b6c5cf]">
                      فیلدها: {entry.changed_fields.join("، ")}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </details>
  );
}
