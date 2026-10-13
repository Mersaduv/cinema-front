type WebkitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

type PrefixedElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type PrefixedDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
};

function getFullscreenElement(): Element | null {
  const doc = document as PrefixedDocument;
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

export function isPlayerFullscreenActive(video?: HTMLVideoElement | null): boolean {
  if (getFullscreenElement()) {
    return true;
  }

  const webkitVideo = video as WebkitVideo | null | undefined;
  return Boolean(webkitVideo?.webkitDisplayingFullscreen);
}

async function requestElementFullscreen(element: HTMLElement): Promise<boolean> {
  const el = element as PrefixedElement;

  try {
    if (typeof el.requestFullscreen === "function") {
      await el.requestFullscreen({ navigationUI: "hide" });
      return true;
    }
  } catch {
    // try next vendor path
  }

  try {
    if (typeof el.webkitRequestFullscreen === "function") {
      await Promise.resolve(el.webkitRequestFullscreen());
      return true;
    }
    if (typeof el.webkitRequestFullScreen === "function") {
      await Promise.resolve(el.webkitRequestFullScreen());
      return true;
    }
    if (typeof el.msRequestFullscreen === "function") {
      await Promise.resolve(el.msRequestFullscreen());
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

async function exitElementFullscreen(): Promise<boolean> {
  const doc = document as PrefixedDocument;

  try {
    if (typeof document.exitFullscreen === "function" && document.fullscreenElement) {
      await document.exitFullscreen();
      return true;
    }
  } catch {
    // try next
  }

  try {
    if (typeof doc.webkitExitFullscreen === "function" && doc.webkitFullscreenElement) {
      await Promise.resolve(doc.webkitExitFullscreen());
      return true;
    }
    if (typeof doc.webkitCancelFullScreen === "function" && doc.webkitFullscreenElement) {
      await Promise.resolve(doc.webkitCancelFullScreen());
      return true;
    }
    if (typeof doc.msExitFullscreen === "function" && doc.msFullscreenElement) {
      await Promise.resolve(doc.msExitFullscreen());
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function lockLandscapeOrientation(): Promise<void> {
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    if (typeof orientation?.lock === "function") {
      await orientation.lock("landscape");
    }
  } catch {
    // Orientation lock is optional (unsupported or denied).
  }
}

export function unlockOrientation(): void {
  try {
    screen.orientation?.unlock?.();
  } catch {
    // ignore
  }
}

/**
 * Enter/exit fullscreen with mobile-friendly fallbacks (prefixed APIs + iOS video FS)
 * and attempt landscape lock after enter.
 */
export async function togglePlayerFullscreen(options: {
  container: HTMLElement | null;
  video: HTMLVideoElement | null;
}): Promise<"entered" | "exited" | "failed"> {
  const { container, video } = options;
  const webkitVideo = video as WebkitVideo | null;

  if (isPlayerFullscreenActive(video)) {
    if (webkitVideo?.webkitDisplayingFullscreen && typeof webkitVideo.webkitExitFullscreen === "function") {
      try {
        webkitVideo.webkitExitFullscreen();
        unlockOrientation();
        return "exited";
      } catch {
        // continue
      }
    }

    const exited = await exitElementFullscreen();
    unlockOrientation();
    return exited ? "exited" : "failed";
  }

  if (container && (await requestElementFullscreen(container))) {
    await lockLandscapeOrientation();
    return "entered";
  }

  if (video && (await requestElementFullscreen(video))) {
    await lockLandscapeOrientation();
    return "entered";
  }

  if (webkitVideo && typeof webkitVideo.webkitEnterFullscreen === "function") {
    try {
      webkitVideo.webkitEnterFullscreen();
      await lockLandscapeOrientation();
      return "entered";
    } catch {
      // fall through
    }
  }

  // Last resort on immersive mobile pages: try landscape lock from the user gesture.
  await lockLandscapeOrientation();
  return "failed";
}

export function bindFullscreenChangeListeners(
  video: HTMLVideoElement | null,
  onChange: () => void,
): () => void {
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange as EventListener);

  const webkitVideo = video as WebkitVideo | null;
  const onBegin = () => onChange();
  const onEnd = () => onChange();

  if (webkitVideo) {
    webkitVideo.addEventListener("webkitbeginfullscreen", onBegin);
    webkitVideo.addEventListener("webkitendfullscreen", onEnd);
  }

  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    document.removeEventListener("webkitfullscreenchange", onChange as EventListener);
    if (webkitVideo) {
      webkitVideo.removeEventListener("webkitbeginfullscreen", onBegin);
      webkitVideo.removeEventListener("webkitendfullscreen", onEnd);
    }
  };
}
