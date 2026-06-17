import { describe, expect, it } from "vitest";
import { PlayerFsm } from "../core/playerFsm";

describe("PlayerFsm", () => {
  it("transitions idle → loading on load", () => {
    const fsm = new PlayerFsm();
    expect(fsm.getState()).toBe("idle");
    expect(fsm.transition("load")).toBe("loading");
  });

  it("transitions loading → playing on play", () => {
    const fsm = new PlayerFsm();
    fsm.transition("load");
    fsm.transition("canPlay");
    expect(fsm.transition("play")).toBe("playing");
  });

  it("transitions playing → buffering on bufferStart", () => {
    const fsm = new PlayerFsm();
    fsm.transition("load");
    fsm.transition("canPlay");
    fsm.transition("play");
    expect(fsm.transition("bufferStart")).toBe("buffering");
  });

  it("transitions to error and back via recover", () => {
    const fsm = new PlayerFsm();
    fsm.transition("load");
    expect(fsm.transition("error")).toBe("error");
    expect(fsm.transition("recover")).toBe("recovering");
    expect(fsm.transition("recoverSuccess")).toBe("loading");
  });

  it("rejects invalid transitions", () => {
    const fsm = new PlayerFsm();
    expect(fsm.transition("play")).toBeNull();
  });
});
