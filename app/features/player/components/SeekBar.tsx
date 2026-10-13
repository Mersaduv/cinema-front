"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { clamp, formatSeconds } from "../utils/format";
import { selectBufferedPercent, usePlayerStore } from "../store/playerStore";
import type { PlayerFsmState } from "../types/player.types";

type SeekBarProps = {
  onSeekCommit: (time: number) => void;
  onSeekPreview?: (time: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

function SeekBarComponent({
  onSeekCommit,
  onSeekPreview,
  onDragStart,
  onDragEnd,
}: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const duration = usePlayerStore((s) => s.duration);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const fsmState = usePlayerStore((s) => s.fsmState);
  const bufferedPercent = usePlayerStore(selectBufferedPercent);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  const displayPosition =
    isDragging && dragPosition !== null ? dragPosition : currentTime;
  const displayPercent =
    duration > 0 ? clamp((displayPosition / duration) * 100, 0, 100) : 0;

  const getTimeFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || !duration) {
        return 0;
      }

      const rect = track.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return ratio * duration;
    },
    [duration],
  );

  const handleDragStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      onDragStart?.();
      const time = getTimeFromClientX(clientX);
      setDragPosition(time);
      onSeekPreview?.(time);
    },
    [getTimeFromClientX, onDragStart, onSeekPreview],
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      const time = getTimeFromClientX(clientX);
      setDragPosition(time);
      onSeekPreview?.(time);
    },
    [getTimeFromClientX, onSeekPreview],
  );

  const handleDragEnd = useCallback(
    (clientX: number) => {
      const time = getTimeFromClientX(clientX);
      setDragPosition(null);
      setIsDragging(false);
      onDragEnd?.();
      onSeekCommit(time);
    },
    [getTimeFromClientX, onDragEnd, onSeekCommit],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleDragStart(event.clientX);

      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        handleDragMove(moveEvent.clientX);
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        if (target.hasPointerCapture(upEvent.pointerId)) {
          target.releasePointerCapture(upEvent.pointerId);
        }
        handleDragEnd(upEvent.clientX);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [handleDragEnd, handleDragMove, handleDragStart],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const preventScroll = (event: TouchEvent) => {
      event.preventDefault();
    };

    window.addEventListener("touchmove", preventScroll, { passive: false });
    return () => window.removeEventListener("touchmove", preventScroll);
  }, [isDragging]);

  const isSeekBuffering =
    !isDragging && (fsmState as PlayerFsmState) === "seeking";

  return (
    <div className="group relative w-full py-1">
      {hoverPosition !== null && !isDragging && duration > 0 ? (
        <div
          className="pointer-events-none absolute bottom-full mb-1 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white"
          style={{
            left: `${(hoverPosition / duration) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {formatSeconds(hoverPosition)}
        </div>
      ) : null}

      <div
        ref={trackRef}
        role="slider"
        aria-label="نوار پیشرفت"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={displayPosition}
        onPointerDown={handlePointerDown}
        onMouseMove={(event) => {
          setHoverPosition(getTimeFromClientX(event.clientX));
        }}
        onMouseLeave={() => setHoverPosition(null)}
        className={`relative touch-none cursor-pointer rounded-full bg-[#3a3a3a] transition-all duration-150 ${
          isDragging ? "h-3.5" : "h-2.5 group-hover:h-3 md:h-1.5 md:group-hover:h-2.5"
        }`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#F5C518]/35"
          style={{ width: `${bufferedPercent}%` }}
        />

        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#F5C518] transition-none"
          style={{ width: `${displayPercent}%` }}
        >
          <div
            className={`absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-[#1a1a1a] bg-[#F5C518] shadow-[0_0_0_1px_rgba(245,197,24,0.45)] transition-all duration-100 ${
              isDragging
                ? "scale-125 opacity-100"
                : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
            }`}
          />
        </div>

        {isDragging && dragPosition !== null && duration > 0 ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#F5C518]/55"
            style={{ width: `${(dragPosition / duration) * 100}%` }}
          />
        ) : null}
      </div>

      {isSeekBuffering ? (
        <div className="mt-1 flex justify-center gap-1">
          <div
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5C518]"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5C518]"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F5C518]"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      ) : null}
    </div>
  );
}

export const SeekBar = memo(SeekBarComponent);
