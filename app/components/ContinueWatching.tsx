"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import { useAuth } from "../contexts/AuthContext";
import { tokenStorage } from "../lib/token-storage";
import {
  createDefaultTrackerConfig,
  ProgressTracker,
} from "../features/player/services/ProgressTracker";
import type { WatchProgressRecord } from "../features/player/services/progress.types";
import { PosterImage } from "./images";

function buildWatchHref(record: WatchProgressRecord): string | null {
  if (record.mediaType === "series") {
    const seriesSlug = record.seriesSlug || record.slug;
    if (!seriesSlug) {
      return null;
    }

    const season = record.seasonNumber ?? 1;
    const episode = record.episodeNumber ?? 1;
    return `/watch/${seriesSlug}?season=${season}&episode=${episode}`;
  }

  if (!record.slug) {
    return null;
  }

  return `/watch/${record.slug}`;
}

function matchesMediaType(
  record: WatchProgressRecord,
  mediaType: "movie" | "series",
): boolean {
  return record.mediaType === mediaType;
}

function normalizeItems(
  rows: WatchProgressRecord[],
  mediaType: "movie" | "series" | "all",
  showCompleted: boolean,
  limit: number,
): WatchProgressRecord[] {
  return rows
    .filter((row) => (mediaType === "all" ? true : matchesMediaType(row, mediaType)))
    .filter((row) => showCompleted || !row.isCompleted)
    .filter((row) => buildWatchHref(row) !== null)
    .sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a))
    .slice(0, limit);
}

