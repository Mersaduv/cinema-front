"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { HiMiniPlay, HiOutlineXMark } from "react-icons/hi2";
import { useAuth } from "../contexts/AuthContext";
import { tokenStorage } from "../lib/token-storage";
import { moviesService } from "../lib/movies";
import { seriesService } from "../lib/series";
import {
  createDefaultTrackerConfig,
  ProgressTracker,
} from "../features/player/services/ProgressTracker";
import type { WatchProgressRecord } from "../features/player/services/progress.types";
import ContentListSlider from "./catalog/ContentListSlider";
import { SeriesStackShell } from "./catalog/SeriesPosterStack";
import { BackdropImage, EpisodeStillImage, PosterImage } from "./images";
import { VIEWER_ACCENT } from "../lib/viewer-theme";
import { TV_CARD_FOCUS_CLASS, TV_FOCUS_RING_CLASS } from "../lib/tv/focus";
import { useIsTvCompat } from "../hooks/useTvCapabilities";

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

function resolveCardImage(
  record: WatchProgressRecord,
  layout: "poster" | "landscape",
): string | null {
  if (record.mediaType === "series") {
    const episodeImage = pickFromRecord(record, [
      "stillUrl",
      "still_url",
      "episodeStillUrl",
      "episode_still_url",
      "episodeImageUrl",
      "episode_image_url",
      "thumbnailUrl",
      "thumbnail_url",
    ]);
    if (episodeImage) {
      return episodeImage;
    }
  }

  if (layout === "landscape") {
    const landscapeImage = pickFromRecord(record, [
      "backdropUrl",
      "backdrop_url",
      "coverUrl",
      "cover_url",
      "posterUrl",
      "poster_url",
    ]);
    if (landscapeImage) {
      return landscapeImage;
    }
  }

  const primaryPoster = pickFromRecord(record, ["posterUrl", "poster_url"]);
  if (primaryPoster) {
    return primaryPoster;
  }

  return pickFromRecord(record, ["backdropUrl", "backdrop_url", "coverUrl", "cover_url"]);
}

async function fetchCatalogImages(
  record: WatchProgressRecord,
): Promise<Partial<WatchProgressRecord> | null> {
  const slug =
    record.mediaType === "series"
      ? record.seriesSlug || record.slug
      : record.slug;

  if (!slug) {
    return null;
  }

  try {
    if (record.mediaType === "series") {
      const response = await seriesService.show(slug, { lite: true });
      const series = response.data?.series;
      if (!series) {
        return null;
      }

      return {
        title: series.title || record.title,
        posterUrl: series.poster_url ?? null,
        backdropUrl: series.backdrop_url ?? null,
        slug: series.slug || record.slug,
        seriesSlug: series.slug || record.seriesSlug,
      };
    }

    const response = await moviesService.show(slug);
    const movie = response.data?.movie;
    if (!movie) {
      return null;
    }

    return {
      title: movie.title || record.title,
      posterUrl:
        movie.poster_url ||
        movie.poster_image?.src ||
        movie.poster_image?.original ||
        null,
      backdropUrl:
        movie.backdrop_image?.src ||
        movie.backdrop_image?.original ||
        movie.details?.backdrop_url ||
        null,
      slug: movie.slug || record.slug,
    };
  } catch {
    return null;
  }
}

async function enrichMissingCardImages(
  records: WatchProgressRecord[],
  layout: "poster" | "landscape",
): Promise<WatchProgressRecord[]> {
  const tracker = ProgressTracker.getInstance();

  return Promise.all(
    records.map(async (record) => {
      if (resolveCardImage(record, layout)) {
        return record;
      }

      const patch = await fetchCatalogImages(record);
      if (!patch) {
        return record;
      }

      tracker.patchDisplayMetadata(record.mediaId, record.episodeId, {
        title: patch.title,
        posterUrl: patch.posterUrl,
        backdropUrl: patch.backdropUrl,
        stillUrl: patch.stillUrl,
        slug: patch.slug,
        seriesSlug: patch.seriesSlug,
      });

      return {
        ...record,
        ...patch,
        title: patch.title || record.title,
        posterUrl: patch.posterUrl ?? record.posterUrl,
        backdropUrl: patch.backdropUrl ?? record.backdropUrl,
      };
    }),
  );
}

