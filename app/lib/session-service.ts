import type { ApiResponse } from "./api";
import { authService, type User } from "./auth";
import {
  clearSessionSnapshot,
  readSessionSnapshot,
  writeSessionSnapshot,
} from "./session-cache";
import { tokenStorage } from "./token-storage";

export type SessionFetchOptions = {
  /** Bypass in-memory dedupe and force a network round-trip. */
  force?: boolean;
  /** Load role permissions (heavier payload) — use on admin surfaces. */
  includePermissions?: boolean;
};

export type SessionResult = {
  user: User | null;
  status?: number;
  fromCache?: boolean;
};

const MEMORY_TTL_MS = 60_000;

let memoryUser: User | null = null;
let memoryFetchedAt = 0;
let inflight: Promise<SessionResult> | null = null;

function isMemoryFresh(includePermissions: boolean): boolean {
  if (!memoryUser) {
    return false;
  }

  if (Date.now() - memoryFetchedAt > MEMORY_TTL_MS) {
    return false;
  }

  if (includePermissions) {
    return memoryUser.roles.some((role) => Array.isArray(role.permissions));
  }

  return true;
}

function applyUser(user: User | null): SessionResult {
  if (user) {
    memoryUser = user;
    memoryFetchedAt = Date.now();
    writeSessionSnapshot(user);
  }

  return { user };
}

/**
 * Resolves the current user with in-flight dedupe + short-lived memory cache.
 * Falls back to a sessionStorage snapshot for instant UI hydration.
 */
export async function fetchCurrentSession(
  options: SessionFetchOptions = {},
): Promise<SessionResult> {
  const { force = false, includePermissions = false } = options;
  const token = tokenStorage.getToken();

  if (!token) {
    memoryUser = null;
    memoryFetchedAt = 0;
    clearSessionSnapshot();
    return { user: null };
  }

  if (!force && isMemoryFresh(includePermissions)) {
    return { user: memoryUser, fromCache: true };
  }

  if (!force && inflight) {
    return inflight;
  }

  inflight = (async (): Promise<SessionResult> => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response: ApiResponse<{ user: User }> = await authService.me({
        includePermissions,
      });

      if (response.success && response.data?.user) {
        return applyUser(response.data.user);
      }

      const status = response.status ?? 0;
      if (status === 401 || status === 403) {
        tokenStorage.removeToken();
        memoryUser = null;
        memoryFetchedAt = 0;
        clearSessionSnapshot();
        return { user: null, status };
      }

      if (attempt === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
    }

    const snapshot = readSessionSnapshot();
    if (snapshot) {
      memoryUser = snapshot;
      memoryFetchedAt = Date.now();
      return { user: snapshot, fromCache: true };
    }

    return { user: null };
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function peekCachedSessionUser(): User | null {
  if (isMemoryFresh(false)) {
    return memoryUser;
  }

  return readSessionSnapshot();
}

export function primeSessionUser(user: User): void {
  applyUser(user);
}

export function invalidateSession(): void {
  memoryUser = null;
  memoryFetchedAt = 0;
  inflight = null;
  clearSessionSnapshot();
  tokenStorage.removeToken();
}
