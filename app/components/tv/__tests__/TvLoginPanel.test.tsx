import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TvLoginPanel from "../TvLoginPanel";

const refreshUser = vi.fn().mockResolvedValue(undefined);
const requestTvActivationCode = vi.fn();
const pollTvActivation = vi.fn();
const setToken = vi.fn();

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ refreshUser }),
}));

vi.mock("../../../lib/tv-activation", () => ({
  requestTvActivationCode: (...args: unknown[]) => requestTvActivationCode(...args),
  pollTvActivation: (...args: unknown[]) => pollTvActivation(...args),
}));

vi.mock("../../../lib/token-storage", () => ({
  tokenStorage: {
    setToken: (...args: unknown[]) => setToken(...args),
  },
}));

describe("TvLoginPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestTvActivationCode.mockResolvedValue({
      code: "ABCD-1234",
      expires_at: new Date().toISOString(),
      expires_in: 600,
      pair_url: "/tv-login",
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the activation code while poll status is pending", async () => {
    pollTvActivation.mockResolvedValue({ status: "pending", expires_at: "" });

    render(<TvLoginPanel />);

    await waitFor(() => {
      expect(screen.getByText("ABCD-1234")).toBeTruthy();
    });
  });

  it("stores token and refreshes user when poll returns activated", async () => {
    pollTvActivation.mockResolvedValue({
      status: "activated",
      token: "tv-token-abc",
    });

    render(<TvLoginPanel />);

    await waitFor(() => {
      expect(setToken).toHaveBeenCalledWith("tv-token-abc");
      expect(refreshUser).toHaveBeenCalled();
    });
  });

  it("shows expiry error when poll returns expired", async () => {
    pollTvActivation.mockResolvedValue({ status: "expired" });

    render(<TvLoginPanel />);

    await waitFor(() => {
      expect(screen.getByText(/کد منقضی شد/)).toBeTruthy();
    });
  });
});
