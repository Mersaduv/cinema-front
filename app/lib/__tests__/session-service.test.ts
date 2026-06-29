import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../auth";

const mockUser: User = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  status: "active",
  roles: [{ id: 1, name: "User", slug: "user", description: null }],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

vi.mock("../auth", () => ({
  authService: {
    me: vi.fn(),
  },
}));

vi.mock("../token-storage", () => ({
  tokenStorage: {
    getToken: vi.fn(),
    removeToken: vi.fn(),
  },
}));

import { authService } from "../auth";
import { tokenStorage } from "../token-storage";
import {
  fetchCurrentSession,
  invalidateSession,
  peekCachedSessionUser,
  primeSessionUser,
} from "../session-service";
import { writeSessionSnapshot } from "../session-cache";

describe("session-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateSession();
    sessionStorage.clear();
  });

  afterEach(() => {
    invalidateSession();
    sessionStorage.clear();
  });

  it("returns null when no token is stored", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);

    const result = await fetchCurrentSession();

    expect(result.user).toBeNull();
    expect(authService.me).not.toHaveBeenCalled();
  });

  it("dedupes concurrent /me requests", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue("token-1");
    vi.mocked(authService.me).mockImplementation(
      () =>
        new Promise((resolve) => {
          window.setTimeout(
            () =>
              resolve({
                success: true,
                data: { user: mockUser },
              }),
            20,
          );
        }),
    );

    const [first, second] = await Promise.all([
      fetchCurrentSession(),
      fetchCurrentSession(),
    ]);

    expect(first.user?.id).toBe(1);
    expect(second.user?.id).toBe(1);
    expect(authService.me).toHaveBeenCalledTimes(1);
  });

  it("hydrates from session snapshot on network failure", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue("token-1");
    writeSessionSnapshot(mockUser);
    vi.mocked(authService.me).mockResolvedValue({
      success: false,
      message: "Network error",
    });

    const result = await fetchCurrentSession({ force: true });

    expect(result.user?.email).toBe("test@example.com");
    expect(result.fromCache).toBe(true);
  });

  it("primes memory cache for instant peek", () => {
    primeSessionUser(mockUser);

    expect(peekCachedSessionUser()?.name).toBe("Test User");
  });
});
