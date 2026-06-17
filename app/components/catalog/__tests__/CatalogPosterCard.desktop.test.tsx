import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CatalogPosterCard from "../CatalogPosterCard";

vi.mock("../../../hooks/useTvCapabilities", () => ({
  useIsTv: () => false,
}));

vi.mock("../images", () => ({
  PosterImage: ({ loading }: { loading?: string }) => (
    <img data-testid="poster" data-loading={loading ?? "default"} alt="" />
  ),
}));

const item = {
  id: 1,
  slug: "test-movie",
  title: "Test Movie",
  release_year: 2024,
  details: { genres: ["درام"], rating: 8 },
} as const;

describe("CatalogPosterCard desktop", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not force eager loading when isTv is false", () => {
    const { container } = render(
      <CatalogPosterCard item={item as never} href="/movies/test-movie" index={0} />,
    );

    const poster = container.querySelector('[data-testid="poster"]');
    expect(poster?.getAttribute("data-loading")).not.toBe("eager");
    expect(container.querySelector("[data-tv-carousel-item]")).toBeNull();
  });
});
