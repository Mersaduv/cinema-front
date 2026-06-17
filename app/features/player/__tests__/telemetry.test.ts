import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerTelemetry, resetPlayerTelemetry } from "../services/telemetry";

describe("PlayerTelemetry batching", () => {
  beforeEach(() => {
    resetPlayerTelemetry();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetPlayerTelemetry();
  });

  it("batches events and sends after 10s", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {
      location: { href: "http://localhost:3000/watch/sinners" },
      localStorage: { getItem: () => null, setItem: vi.fn() },
    });

    const telemetry = new PlayerTelemetry();
    telemetry.configure("hlsjs", "desktop");
    telemetry.markSessionStart();

    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(10_000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/v1/qoe");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: "omit" });
  });

  it("immediately sends error and ended events without batching", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {
      location: { href: "http://localhost:3000/watch/sinners" },
      localStorage: { getItem: () => null, setItem: vi.fn() },
    });

    const telemetry = new PlayerTelemetry();
    telemetry.configure("hlsjs", "desktop");
    telemetry.trackError("decode", "boom");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    telemetry.markEnded();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