function progressRowKey(record: WatchProgressRecord): string {
  return `${record.mediaId}:${record.episodeId ?? "movie"}`;
}

async function fetchWatchProgress(
  mediaType: "movie" | "series" | "all",
  limit: number,
  showCompleted: boolean,
): Promise<WatchProgressRecord[]> {
  const token = tokenStorage.getToken();
  if (!token) {
    throw new Error("missing token");
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

  const response = await fetch(`${apiBase}/v1/watch-progress?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("watch-progress fetch failed");
  }

  const payload = (await response.json()) as {
    data?: { items?: WatchProgressRecord[] };
  };
  return payload?.data?.items ?? [];
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
      backdropUrl: serverRow.backdropUrl || localRow.backdropUrl,
      stillUrl: serverRow.stillUrl || localRow.stillUrl,
    };
  });

  const serverKeys = new Set(serverRows.map(progressRowKey));
  const localOnlyRows = localRows.filter((row) => !serverKeys.has(progressRowKey(row)));
  return [...merged, ...localOnlyRows];
}

const LANDSCAPE_SLIDE_CLASS =
  "shrink-0 snap-start w-[62%] min-w-[220px] max-w-[340px] sm:w-[44%] md:w-[34%] lg:w-[26%] xl:w-[22%]";

const POSTER_SLIDE_CLASS =
  "shrink-0 snap-start w-[148px] min-w-[148px] max-w-[168px] sm:w-[168px]";

function ContinueWatchingCard({
  record,
  onRemove,
  layout,
  index = 0,
}: {
  record: WatchProgressRecord;
  onRemove: (record: WatchProgressRecord) => void;
  layout: "poster" | "landscape";
  index?: number;
}) {
  const isTvCompat = useIsTvCompat();
  const href = buildWatchHref(record);

  if (!href) {
    return null;
  }

  const isLandscape = layout === "landscape";
  const isSeries = record.mediaType === "series";
  const cardTitle = record.title || "ادامه تماشا";
  const cardImage = resolveCardImage(record, layout);
  const imageLoading = isTvCompat && index < 8 ? "eager" : undefined;
  const shellAttrs = isLandscape
    ? { "data-tv-landscape-shell": true }
    : { "data-tv-poster-shell": true };

  const mediaShell = (
    <div
      {...shellAttrs}
      className={`relative overflow-hidden rounded-xl bg-[#12161f] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${
        isSeries ? "z-[1]" : ""
      } ${isLandscape ? "aspect-video" : "aspect-[2/3]"}`}
    >
      {isLandscape ? (
        isSeries ? (
          <EpisodeStillImage
            seriesTitle={cardTitle}
            src={cardImage}
            usage="episode-card"
            loading={imageLoading}
            wrapperClassName="h-full transition duration-500 group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
          />
        ) : (
          <BackdropImage
            title={cardTitle}
            src={cardImage}
            usage="detail-backdrop"
            loading={imageLoading}
            wrapperClassName="h-full transition duration-500 group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
          />
        )
      ) : (
        <PosterImage
          title={cardTitle}
          src={cardImage}
          usage="poster-grid"
          loading={imageLoading}
          wrapperClassName="h-full transition duration-500 group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
        />
      )}

      <div
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 ${TV_CARD_FOCUS_CLASS}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
          <HiMiniPlay className="h-7 w-7" />
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-white/15" dir="ltr">
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.min(100, record.percentWatched)}%`,
            backgroundColor: VIEWER_ACCENT,
          }}
        />
      </div>
    </div>
  );

  return (
    <div className={`group relative ${isLandscape ? "w-full" : ""}`}>
      <Link
        href={href}
        aria-label={cardTitle}
        data-tv-focusable
        data-tv-carousel-item
        data-content-kind={isSeries ? "series" : "movie"}
        tabIndex={0}
        className={`block rounded-xl ${TV_FOCUS_RING_CLASS}`}
      >
        {isSeries ? (
          <SeriesStackShell variant={isLandscape ? "landscape" : "portrait"}>
            {mediaShell}
          </SeriesStackShell>
        ) : (
          mediaShell
        )}
        <p className="mt-2 line-clamp-2 text-right text-xs font-medium text-white/90 md:text-sm">
          {cardTitle}
        </p>
        {isSeries && record.seasonNumber && record.episodeNumber ? (
          <p className="mt-0.5 text-right text-[11px] text-white/50">
            فصل {record.seasonNumber} — قسمت {record.episodeNumber}
          </p>
        ) : null}
      </Link>
      <button
        type="button"
        aria-label="حذف از تاریخچه"
        data-tv-focusable
        onClick={() => onRemove(record)}
        className={`absolute ${isSeries ? "top-3.5" : "top-2"} left-2 z-30 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/80 opacity-0 transition hover:bg-black group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 ${TV_FOCUS_RING_CLASS} ${TV_CARD_FOCUS_CLASS}`}
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
  layout = "landscape",
}: {
  mediaType: "movie" | "series" | "all";
  showCompleted?: boolean;
  limit?: number;
  layout?: "poster" | "landscape";
}) {
  const { user, hasToken, isAuthenticated, isViewer } = useAuth();
  const [items, setItems] = useState<WatchProgressRecord[]>([]);
  const [ready, setReady] = useState(false);

  const userId = user?.id != null ? String(user.id) : null;

  const watchProgressKey =
    hasToken && isViewer
      ? `watch-progress:${userId ?? "anon"}:${mediaType}:${limit}:${showCompleted ? 1 : 0}`
      : null;

  const { data: serverItems, error: serverItemsError } = useSWR(
    watchProgressKey,
    () => fetchWatchProgress(mediaType, limit, showCompleted),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60_000,
      refreshInterval: 120_000,
    },
  );

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

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const missingImageKey = useMemo(
    () =>
      items
        .filter((record) => !resolveCardImage(record, layout))
        .map(progressRowKey)
        .join("|"),
    [items, layout],
  );

  useEffect(() => {
    if (!ready || !missingImageKey) {
      return;
    }

    let cancelled = false;
    const targetKeys = new Set(missingImageKey.split("|").filter(Boolean));
    const targets = itemsRef.current.filter((record) =>
      targetKeys.has(progressRowKey(record)),
    );

    void enrichMissingCardImages(targets, layout).then((enrichedTargets) => {
      if (cancelled || enrichedTargets.length === 0) {
        return;
      }

      const byKey = new Map(
        enrichedTargets.map((row) => [progressRowKey(row), row]),
      );

      setItems((current) => {
        let changed = false;
        const next = current.map((row) => {
          const enriched = byKey.get(progressRowKey(row));
          if (!enriched) {
            return row;
          }

          if (
            enriched.posterUrl === row.posterUrl &&
            enriched.backdropUrl === row.backdropUrl &&
            enriched.stillUrl === row.stillUrl
          ) {
            return row;
          }

          changed = true;
          return enriched;
        });

        return changed ? next : current;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [layout, missingImageKey, ready]);

  useEffect(() => {
    if (hasToken && isViewer) {
      return;
    }

    const timer = window.setTimeout(() => {
      loadLocal();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasToken, isViewer, loadLocal]);

  useEffect(() => {
    if (!hasToken || !isViewer || !serverItemsError) {
      return;
    }

    loadLocal();
  }, [hasToken, isViewer, loadLocal, serverItemsError]);

  useEffect(() => {
    if (!hasToken || !isViewer || !serverItems) {
      return;
    }

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
  }, [
    hasToken,
    isAuthenticated,
    isViewer,
    limit,
    mediaType,
    serverItems,
    showCompleted,
    userId,
  ]);

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

  const slideClass = layout === "landscape" ? LANDSCAPE_SLIDE_CLASS : POSTER_SLIDE_CLASS;

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-right text-lg font-bold text-white md:text-xl">{heading}</h2>
      </div>
      <ContentListSlider ariaLabel={heading}>
        {playableItems.map((record, index) => (
          <div
            key={`${record.mediaId}:${record.episodeId ?? "movie"}`}
            data-slider-slide
            className={slideClass}
          >
            <ContinueWatchingCard
              record={record}
              onRemove={handleRemove}
              layout={layout}
              index={index}
            />
          </div>
        ))}
      </ContentListSlider>
    </section>
  );
}
