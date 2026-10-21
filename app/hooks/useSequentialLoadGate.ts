"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Fallback so one broken image cannot stall the whole queue. */
const DEFAULT_STALL_MS = 4_000;

/**
 * Unlocks indices 0..N one-by-one after each prior slot reports loaded
 * (or after a stall timeout). Active/navigated indices can force-unlock.
 */
export function useSequentialLoadGate(
  total: number,
  options?: { enabled?: boolean; stallMs?: number },
) {
  const enabled = options?.enabled ?? true;
  const stallMs = options?.stallMs ?? DEFAULT_STALL_MS;
  const [readyThrough, setReadyThrough] = useState(0);
  const timersRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    setReadyThrough(0);
    for (const timer of timersRef.current.values()) {
      window.clearTimeout(timer);
    }
    timersRef.current.clear();
  }, [total, enabled]);

  const clearStall = useCallback((index: number) => {
    const timer = timersRef.current.get(index);
    if (timer != null) {
      window.clearTimeout(timer);
      timersRef.current.delete(index);
    }
  }, []);

  const unlockThrough = useCallback((index: number) => {
    setReadyThrough((current) => Math.max(current, index));
  }, []);

  const markLoaded = useCallback(
    (index: number) => {
      if (!enabled) {
        return;
      }
      clearStall(index);
      setReadyThrough((current) => Math.max(current, index + 1));
    },
    [clearStall, enabled],
  );

  const canLoad = useCallback(
    (index: number) => {
      if (!enabled) {
        return true;
      }
      return index <= readyThrough;
    },
    [enabled, readyThrough],
  );

  useEffect(() => {
    if (!enabled || total <= 0) {
      return;
    }

    const loadingIndex = Math.min(readyThrough, total - 1);
    if (loadingIndex < 0 || loadingIndex >= total) {
      return;
    }

    clearStall(loadingIndex);
    const timer = window.setTimeout(() => {
      markLoaded(loadingIndex);
    }, stallMs);
    timersRef.current.set(loadingIndex, timer);

    return () => {
      clearStall(loadingIndex);
    };
  }, [clearStall, enabled, markLoaded, readyThrough, stallMs, total]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        window.clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  return { readyThrough, canLoad, markLoaded, unlockThrough };
}
