import { describe, expect, it } from "vitest";
import { isActivateKey } from "../focus";

function keyEvent(partial: Partial<KeyboardEvent>): KeyboardEvent {
  return partial as KeyboardEvent;
}

describe("isActivateKey", () => {
  it("returns true for Enter and Space activation keys", () => {
    expect(isActivateKey(keyEvent({ key: "Enter" }))).toBe(true);
    expect(isActivateKey(keyEvent({ keyCode: 13 }))).toBe(true);
    expect(isActivateKey(keyEvent({ key: " " }))).toBe(true);
    expect(isActivateKey(keyEvent({ keyCode: 32 }))).toBe(true);
  });

  it("returns false for Escape and arrow keys", () => {
    expect(isActivateKey(keyEvent({ key: "Escape", keyCode: 27 }))).toBe(false);
    expect(isActivateKey(keyEvent({ key: "ArrowLeft", keyCode: 37 }))).toBe(false);
  });
});
