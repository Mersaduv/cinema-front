import type { User } from "./auth";

const SESSION_CACHE_KEY = "auth_user_snapshot";
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

type SessionSnapshot = {
  user: User;
  cachedAt: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readSessionSnapshot(): User | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (!parsed?.user?.id || typeof parsed.cachedAt !== "number") {
      return null;
    }

    if (Date.now() - parsed.cachedAt > SESSION_CACHE_TTL_MS) {
      return null;
    }

    return parsed.user;
  } catch {
    return null;
  }
}

export function writeSessionSnapshot(user: User): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const payload: SessionSnapshot = {
      user,
      cachedAt: Date.now(),
    };
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode — ignore.
  }
}

export function clearSessionSnapshot(): void {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(SESSION_CACHE_KEY);
}
