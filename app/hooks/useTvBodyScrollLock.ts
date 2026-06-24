"use client";

import { useEffect } from "react";

/** Prevents background page scroll while a full-screen TV overlay is open. */
export function useTvBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") {
      return;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;

    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
