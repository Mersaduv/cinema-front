"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeroBackdropImage } from "../images";
import type { ResponsiveImageAsset } from "../../lib/cinema-image";
import {
  HiMiniPause,
  HiMiniPlay,
  HiMiniSpeakerWave,
  HiMiniSpeakerXMark,
} from "react-icons/hi2";
import { extractYoutubeVideoId } from "../../lib/youtube";

const COVER_MIN_DISPLAY_MS = 5000;
const YT_EMBED_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

function buildEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    cc_load_policy: "0",
    loop: "1",
    playlist: videoId,
    enablejsapi: "1",
    origin: YT_EMBED_ORIGIN,
    showinfo: "0",
    autohide: "1",
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

function postYouTubeCommand(
  iframe: HTMLIFrameElement | null,
  func: "playVideo" | "pauseVideo" | "mute" | "unMute",
) {
  if (!iframe?.contentWindow) {
    return;
  }

  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "command", func, args: [] }),
    "*",
  );
}

export default function HeroTrailerBackground({
  coverUrl,
  coverImage,
  trailerUrl,
  alt,
}: {
  coverUrl: string | null;
  coverImage?: ResponsiveImageAsset | null;
  trailerUrl: string | null;
  alt: string;
}) {
  const videoId = extractYoutubeVideoId(trailerUrl);
  const embedUrl = useMemo(
    () => (videoId ? buildEmbedUrl(videoId) : null),
    [videoId],
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isPlayingRef = useRef(true);

  const [mountPlayer, setMountPlayer] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [minCoverElapsed, setMinCoverElapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [iframeSuspended, setIframeSuspended] = useState(false);

  const showTrailer =
    Boolean(embedUrl && mountPlayer && embedReady && minCoverElapsed && !iframeSuspended);
  const coverVisible = !showTrailer;

  const sendPlay = useCallback(() => {
    postYouTubeCommand(iframeRef.current, "playVideo");
    isPlayingRef.current = true;
    setIsPlaying(true);
  }, []);

  const sendPause = useCallback(() => {
    postYouTubeCommand(iframeRef.current, "pauseVideo");
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const sendMute = useCallback((muted: boolean) => {
    postYouTubeCommand(iframeRef.current, muted ? "mute" : "unMute");
    setIsMuted(muted);
  }, []);

  useEffect(() => {
    if (!videoId) {
      return;
    }

    setMountPlayer(false);
    setEmbedReady(false);
    setMinCoverElapsed(false);
    setIsPlaying(true);
    setIsMuted(true);
    setIframeSuspended(false);

    const mountTimer = window.setTimeout(() => {
      setMountPlayer(true);
    }, 400);

    const coverTimer = window.setTimeout(() => {
      setMinCoverElapsed(true);
    }, COVER_MIN_DISPLAY_MS);

    return () => {
      window.clearTimeout(mountTimer);
      window.clearTimeout(coverTimer);
    };
  }, [videoId]);

  useEffect(() => {
    if (!embedUrl) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        sendPause();
        setIframeSuspended(true);
        return;
      }

      setIframeSuspended(false);

      if (isPlayingRef.current) {
        window.setTimeout(() => sendPlay(), 200);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [embedUrl, sendPause, sendPlay]);

  const togglePlay = () => {
    if (isPlaying) {
      sendPause();
    } else {
      sendPlay();
    }
  };

  const toggleMute = () => {
    sendMute(!isMuted);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05070b]">
      {coverUrl || coverImage ? (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            coverVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <HeroBackdropImage
            title={alt}
            image={coverImage}
            src={coverUrl}
            priority
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#05070b]" />
      )}

      {embedUrl && mountPlayer ? (
        <div
          className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ${
            showTrailer ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        >
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={`${alt} trailer`}
              onLoad={() => {
                setEmbedReady(true);
                sendMute(true);
                sendPlay();
              }}
              className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full min-h-full min-w-full border-0"
              style={{
                width: "max(100vw, 177.78vh)",
                height: "max(100vh, 56.25vw)",
                transform: "translate(-50%, -50%) scale(1.18)",
              }}
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
              tabIndex={-1}
            />
          </div>
        </div>
      ) : null}

      {embedUrl && showTrailer ? (
        <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70"
            aria-label={isPlaying ? "توقف تریلر" : "پخش تریلر"}
          >
            {isPlaying ? <HiMiniPause className="h-5 w-5" /> : <HiMiniPlay className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70"
            aria-label={isMuted ? "فعال‌سازی صدا" : "بی‌صدا کردن"}
          >
            {isMuted ? (
              <HiMiniSpeakerXMark className="h-5 w-5" />
            ) : (
              <HiMiniSpeakerWave className="h-5 w-5" />
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
