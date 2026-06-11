import { describe, expect, it } from "vitest";
import {
  buildHeroBackdropSrc,
  buildHeroBackdropSrcSetString,
  buildSrcSetString,
  getImageAlt,
  getImageSizes,
  HERO_BACKDROP_QUALITY,
  HERO_BACKDROP_SHARPEN,
  isTmdbImageUrl,
  normalizeImageAsset,
  normalizeImageUrl,
  pickImageSrc,
  pickProfileImageSrc,
  preferRenderableUrl,
  resolveHeroBackdropImage,
  resolveRenderableImage,
  stripImageQueryParams,
} from "../app/lib/cinema-image";

const sampleImage = {
  original: "/images/2026/file.jpg",
  blur: "/images/2026/file.jpg?width=20&quality=10&sharpen=0",
  src: "/images/2026/file.jpg?width=384&quality=65&sharpen=60",
  srcset: [
    {
      url: "/images/2026/file.jpg?width=256&quality=65&sharpen=60",
      width: 256,
      descriptor: "256w",
    },
    {
      url: "/images/2026/file.jpg?width=384&quality=65&sharpen=60",
      width: 384,
      descriptor: "384w",
    },
  ],
  srcset_string:
    "/images/2026/file.jpg?width=256&quality=65&sharpen=60 256w, /images/2026/file.jpg?width=384&quality=65&sharpen=60 384w",
};

describe("cinema-image utilities", () => {
  it("normalizes relative and absolute URLs safely", () => {
    expect(normalizeImageUrl("/images/2026/file.jpg")).toBe("/images/2026/file.jpg");
    expect(normalizeImageUrl("https://cdn.example.com/images/a.jpg")).toBe(
      "https://cdn.example.com/images/a.jpg",
    );
    expect(normalizeImageUrl(null)).toBeNull();
    expect(normalizeImageUrl("")).toBeNull();
  });

  it("builds srcset string from srcset_string when available", () => {
    expect(buildSrcSetString(sampleImage)).toBe(sampleImage.srcset_string);
  });

  it("prefers processed internal URLs over TMDB URLs", () => {
    expect(
      pickImageSrc(sampleImage, "https://image.tmdb.org/t/p/w500/poster.jpg"),
    ).toBe("/images/2026/file.jpg?width=384&quality=65&sharpen=60");

    expect(
      preferRenderableUrl(
        "https://image.tmdb.org/t/p/w500/poster.jpg",
        "/images/2026/local.jpg",
      ),
    ).toBe("/images/2026/local.jpg");
  });

  it("falls back to legacy poster_url when image object is missing", () => {
    expect(pickImageSrc(null, "/images/legacy.jpg")).toBe("/images/legacy.jpg");
  });

  it("does not return raw TMDB URLs when no managed image exists", () => {
    expect(
      pickImageSrc(null, "https://image.tmdb.org/t/p/w500/profile.jpg"),
    ).toBeNull();

    expect(
      preferRenderableUrl("https://image.tmdb.org/t/p/w500/poster.jpg"),
    ).toBeNull();
  });

  it("pickProfileImageSrc only accepts managed profile URLs", () => {
    expect(
      pickProfileImageSrc(sampleImage, "https://image.tmdb.org/t/p/w500/a.jpg"),
    ).toBe("/images/2026/file.jpg?width=384&quality=65&sharpen=60");

    expect(
      pickProfileImageSrc(null, "https://image.tmdb.org/t/p/w500/a.jpg"),
    ).toBeNull();

    expect(pickProfileImageSrc(null, "/images/2026/person.jpg")).toBe(
      "/images/2026/person.jpg",
    );
  });

  it("returns poster grid sizes", () => {
    expect(getImageSizes("poster-grid")).toContain("33.33vw");
    expect(getImageSizes("hero-backdrop")).toBe("100vw");
  });

  it("builds meaningful alt text", () => {
    expect(getImageAlt({ title: "Inception", role: "poster" })).toBe("Inception poster");
    expect(
      getImageAlt({
        title: "Breaking Bad",
        seasonNumber: 1,
        episodeNumber: 3,
        role: "still",
      }),
    ).toBe("Breaking Bad S1E3 still");
  });

  it("normalizes REST and GraphQL image payloads", () => {
    expect(normalizeImageAsset(sampleImage)?.src).toBe(sampleImage.src);
    expect(normalizeImageAsset(null)).toBeNull();
    expect(normalizeImageAsset({})).toBeNull();
  });

  it("resolves renderable image bundle", () => {
    const resolved = resolveRenderableImage({
      image: sampleImage,
      url: "https://image.tmdb.org/t/p/w500/old.jpg",
    });

    expect(resolved.src).toBe(sampleImage.src);
    expect(resolved.blur).toBe(sampleImage.blur);
    expect(resolved.srcSet).toBe(sampleImage.srcset_string);
  });

  it("detects TMDB URLs", () => {
    expect(isTmdbImageUrl("https://image.tmdb.org/t/p/original/x.jpg")).toBe(true);
    expect(isTmdbImageUrl("/images/local.jpg")).toBe(false);
  });

  it("builds hero backdrop srcset with quality 85 and sharpen 60", () => {
    const base = "/images/2026/file.jpg";
    const srcset = buildHeroBackdropSrcSetString(base);

    expect(srcset).toContain(`${base}?width=640&quality=${HERO_BACKDROP_QUALITY}&sharpen=${HERO_BACKDROP_SHARPEN} 640w`);
    expect(srcset).toContain(`${base}?width=3840&quality=${HERO_BACKDROP_QUALITY}&sharpen=${HERO_BACKDROP_SHARPEN} 3840w`);
    expect(buildHeroBackdropSrc(base)).toBe(
      `${base}?width=3840&quality=${HERO_BACKDROP_QUALITY}&sharpen=${HERO_BACKDROP_SHARPEN}`,
    );
  });

  it("strips query params from image URLs before building hero variants", () => {
    expect(stripImageQueryParams("/images/2026/file.jpg?width=384&quality=65&sharpen=60")).toBe(
      "/images/2026/file.jpg",
    );
  });

  it("resolves hero backdrop bundle from processed image object", () => {
    const resolved = resolveHeroBackdropImage({
      image: {
        original: "/images/2026/file.jpg",
        blur: "/images/2026/file.jpg?width=20&quality=10&sharpen=0",
        src: "/images/2026/file.jpg?width=1920&quality=65&sharpen=60",
      },
      src: "https://image.tmdb.org/t/p/original/old.jpg",
    });

    expect(resolved.baseUrl).toBe("/images/2026/file.jpg");
    expect(resolved.src).toContain("width=3840");
    expect(resolved.src).toContain("quality=85");
    expect(resolved.srcSet).toContain("640w");
    expect(resolved.srcSet).toContain("3840w");
    expect(resolved.blur).toContain("width=20");
  });
});
