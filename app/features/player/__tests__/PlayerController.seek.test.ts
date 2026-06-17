import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerController } from "../core/PlayerController";

function createVideoStub() {
  const listeners = new Map<string, Set<EventListener>>();

  const video = {
    currentTime: 30,
    duration: 120,
    paused: false,
    muted: false,
    volume: 1,
    playbackRate: 1,
    readyState: 4,
    seeking: false,
    controls: false,
    playsInline: false,
    addEventListener: (type: string, listener: EventListener) => {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, listener: EventListener) => {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent: (event: Event) => {
      listeners.get(event.type)?.forEach((listener) => listener(event));
      return true;
    },
    pause: vi.fn(),
    removeAttribute: vi.fn(),
    load: vi.fn(),
  } as unknown as HTMLVideoElement;

  return video;
}

describe("PlayerController seek debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces rapid seekTo calls into a single currentTime write", () => {
    const video = createVideoStub();
    const onSnapshot = vi.fn();

    const controller = new PlayerController(
      {
        autoplay: false,
        muted: false,
        prefetchThresholdSeconds: 30,
        watchdogTimeoutMs: 5000,
        recoveryMaxAttempts: 3,
      },
      {
        onSnapshot,
        onPlaybackTick: vi.fn(),
        onFsmTransition: vi.fn(),
        onSubtitleLines: vi.fn(),
        onRecoveryMessage: vi.fn(),
      },
    );

    Object.assign(controller as object, { video });

    controller.seekTo(40);
    controller.seekTo(50);
    controller.seekTo(60);
    controller.seekTo(70);
    controller.seekTo(80);

    expect(video.currentTime).toBe(30);

    vi.advanceTimersByTime(80);

    expect(video.currentTime).toBe(80);
  });

  it("routes seek() through debounced seekTo", () => {
    const video = createVideoStub();
    const controller = new PlayerController(
      {
        autoplay: false,
        muted: false,
        prefetchThresholdSeconds: 30,
        watchdogTimeoutMs: 5000,
        recoveryMaxAttempts: 3,
      },
      {
        onSnapshot: vi.fn(),
        onPlaybackTick: vi.fn(),
        onFsmTransition: vi.fn(),
        onSubtitleLines: vi.fn(),
        onRecoveryMessage: vi.fn(),
      },
    );

    Object.assign(controller as object, { video });

    controller.seek(10);
    vi.advanceTimersByTime(80);

    expect(video.currentTime).toBe(40);
  });
});
