"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function HlsVideoPlayer({
  src,
  poster,
}: {
  src: string;
  poster?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playerError, setPlayerError] = useState("");

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !src) {
      return;
    }

    const clearErrorTimer = window.setTimeout(() => {
      setPlayerError("");
    }, 0);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;

      return () => {
        window.clearTimeout(clearErrorTimer);
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setPlayerError("پخش HLS با خطا روبه‌رو شد. لاگ پردازش را در پنل بررسی کن.");
          hls.destroy();
        }
      });

      return () => {
        window.clearTimeout(clearErrorTimer);
        hls.destroy();
      };
    }

    const unsupportedTimer = window.setTimeout(() => {
      setPlayerError("مرورگر شما از HLS پشتیبانی نمی‌کند.");
    }, 0);

    return () => {
      window.clearTimeout(clearErrorTimer);
      window.clearTimeout(unsupportedTimer);
    };
  }, [src]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <video
          ref={videoRef}
          controls
          playsInline
          poster={poster || undefined}
          className="aspect-video w-full bg-black"
        />
      </div>
      {playerError && (
        <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
          {playerError}
        </div>
      )}
    </div>
  );
}
