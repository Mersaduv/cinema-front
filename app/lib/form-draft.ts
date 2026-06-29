"use client";

import { useEffect, useRef, useState } from "react";

export const MOVIE_DRAFT_KEY_PREFIX = "cinema_movie_draft_";
export const SERIES_DRAFT_KEY_PREFIX = "cinema_series_draft_";

export function movieDraftKey(movieId?: number | null): string {
  return `${MOVIE_DRAFT_KEY_PREFIX}${movieId ?? "new"}`;
}

export function seriesDraftKey(seriesId?: number | null): string {
  return `${SERIES_DRAFT_KEY_PREFIX}${seriesId ?? "new"}`;
}

export function saveDraft(key: string, state: object): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function loadDraft<T extends object>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as T;

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}

export function useFormDraftRecovery<T extends object>(options: {
  enabled: boolean;
  draftKey: string;
  onRestore: (draft: T) => void;
}): {
  showBanner: boolean;
  restoreDraft: () => void;
  dismissDraft: () => void;
} {
  const { enabled, draftKey, onRestore } = options;
  const [showBanner, setShowBanner] = useState(false);
  const pendingDraftRef = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) {
      pendingDraftRef.current = null;
      setShowBanner(false);
      return;
    }

    const draft = loadDraft<T>(draftKey);

    if (draft) {
      pendingDraftRef.current = draft;
      setShowBanner(true);
    }
  }, [enabled, draftKey]);

  const restoreDraft = () => {
    if (pendingDraftRef.current) {
      onRestore(pendingDraftRef.current);
    }

    pendingDraftRef.current = null;
    setShowBanner(false);
  };

  const dismissDraft = () => {
    clearDraft(draftKey);
    pendingDraftRef.current = null;
    setShowBanner(false);
  };

  return { showBanner, restoreDraft, dismissDraft };
}

export function useDebouncedDraftSave(
  draftKey: string,
  state: object,
  enabled: boolean,
  delayMs = 30_000,
): void {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveDraft(draftKey, stateRef.current);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [draftKey, enabled, delayMs, state]);
}

export function stripMovieDraftFields<T extends Record<string, unknown>>(form: T) {
  const {
    hls_url: _hlsUrl,
    dubbed_audio_url: _dubbedAudioUrl,
    subtitle_source_path: _subtitleSourcePath,
    is_featured: _isFeatured,
    catalog_visibility: _catalogVisibility,
    ...draft
  } = form;

  return draft;
}

export function stripSeriesDraftFields<
  T extends {
    publish_status?: unknown;
    scheduled_for?: unknown;
    is_featured?: unknown;
    hls_base_url?: unknown;
    seasons?: Array<{ episodes?: Array<Record<string, unknown>> }>;
  },
>(form: T) {
  const {
    publish_status: _publishStatus,
    scheduled_for: _scheduledFor,
    is_featured: _isFeatured,
    hls_base_url: _hlsBaseUrl,
    seasons,
    ...rest
  } = form;

  const strippedSeasons = (seasons ?? []).map((season) => ({
    ...season,
    hls_base_url: undefined,
    episodes: (season.episodes ?? []).map((episode) => {
      const {
        hls_url: _hlsUrl,
        dash_url: _dashUrl,
        video_url: _videoUrl,
        embed_url: _embedUrl,
        subtitle_url: _subtitleUrl,
        dubbed_audio_url: _dubbedAudioUrl,
        download_links: _downloadLinks,
        ...episodeDraft
      } = episode;

      return episodeDraft;
    }),
  }));

  return {
    ...rest,
    seasons: strippedSeasons,
  };
}
