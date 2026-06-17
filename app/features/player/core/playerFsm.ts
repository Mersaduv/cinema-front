import type { PlayerFsmState } from "../types/player.types";

type FsmEvent =
  | "load"
  | "manifestReady"
  | "canPlay"
  | "play"
  | "pause"
  | "bufferStart"
  | "bufferEnd"
  | "seekStart"
  | "seekEnd"
  | "ended"
  | "error"
  | "recover"
  | "recoverSuccess"
  | "recoverFail"
  | "destroy";

const TRANSITIONS: Record<PlayerFsmState, Partial<Record<FsmEvent, PlayerFsmState>>> = {
  idle: { load: "loading", destroy: "idle" },
  loading: {
    manifestReady: "buffering",
    canPlay: "paused",
    play: "playing",
    error: "error",
    recover: "recovering",
    destroy: "idle",
  },
  buffering: {
    canPlay: "paused",
    play: "playing",
    bufferEnd: "playing",
    error: "error",
    recover: "recovering",
    ended: "ended",
    destroy: "idle",
  },
  playing: {
    pause: "paused",
    bufferStart: "buffering",
    seekStart: "seeking",
    ended: "ended",
    error: "error",
    recover: "recovering",
    destroy: "idle",
  },
  paused: {
    play: "playing",
    seekStart: "seeking",
    ended: "ended",
    error: "error",
    recover: "recovering",
    destroy: "idle",
  },
  seeking: {
    seekEnd: "playing",
    pause: "paused",
    error: "error",
    destroy: "idle",
  },
  recovering: {
    recoverSuccess: "loading",
    recoverFail: "error",
    destroy: "idle",
  },
  error: {
    recover: "recovering",
    load: "loading",
    destroy: "idle",
  },
  ended: {
    load: "loading",
    play: "playing",
    destroy: "idle",
  },
};

/**
 * Hand-rolled finite state machine for player lifecycle.
 */
export class PlayerFsm {
  private state: PlayerFsmState = "idle";

  getState(): PlayerFsmState {
    return this.state;
  }

  /** Attempt a state transition; returns new state or null if invalid. */
  transition(event: FsmEvent): PlayerFsmState | null {
    const next = TRANSITIONS[this.state]?.[event];
    if (!next) {
      return null;
    }

    this.state = next;
    return next;
  }

  /** Force reset to idle (used on destroy). */
  reset(): void {
    this.state = "idle";
  }
}

/** Check whether the player is in an active playback state. */
export function isActivePlaybackState(state: PlayerFsmState): boolean {
  return state === "playing" || state === "buffering" || state === "seeking";
}
