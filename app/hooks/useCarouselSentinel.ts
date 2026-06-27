"use client";

import { useEffect, useRef, type RefObject } from "react";

type SentinelOptions = {
  onTrigger: () => void;
  enabled: boolean;
  rootRef: RefObject<HTMLElement | null>;
  triggerAtIndex: number;
};

export function useCarouselSentinel(opts: SentinelOptions): {
  sentinelRef: RefObject<HTMLDivElement | null>;
  attachSentinelRef: (node: HTMLDivElement | null) => void;
} {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onTriggerRef = useRef(opts.onTrigger);
  onTriggerRef.current = opts.onTrigger;

  const attachSentinelRef = (node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  };

  useEffect(() => {
    const root = opts.rootRef.current;
    const target = sentinelRef.current;

    if (!root || !target || !opts.enabled) {
      return undefined;
    }

    // RTL horizontal rails scroll toward the visual left (inline-start).
    // Expanding the observer box on the LEFT (0px 0px 0px 200px) fires the
    // prefetch ~200px before the sentinel enters the scrollport — early enough
    // for sub-200ms perceived load on slide.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onTriggerRef.current();
        }
      },
      {
        root,
        rootMargin: "0px 0px 0px 200px",
        threshold: 0.1,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [opts.enabled, opts.rootRef, opts.triggerAtIndex]);

  return { sentinelRef, attachSentinelRef };
}
