import { afterEach, describe, expect, it, vi } from "vitest";
import { postBeacon } from "../beacon";

describe("postBeacon", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses navigator.sendBeacon when available", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("fetch", vi.fn());

    const result = postBeacon("https://example.test/qoe", '{"ok":true}');

    expect(result).toBe(true);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon.mock.calls[0]?.[0]).toBe("https://example.test/qoe");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to fetch with keepalive when sendBeacon is unavailable", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("fetch", fetchMock);

    const result = postBeacon("https://example.test/progress", '{"t":1}');

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/progress",
      expect.objectContaining({
        method: "POST",
        body: '{"t":1}',
        keepalive: true,
      }),
    );
  });
});
