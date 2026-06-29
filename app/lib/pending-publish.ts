export type PendingMoviePublish = {
  movieId: number;
  targetStatus: "draft" | "scheduled" | "published";
  scheduledFor?: string | null;
  pendingPublish: true;
  savedAt: string;
};

const STORAGE_PREFIX = "cinema_pending_movie_publish_";

export function pendingPublishStorageKey(movieId: number): string {
  return `${STORAGE_PREFIX}${movieId}`;
}

export function savePendingMoviePublish(payload: PendingMoviePublish): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      pendingPublishStorageKey(payload.movieId),
      JSON.stringify(payload),
    );
  } catch {
    // Ignore storage errors.
  }
}

export function loadPendingMoviePublish(movieId: number): PendingMoviePublish | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(pendingPublishStorageKey(movieId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PendingMoviePublish;

    return parsed?.pendingPublish ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingMoviePublish(movieId: number): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(pendingPublishStorageKey(movieId));
  } catch {
    // Ignore storage errors.
  }
}
