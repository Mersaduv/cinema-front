"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 450;

/**
 * Debounces router.replace on TV browsers where rapid history updates can reload the page.
 */
export function useTvDebouncedReplace() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return (href: string, isTv: boolean) => {
    if (!isTv) {
      router.replace(href, { scroll: false });
      return;
    }

    pendingRef.current = href;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        router.replace(pendingRef.current, { scroll: false });
        pendingRef.current = null;
      }
    }, DEBOUNCE_MS);
  };
}
