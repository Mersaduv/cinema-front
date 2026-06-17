import { cleanup, render } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeroTrailerBackground from "../HeroTrailerBackground";

vi.mock("../../../hooks/useTvCapabilities", () => ({
  useIsTv: () => false,
}));

vi.mock("../images", () => ({
  HeroBackdropImage: () => <div data-testid="hero-backdrop" />,
}));

describe("HeroTrailerBackground desktop", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a YouTube iframe when isTv is false and trailer is YouTube", async () => {
    vi.useFakeTimers();

    const { container } = render(
      <HeroTrailerBackground
        coverUrl="/cover.jpg"
        trailerUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        alt="Test"
      />,
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    const iframe = container.querySelector("iframe");
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute("src") ?? "").toContain("youtube-nocookie.com");

    vi.useRealTimers();
  });
});
