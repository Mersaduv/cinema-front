export type WatchlistContentKind = "movie" | "series";

export type WatchlistItem = {
  kind: WatchlistContentKind;
  id: number;
  slug: string;
  title: string;
  poster_url?: string | null;
  release_year?: number | null;
  saved_at: string;
};

function storageKey(userId: number): string {
  return `cinema_watchlist_v1_${userId}`;
}

function readAll(userId: number): WatchlistItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed = raw ? (JSON.parse(raw) as WatchlistItem[]) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(userId: number, items: WatchlistItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(userId), JSON.stringify(items));
}

export function listWatchlist(userId: number): WatchlistItem[] {
  return readAll(userId).sort(
    (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime(),
  );
}

export function isWatchlisted(
  userId: number,
  kind: WatchlistContentKind,
  id: number,
): boolean {
  return readAll(userId).some((item) => item.kind === kind && item.id === id);
}

export function toggleWatchlist(
  userId: number,
  item: Omit<WatchlistItem, "saved_at">,
): { saved: boolean; items: WatchlistItem[] } {
  const current = readAll(userId);
  const exists = current.some(
    (row) => row.kind === item.kind && row.id === item.id,
  );

  if (exists) {
    const next = current.filter(
      (row) => !(row.kind === item.kind && row.id === item.id),
    );
    writeAll(userId, next);

    return { saved: false, items: next };
  }

  const next = [
    {
      ...item,
      saved_at: new Date().toISOString(),
    },
    ...current,
  ];
  writeAll(userId, next);

  return { saved: true, items: next };
}

export function removeFromWatchlist(
  userId: number,
  kind: WatchlistContentKind,
  id: number,
): WatchlistItem[] {
  const next = readAll(userId).filter(
    (row) => !(row.kind === kind && row.id === id),
  );
  writeAll(userId, next);

  return next;
}

export function watchlistCount(userId: number): number {
  return readAll(userId).length;
}
