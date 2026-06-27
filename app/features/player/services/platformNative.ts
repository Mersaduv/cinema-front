/** Samsung Tizen AVPlay API surface (web app runtime). */
export type TizenAvPlayApi = {
  open: (url: string) => void;
  close: () => void;
  prepareAsync: (onSuccess: () => void, onError: (error: unknown) => void) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (milliseconds: number) => void;
  setDisplayRect: (x: number, y: number, width: number, height: number) => void;
  setListener: (listener: Record<string, (...args: unknown[]) => void>) => void;
};

export type CinemaNativePlayerBridge = {
  load: (url: string, format: "hls" | "dash") => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
};

export function getTizenAvPlay(): TizenAvPlayApi | null {
  if (typeof window === "undefined") {
    return null;
  }

  const webapis = (window as Window & { webapis?: { avplay?: TizenAvPlayApi } }).webapis;
  return webapis?.avplay ?? null;
}

export function detectTizenAvPlay(): boolean {
  return getTizenAvPlay() !== null;
}

export function detectWebOsPipeline(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const webOS = (window as Window & {
    webOS?: { platform?: { tv?: boolean }; service?: unknown };
  }).webOS;

  if (!webOS) {
    return false;
  }

  // Browser shells may expose a stub; require platform.tv for the native pipeline path.
  return webOS.platform?.tv === true || typeof webOS.service === "object";
}

export function getExoPlayerBridge(): CinemaNativePlayerBridge | null {
  if (typeof window === "undefined") {
    return null;
  }

  const bridge = (window as Window & { CinemaNativePlayer?: CinemaNativePlayerBridge })
    .CinemaNativePlayer;

  if (!bridge || typeof bridge.load !== "function") {
    return null;
  }

  return bridge;
}

export function detectExoPlayerBridge(): boolean {
  return getExoPlayerBridge() !== null;
}