function toEpochMs(value: unknown): number {
  if (typeof value !== "string" || value.trim().length === 0) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRecordTimestamp(record: WatchProgressRecord): number {
  const lastWatched = toEpochMs(record.lastWatchedAt);
  const syncedAt = toEpochMs(record.syncedAt);
  return Math.max(lastWatched, syncedAt, record.syncVersion ?? 0);
}

function pickFromRecord(record: WatchProgressRecord, keys: readonly string[]): string | null {
  const data = record as WatchProgressRecord & Record<string, unknown>;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

function resolveCardImage(record: WatchProgressRecord): string | null {
  if (record.mediaType === "series") {
    const episodeImage = pickFromRecord(record, [
      "episodeStillUrl",
      "episode_still_url",
      "episodeImageUrl",
      "episode_image_url",
      "stillUrl",
      "still_url",
      "thumbnailUrl",
      "thumbnail_url",
    ]);
    if (episodeImage) {
      return episodeImage;
    }
  }

  const primaryPoster = pickFromRecord(record, ["posterUrl", "poster_url"]);
  if (primaryPoster) {
    return primaryPoster;
  }

  return pickFromRecord(record, ["backdropUrl", "backdrop_url", "coverUrl", "cover_url"]);
}

function progressRowKey(record: WatchProgressRecord): string {
  return `${record.mediaId}:${record.episodeId ?? "movie"}`;
}

function mergeProgressRows(
  serverRows: WatchProgressRecord[],
  localRows: WatchProgressRecord[],
): WatchProgressRecord[] {
  const localByKey = new Map(localRows.map((row) => [progressRowKey(row), row]));
  const merged = serverRows.map((serverRow) => {
    const localRow = localByKey.get(progressRowKey(serverRow));
    if (!localRow) {
      return serverRow;
    }

    const serverTime = getRecordTimestamp(serverRow);
    const localTime = getRecordTimestamp(localRow);
    const lastWatchedAt =
      serverTime >= localTime
        ? serverRow.lastWatchedAt || localRow.lastWatchedAt
        : localRow.lastWatchedAt || serverRow.lastWatchedAt;

    return {
      ...localRow,
      ...serverRow,
      lastWatchedAt,
      // Keep local metadata when server payload is partial.
      title: serverRow.title || localRow.title,
      slug: serverRow.slug || localRow.slug,
      seriesSlug: serverRow.seriesSlug || localRow.seriesSlug,
      posterUrl: serverRow.posterUrl || localRow.posterUrl,
    };
  });

  const serverKeys = new Set(serverRows.map(progressRowKey));
  const localOnlyRows = localRows.filter((row) => !serverKeys.has(progressRowKey(row)));
  return [...merged, ...localOnlyRows];
}

function ContinueWatchingCard({
  record,
  onRemove,
}: {
  record: WatchProgressRecord;
  onRemove: (record: WatchProgressRecord) => void;
}) {
  const href = buildWatchHref(record);

  if (!href) {
    return null;
  }

  return (
    <div className="group relative w-[148px] shrink-0 sm:w-[168px]">
      <Link href={href} data-tv-focusable className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#12161f]">
          <PosterImage
            title={record.title || "ادامه تماشا"}
            src={resolveCardImage(record)}
            usage="poster-grid"
            wrapperClassName="h-full transition duration-500 group-hover:scale-[1.04]"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1 bg-white/15"
            dir="ltr"
          >
            <div
              className="h-full origin-left bg-[#ef4444] transition-all"
              style={{ width: `${Math.min(100, record.percentWatched)}%` }}
            />
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-right text-xs font-medium text-white/90">
          {record.title || "بدون عنوان"}
        </p>
        {record.mediaType === "series" &&
        record.seasonNumber &&
        record.episodeNumber ? (
          <p className="mt-0.5 text-right text-[11px] text-white/50">
            فصل {record.seasonNumber} — قسمت {record.episodeNumber}
          </p>
        ) : null}
      </Link>
      <button
        type="button"
        aria-label="حذف از تاریخچه"
        onClick={() => onRemove(record)}
        className="absolute top-2 left-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/80 opacity-0 transition hover:bg-black group-hover:opacity-100"
      >
        <HiOutlineXMark className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ContinueWatching({
  mediaType,
  showCompleted = false,
  limit = 20,
}: {
  mediaType: "movie" | "series" | "all";
  showCompleted?: boolean;
  limit?: number;
}) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<WatchProgressRecord[]>([]);
  const [ready, setReady] = useState(false);

  const userId = user?.id != null ? String(user.id) : null;

  const loadLocal = useCallback(() => {
    const tracker = ProgressTracker.getInstance();
    tracker.init(
      createDefaultTrackerConfig({
        userId,
        isAuthenticated,
        getAuthToken: () => tokenStorage.getToken(),
      }),
    );

    const local = normalizeItems(
      tracker.getAllHistory(showCompleted),
      mediaType,
      showCompleted,
      limit,
    );

    setItems(local);
    setReady(true);
  }, [isAuthenticated, limit, mediaType, showCompleted, userId]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    const timer = window.setTimeout(() => {
      loadLocal();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, loadLocal]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = tokenStorage.getToken();
    if (!token) {
      const timer = window.setTimeout(() => {
        loadLocal();
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";
    const params = new URLSearchParams({
      limit: String(limit),
    });
    if (mediaType !== "all") {
      params.set("media_type", mediaType);
    }

    if (showCompleted) {
      params.set("include_completed", "1");
    }

    const controller = new AbortController();

    void fetch(`${apiBase}/v1/watch-progress?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { data?: { items?: WatchProgressRecord[] } } | null) => {
        const serverItems = payload?.data?.items ?? [];
        const tracker = ProgressTracker.getInstance();
        tracker.init(
          createDefaultTrackerConfig({
            userId,
            isAuthenticated,
            getAuthToken: () => tokenStorage.getToken(),
          }),
        );
        tracker.reconcileWithServerRecords(
          serverItems,
          mediaType === "all" ? undefined : { mediaType },
        );
        const localItems = tracker.getAllHistory(showCompleted);
        const mergedItems = mergeProgressRows(serverItems, localItems);
        setItems(normalizeItems(mergedItems, mediaType, showCompleted, limit));
        setReady(true);
      })
      .catch(() => {
        loadLocal();
      });

    return () => controller.abort();
  }, [isAuthenticated, limit, loadLocal, mediaType, showCompleted, userId]);

  const playableItems = items.filter((record) => buildWatchHref(record) !== null);
  const hasItems = playableItems.length > 0;
  const heading = useMemo(() => "ادامه تماشا", []);

  const handleRemove = useCallback(
    (record: WatchProgressRecord) => {
      const tracker = ProgressTracker.getInstance();
      tracker.clearItem(record.mediaId, record.episodeId);
      setItems((current) =>
        current.filter(
          (row) =>
            !(
              row.mediaId === record.mediaId &&
              row.episodeId === record.episodeId
            ),
        ),
      );

      if (isAuthenticated) {
        const token = tokenStorage.getToken();
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api";
        const query = record.episodeId
          ? `?episodeId=${encodeURIComponent(record.episodeId)}`
          : "";

        void fetch(
          `${apiBase}/v1/watch-progress/${encodeURIComponent(record.mediaId)}${query}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token ?? ""}`,
            },
          },
        );
      }
    },
    [isAuthenticated],
  );

  if (!ready || !hasItems) {
    return null;
  }

  return (
    <section className="mb-8" dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white md:text-xl">{heading}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {playableItems.map((record) => (
          <ContinueWatchingCard
            key={`${record.mediaId}:${record.episodeId ?? "movie"}`}
            record={record}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </section>
  );
}
