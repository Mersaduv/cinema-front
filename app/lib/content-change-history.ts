export type ContentChangeLogEntry = {
  id: number;
  action: string;
  changed_fields: string[];
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
};

const actionLabels: Record<string, string> = {
  created: "ایجاد شد",
  updated: "به‌روزرسانی شد",
  published: "منتشر شد",
  unpublished: "به پیش‌نویس برگشت",
  tmdb_synced: "TMDB همگام‌سازی شد",
  hls_updated: "HLS به‌روزرسانی شد",
};

export function translateContentChangeAction(action: string): string {
  return actionLabels[action] ?? action;
}

export function formatRelativeTimestamp(isoDate: string | null): string {
  if (!isoDate) {
    return "—";
  }

  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) {
    return "—";
  }

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "همین الان";
  }

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);

    return `${minutes} دقیقه پیش`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);

    return `${hours} ساعت پیش`;
  }

  const days = Math.floor(diffMs / day);

  if (days < 30) {
    return `${days} روز پیش`;
  }

  return date.toLocaleDateString("fa-IR");
}
