import { describe, expect, it } from "vitest";
import { MediaResolver } from "../core/MediaResolver";

describe("MediaResolver", () => {
  const resolver = new MediaResolver();

  it("proxies external subtitle URLs", () => {
    const url = resolver.resolveSubtitleUrl("https://cdn.example.com/sub.vtt");
    expect(url).toBe("/api/subtitles?src=" + encodeURIComponent("https://cdn.example.com/sub.vtt"));
  });

  it("passes through local subtitle paths", () => {
    expect(resolver.resolveSubtitleUrl("/media/subtitles/fa.vtt")).toBe(
      "/media/subtitles/fa.vtt",
    );
  });

  it("normalizes media source", () => {
    const source = resolver.resolveSource({
      src: "  https://cdn.example.com/master.m3u8  ",
      subtitleUrl: "https://cdn.example.com/sub.vtt",
    });

    expect(source.src).toBe("https://cdn.example.com/master.m3u8");
    expect(source.subtitleUrl).toContain("/api/subtitles?src=");
  });
});
