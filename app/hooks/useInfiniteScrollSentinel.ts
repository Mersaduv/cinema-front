"use client";

import { useEffect, useRef } from "react";

/**
 * Vertical infinite-scroll sentinel. Re-fires while `enabled` stays true
 * (unlike one-shot visibility triggers used for lazy rail mounts).
 */
export function useInfiniteScrollSentinel(
  onIntersect: () => void,
  enabled: boolean,
  options: IntersectionObserverInit = {
    root: null,
    rootMargin: "800px 0px",
    threshold: 0,
  },
) {
  const ref = useRef<HTMLDivElement>(null);
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;

  useEffect(() => {
    const element = ref.current;

    if (!element || !enabled) {
      return undefined;
    }

    let locked = false;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || locked) {
        return;
      }

      locked = true;
      onIntersectRef.current();

      // Allow another fire after the current load cycle settles.
      window.setTimeout(() => {
        locked = false;
      }, 400);
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [enabled, options.root, options.rootMargin, options.threshold]);

  return ref;
}
