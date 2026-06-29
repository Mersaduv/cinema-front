"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";

type SlugCheckResponse = {
  available: boolean;
  suggestion?: string | null;
};

type UseSlugAvailabilityOptions = {
  slug: string;
  check: (
    slug: string,
    excludeId?: string | number,
  ) => Promise<{ success: boolean; data?: SlugCheckResponse }>;
  excludeId?: string | number;
  debounceMs?: number;
  enabled?: boolean;
};

export function useSlugAvailability({
  slug,
  check,
  excludeId,
  debounceMs = 400,
  enabled = true,
}: UseSlugAvailabilityOptions) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle",
  );
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const trimmed = slug.trim();

    if (!enabled || !trimmed) {
      setStatus("idle");
      setSuggestion(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      const requestId = ++requestRef.current;
      setStatus("checking");

      try {
        const response = await check(trimmed, excludeId);

        if (requestId !== requestRef.current) {
          return;
        }

        if (response.success && response.data) {
          setStatus(response.data.available ? "available" : "taken");
          setSuggestion(response.data.suggestion ?? null);
        } else {
          setStatus("idle");
          setSuggestion(null);
        }
      } catch {
        if (requestId === requestRef.current) {
          setStatus("idle");
          setSuggestion(null);
        }
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [slug, check, excludeId, debounceMs, enabled]);

  return {
    status,
    suggestion,
    isChecking: status === "checking",
    isTaken: status === "taken",
    isAvailable: status === "available",
  };
}

type SlugAvailabilityHintProps = {
  status: "idle" | "checking" | "available" | "taken";
  suggestion?: string | null;
  onApplySuggestion?: (slug: string) => void;
};

export function SlugAvailabilityHint({
  status,
  suggestion,
  onApplySuggestion,
}: SlugAvailabilityHintProps) {
  if (status === "idle") {
    return null;
  }

  if (status === "checking") {
    return (
      <p className="mt-2 text-xs text-[#8ea4b3]">در حال بررسی یکتایی slug…</p>
    );
  }

  if (status === "available") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#86efac]">
        <HiOutlineCheckCircle className="h-4 w-4" />
        این slug در دسترس است.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="flex items-center gap-1.5 text-xs text-[#fca5a5]">
        <HiOutlineXCircle className="h-4 w-4" />
        این slug قبلاً استفاده شده.
      </p>
      {suggestion && onApplySuggestion ? (
        <button
          type="button"
          onClick={() => onApplySuggestion(suggestion)}
          className="text-xs font-semibold text-[#8bdcff] transition hover:text-[#bfeaff]"
        >
          پیشنهاد: {suggestion}
        </button>
      ) : null}
    </div>
  );
}
