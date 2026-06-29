import { describe, expect, it } from "vitest";
import { isPlayerChromeTarget } from "../utils/gesture-target";

describe("isPlayerChromeTarget", () => {
  it("returns true for elements inside player controls", () => {
    const root = document.createElement("div");
    root.setAttribute("data-player-controls", "true");
    const button = document.createElement("button");
    root.appendChild(button);
    document.body.appendChild(root);

    expect(isPlayerChromeTarget(button)).toBe(true);

    root.remove();
  });

  it("returns true for menu scroll regions", () => {
    const scroll = document.createElement("div");
    scroll.setAttribute("data-player-menu-scroll", "true");
    const child = document.createElement("span");
    scroll.appendChild(child);
    document.body.appendChild(scroll);

    expect(isPlayerChromeTarget(child)).toBe(true);

    scroll.remove();
  });

  it("returns false for plain video-area targets", () => {
    const video = document.createElement("div");
    document.body.appendChild(video);

    expect(isPlayerChromeTarget(video)).toBe(false);

    video.remove();
  });
});
