import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AudioSyncManager } from "../core/AudioSyncManager";

describe("AudioSyncManager", () => {
  let video: HTMLVideoElement;

  beforeEach(() => {
    video = document.createElement("video");
    Object.defineProperty(video, "currentTime", {
      writable: true,
      value: 10,
    });
    Object.defineProperty(video, "paused", {
      writable: true,
      value: false,
    });
    Object.defineProperty(video, "playbackRate", {
      writable: true,
      value: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hard resyncs audio to video currentTime", () => {
    const manager = new AudioSyncManager();
    const playMock = vi.fn().mockResolvedValue(undefined);

    manager.attach(video, "https://example.com/dub.mp3");

    const internalAudio = (manager as unknown as { audio: HTMLAudioElement }).audio;
    expect(internalAudio).toBeTruthy();
    internalAudio.play = playMock;
    internalAudio.pause = vi.fn();
    internalAudio.currentTime = 0;

    manager.hardResync();
    expect(internalAudio.currentTime).toBe(10);

    manager.detach();
  });
});
