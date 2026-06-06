"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FilterDropdown from "./FilterDropdown";

function toPersianYear(year: number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(year)
    .split("")
    .map((digit) => persianDigits[Number(digit)] ?? digit)
    .join("");
}

type ActiveThumb = "low" | "high" | null;

export default function YearRangeFilter({
  min = 1900,
  max = new Date().getFullYear(),
  from,
  to,
  onChange,
}: {
  min?: number;
  max?: number;
  from: number | null;
  to: number | null;
  onChange: (from: number | null, to: number | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [low, setLow] = useState(from ?? min);
  const [high, setHigh] = useState(to ?? max);
  const [dragging, setDragging] = useState<ActiveThumb>(null);
  const lowRef = useRef(low);
  const highRef = useRef(high);
  lowRef.current = low;
  highRef.current = high;

  useEffect(() => {
    if (dragging) {
      return;
    }
    setLow(from ?? min);
    setHigh(to ?? max);
  }, [from, to, min, max, dragging]);

  const clampYear = useCallback(
    (value: number) => Math.min(max, Math.max(min, value)),
    [min, max],
  );

  const yearFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) {
        return min;
      }
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return clampYear(Math.round(min + ratio * (max - min)));
    },
    [clampYear, min, max],
  );

  const applyLocalRange = useCallback((nextLow: number, nextHigh: number) => {
    const normalizedLow = Math.min(nextLow, nextHigh);
    const normalizedHigh = Math.max(nextLow, nextHigh);
    setLow(normalizedLow);
    setHigh(normalizedHigh);
  }, []);

  const publishRange = useCallback(
    (nextLow: number, nextHigh: number) => {
      const normalizedLow = Math.min(nextLow, nextHigh);
      const normalizedHigh = Math.max(nextLow, nextHigh);
      setLow(normalizedLow);
      setHigh(normalizedHigh);
      onChange(
        normalizedLow <= min ? null : normalizedLow,
        normalizedHigh >= max ? null : normalizedHigh,
      );
    },
    [min, max, onChange],
  );

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const year = yearFromPointer(event.clientX);
      if (dragging === "low") {
        applyLocalRange(Math.min(year, highRef.current), highRef.current);
        return;
      }
      applyLocalRange(lowRef.current, Math.max(year, lowRef.current));
    };

    const onUp = () => {
      setDragging(null);
      publishRange(lowRef.current, highRef.current);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyLocalRange, dragging, publishRange, yearFromPointer]);

  const lowPercent = ((low - min) / (max - min)) * 100;
  const highPercent = ((high - min) / (max - min)) * 100;

  const pickThumb = (year: number): ActiveThumb => {
    const distanceToLow = Math.abs(year - low);
    const distanceToHigh = Math.abs(year - high);
    return distanceToLow <= distanceToHigh ? "low" : "high";
  };

  const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const year = yearFromPointer(event.clientX);
    const thumb = pickThumb(year);
    setDragging(thumb);
    if (thumb === "low") {
      applyLocalRange(Math.min(year, high), high);
    } else {
      applyLocalRange(low, Math.max(year, low));
    }
  };

  const startThumbDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    thumb: ActiveThumb,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    setDragging(thumb);
  };

  return (
    <FilterDropdown
      label="سال ساخت"
      valueLabel="سال ساخت"
      minWidth="320px"
      panelClassName="p-5"
    >
      <div className="select-none touch-none">
        <div
          ref={trackRef}
          className="relative mx-1 mt-12 mb-12 h-4 cursor-pointer rounded-full bg-white/10"
          onPointerDown={onTrackPointerDown}
        >
          <div
            className="pointer-events-none absolute top-0 h-4 rounded-full bg-[#2563eb]"
            style={{
              left: `${lowPercent}%`,
              width: `${Math.max(highPercent - lowPercent, 0)}%`,
            }}
          />

          <div
            className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${lowPercent}%` }}
            onPointerDown={(event) => startThumbDrag(event, "low")}
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-white">
              {toPersianYear(low)}
            </span>
            <span className="pointer-events-none absolute top-full left-1/2 mt-2.5 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-white">
              {toPersianYear(low)}
            </span>
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-white shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
            </span>
          </div>

          <div
            className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${highPercent}%` }}
            onPointerDown={(event) => startThumbDrag(event, "high")}
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-white">
              {toPersianYear(high)}
            </span>
            <span className="pointer-events-none absolute top-full left-1/2 mt-2.5 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-white">
              {toPersianYear(high)}
            </span>
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-white shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
            </span>
          </div>
        </div>
      </div>
    </FilterDropdown>
  );
}
