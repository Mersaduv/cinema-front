import { SubtitleEngine } from "./SubtitleEngine";
import { AudioSyncManager } from "./AudioSyncManager";
import { applyPlaybackFetchInit } from "../../../lib/playback-networking";

/**
 * Single clock coordinator — all timing derives from the video element.
 */
export class SyncCoordinator {
  readonly subtitles = new SubtitleEngine();
  readonly audio = new AudioSyncManager();

  private video: HTMLVideoElement | null = null;
  private rafId: number | null = null;
  private onSubtitleLines: ((lines: string[]) => void) | null = null;
  private subtitleDelay = 0;
  private managedSubtitleUrl: string | null = null;

  /** Bind video element as the single clock source. */
  bindVideo(video: HTMLVideoElement): void {
    this.video = video;
  }

  /** Configure external dubbed audio URL. */
  setDubbedAudioUrl(url: string | null): void {
    if (!url || !this.video) {
      this.clearDubbedAudio();
      return;
    }

    this.audio.attach(this.video, url);
  }

  /** Remove external dubbed audio element. */
  clearDubbedAudio(): void {
    this.audio.detach();
  }

  /** Set managed subtitle URL for cue parsing. */
  setManagedSubtitleUrl(url: string | null): void {
    this.managedSubtitleUrl = url;
    if (!url) {
      this.subtitles.clear();
    }
  }

  /** Load and parse external subtitle file. */
  async loadExternalSubtitles(url: string, signal?: AbortSignal): Promise<void> {
    const response = await fetch(url, applyPlaybackFetchInit(url, { signal }));
    if (!response.ok) {
      return;
    }

    const body = await response.text();
    this.subtitles.parse(body, url);
  }

  /** Subtitle delay offset in seconds (±10). */
  setSubtitleDelay(seconds: number): void {
    this.subtitleDelay = seconds;
  }

  /** Start RAF loop for subtitle cue updates. */
  startSubtitleLoop(onLines: (lines: string[]) => void): void {
    this.onSubtitleLines = onLines;
    this.stopSubtitleLoop();

    let lastLines: string[] = [];

    const tick = () => {
      if (
        this.video &&
        this.onSubtitleLines &&
        this.managedSubtitleUrl &&
        !this.video.paused
      ) {
        const lines = this.subtitles.getActiveLines(
          this.video.currentTime,
          this.subtitleDelay,
        );

        if (!linesEqual(lines, lastLines)) {
          lastLines = lines;
          this.onSubtitleLines(lines);
        }
      }

      this.rafId = window.requestAnimationFrame(tick);
    };

    this.rafId = window.requestAnimationFrame(tick);
  }

  stopSubtitleLoop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Current time from video clock. */
  getCurrentTime(): number {
    return this.video?.currentTime ?? 0;
  }

  /** Cleanup all sync resources. */
  destroy(): void {
    this.stopSubtitleLoop();
    this.audio.detach();
    this.subtitles.clear();
    this.video = null;
    this.onSubtitleLines = null;
    this.managedSubtitleUrl = null;
  }
}

function linesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((line, index) => line === b[index]);
}
