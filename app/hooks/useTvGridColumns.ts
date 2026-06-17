"use client";

import { useEffect, useState, type RefObject } from "react";
import { inferGridColumns } from "../lib/tv/focus";

/**
 * Measures live column count for a CSS poster grid (resize-aware).
 */
export function useTvGridColumns(
  gridRef: RefObject<HTMLElement | null>,
  itemCount: number,
): number {
  const [cols, setCols] = useState(2);

  useEffect(() => {
    const element = gridRef.current;

    if (!element) {
      return;
    }

    const measure = () => {
      setCols(inferGridColumns(element));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [gridRef, itemCount]);

  return cols;
}
