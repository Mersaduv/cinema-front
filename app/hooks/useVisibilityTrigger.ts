"use client";

import { useEffect, useRef } from "react";

export function useVisibilityTrigger(
  onVisible: () => void,
  options: IntersectionObserverInit = { rootMargin: "300px", threshold: 0 },
) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    const element = ref.current;
    if (!element || fired.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired.current) {
        fired.current = true;
        observer.disconnect();
        onVisibleRef.current();
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return ref;
}
