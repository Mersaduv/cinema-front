/**
 * Synchronizes a secondary dubbed-audio element to the video clock.
 */
export class AudioSyncManager {
  private audio: HTMLAudioElement | null = null;
  private video: HTMLVideoElement | null = null;
  private syncIntervalId: number | null = null;
  private url: string | null = null;
  private suspended = false;
  private volume = 1;
  private muted = false;

  /** Whether a dubbed audio element is attached. */
  isAttached(): boolean {
    return this.audio !== null;
  }

  getVolume(): number {
    return this.audio?.volume ?? this.volume;
  }

  getMuted(): boolean {
    return this.audio?.muted ?? this.muted;
  }

  /** Attach dubbed audio stream and start sync loop. */
  attach(video: HTMLVideoElement, dubbedUrl: string): void {
    this.detach();
    this.video = video;
    this.url = dubbedUrl;
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.audio.preload = "metadata";
    this.audio.src = dubbedUrl;
    this.audio.volume = this.volume;
    this.audio.muted = this.muted;
    this.suspended = false;

    this.syncIntervalId = window.setInterval(() => {
      this.syncTick();
    }, 100);
  }

  /** Detach and destroy secondary audio. */
  detach(): void {
    if (this.syncIntervalId !== null) {
      window.clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }

    this.video = null;
    this.url = null;
    this.suspended = false;
  }

  /** Pause drift correction while idle/paused/error. */
  suspend(): void {
    this.suspended = true;
  }

  /** Resume drift correction when playback is active. */
  resume(): void {
    this.suspended = false;
  }

  /** Mirror play state from video. Returns false when dubbed play() fails. */
  async syncPlayState(): Promise<boolean> {
    if (!this.audio || !this.video) {
      return true;
    }

    if (this.video.paused) {
      this.audio.pause();
      return true;
    }

    try {
      await this.audio.play();
      return true;
    } catch {
      return false;
    }
  }

  /** Mirror playback rate. */
  setPlaybackRate(rate: number): void {
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  }

  /** Mirror volume and mute. */
  setVolume(volume: number, muted: boolean): void {
    this.volume = volume;
    this.muted = muted;

    if (!this.audio) {
      return;
    }

    this.audio.volume = volume;
    this.audio.muted = muted;
  }

  /** Hard resync after seek. */
  hardResync(): void {
    if (!this.audio || !this.video) {
      return;
    }

    this.audio.currentTime = this.video.currentTime;
    void this.syncPlayState();
  }

  private syncTick(): void {
    if (!this.audio || !this.video || this.suspended) {
      return;
    }

    if (this.video.paused && this.audio.paused) {
      return;
    }

    const drift = Math.abs(this.audio.currentTime - this.video.currentTime);

    if (drift < 0.05) {
      if (this.video.paused !== this.audio.paused) {
        void this.syncPlayState();
      }
      return;
    }

    this.audio.currentTime = this.video.currentTime;

    if (this.video.paused !== this.audio.paused) {
      void this.syncPlayState();
    }
  }
}
