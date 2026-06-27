import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  PLAYBACK_FETCH_TIMEOUT_MS,
  fetchWithPlaybackTimeout,
  playbackFetchSignal,
} from "../playback-fetch";

describe("playbackFetchSignal", () => {
  it("exposes conservative timeout constant", () => {
    expect(PLAYBACK_FETCH_TIMEOUT_MS).toBeGreaterThanOrEqual(15_000);
  });

  it("returns an AbortSignal", () => {
    const signal = playbackFetchSignal();
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts when parent signal aborts", () => {
    const parent = new AbortController();
    const signal = playbackFetchSignal(parent.signal, 60_000);
    parent.abort();
    expect(signal.aborted).toBe(true);
  });
});

describe("playbackFetchSignal — hanging request", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts after the conservative timeout", () => {
    const signal = playbackFetchSignal(null, 500);
    let aborted = false;
    signal.addEventListener("abort", () => {
      aborted = true;
    });

    vi.advanceTimersByTime(500);
    expect(aborted).toBe(true);
  });

  it("fetchWithPlaybackTimeout aborts when upstream never responds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      ),
    );

    const pending = fetchWithPlaybackTimeout("https://cdn.example.com/master.m3u8", {}, 300);
    const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(300);
    await assertion;
  });
});
