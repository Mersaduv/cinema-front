import { describe, expect, it } from "vitest";
import { shouldShowTvPlayGate } from "../utils/tv-autoplay-result";

describe("shouldShowTvPlayGate", () => {
  it("does not show gate when autoplay succeeds on TV", () => {
    expect(shouldShowTvPlayGate(true, true)).toBe(false);
  });

  it("shows gate when autoplay fails on TV", () => {
    expect(shouldShowTvPlayGate(false, true)).toBe(true);
  });

  it("shows gate on desktop when autoplay fails after soft navigation", () => {
    expect(shouldShowTvPlayGate(false, false)).toBe(true);
  });
});
