import { describe, expect, it } from "vitest";
import {
  applyPlaybackFetchInit,
  applyPlaybackRequestHeaders,
  isCdnMediaUrl,
  isSameOriginMediaRequest,
  rewriteCdnUrlForPlayback,
} from "../../../lib/playback-networking";
import {
  isStreamingMediaExtension,
  resolveMediaContentType,
} from "../../../lib/media-content-types";

describe("media-content-types", () => {
  it("maps HLS and DASH segment extensions to streaming MIME types", () => {
    expect(resolveMediaContentType(".ts")).toBe("video/mp2t");
    expect(resolveMediaContentType(".m4s")).toBe("video/iso.segment");
    expect(resolveMediaContentType(".m3u8")).toContain("mpegurl");
    expect(resolveMediaContentType(".mpd")).toContain("dash+xml");
  });

  it("flags streaming extensions", () => {
    expect(isStreamingMediaExtension(".ts")).toBe(true);
    expect(isStreamingMediaExtension(".jpg")).toBe(false);
  });
});

describe("playback-networking", () => {
  it("adds playback headers for same-origin media requests", () => {
    const headers = applyPlaybackRequestHeaders("/media/movie/master.m3u8");

    expect(headers["X-Cinema-Playback"]).toBe("1");
    expect(headers["X-Requested-With"]).toBe("XMLHttpRequest");
  });

  it("skips custom headers for cross-origin CDN requests", () => {
    const headers = applyPlaybackRequestHeaders("https://cdn.example.com/segment.ts");

    expect(headers["X-Cinema-Playback"]).toBeUndefined();
    expect(headers["X-Requested-With"]).toBeUndefined();
  });

  it("adds playback headers for proxied same-origin /content2 URLs", () => {
    const headers = applyPlaybackRequestHeaders("/content2/movies/demo/seg_000.ts");

    expect(headers["X-Cinema-Playback"]).toBe("1");
    expect(headers["X-Requested-With"]).toBe("XMLHttpRequest");
    expect(isCdnMediaUrl("http://cinema.af/content2/movies/demo/master.m3u8")).toBe(true);
    expect(isCdnMediaUrl("/content2/movies/demo/master.m3u8")).toBe(true);
  });

  it("skips custom headers for cross-origin cinema.af content2 URLs", () => {
    const headers = applyPlaybackRequestHeaders(
      "http://cinema.af/content2/movies/demo/seg_000.ts",
    );

    expect(headers["X-Cinema-Playback"]).toBeUndefined();
  });

  it("rewrites CDN URLs to same-origin /content2 proxy off the CDN host", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          href: "http://172.27.86.14:3000/watch/demo",
          hostname: "172.27.86.14",
          origin: "http://172.27.86.14:3000",
        },
      },
    });

    expect(
      rewriteCdnUrlForPlayback(
        "http://cinema.af/content2/beta/demo/master.m3u8",
      ),
    ).toBe("/content2/beta/demo/master.m3u8");

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          href: "http://cinema.af/new-cinema/watch/demo",
          hostname: "cinema.af",
          origin: "http://cinema.af",
        },
      },
    });

    expect(
      rewriteCdnUrlForPlayback(
        "http://cinema.af/content2/beta/demo/master.m3u8",
      ),
    ).toBe("http://cinema.af/content2/beta/demo/master.m3u8");
  });

  it("marks fetch init as no-store for playback traffic", () => {
    const init = applyPlaybackFetchInit("/media/segment.ts", {
      method: "GET",
    });

    expect(init.cache).toBe("no-store");
    expect(new Headers(init.headers).get("X-Cinema-Playback")).toBe("1");
  });

  it("detects same-origin media URLs", () => {
    expect(isSameOriginMediaRequest("/media/movies/demo/master.m3u8")).toBe(true);
    expect(isSameOriginMediaRequest("https://cdn.example.com/segment.ts")).toBe(false);
  });
});
