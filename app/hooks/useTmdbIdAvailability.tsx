"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";

export type ExistingTmdbContent = {
  id: number;
  title: string;
  slug: string;
  original_title?: string | null;
  publish_status?: string | null;
  tmdb_id?: number | null;
};

/** @deprecated Prefer ExistingTmdbContent */
export type ExistingTmdbSeries = ExistingTmdbContent;

type TmdbCheckResponse = {
  available: boolean;
  existing?: ExistingTmdbContent | null;
};

type UseTmdbIdAvailabilityOptions = {
  tmdbId: string;
  check: (
    tmdbId: string | number,
    excludeId?: string | number,
  ) => Promise<{ success: boolean; data?: TmdbCheckResponse }>;
  excludeId?: string | number;
  debounceMs?: number;
  enabled?: boolean;
};

export function useTmdbIdAvailability({
  tmdbId,
  check,
  excludeId,
  debounceMs = 350,
  enabled = true,
}: UseTmdbIdAvailabilityOptions) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle",
  );
  const [existing, setExisting] = useState<ExistingTmdbContent | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const trimmed = String(tmdbId ?? "").trim();
    const numeric = /^\d+$/.test(trimmed) ? Number(trimmed) : 0;

    if (!enabled || !trimmed || numeric < 1) {
      setStatus("idle");
      setExisting(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      const requestId = ++requestRef.current;
      setStatus("checking");

      try {
        const response = await check(numeric, excludeId);

        if (requestId !== requestRef.current) {
          return;
        }

        if (response.success && response.data) {
          setStatus(response.data.available ? "available" : "taken");
          setExisting(response.data.available ? null : response.data.existing ?? null);
        } else {
          setStatus("idle");
          setExisting(null);
        }
      } catch {
        if (requestId === requestRef.current) {
          setStatus("idle");
          setExisting(null);
        }
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [tmdbId, check, excludeId, debounceMs, enabled]);

  return {
    status,
    existing,
    isChecking: status === "checking",
    isTaken: status === "taken",
    isAvailable: status === "available",
  };
}

type TmdbIdAvailabilityHintProps = {
  status: "idle" | "checking" | "available" | "taken";
  existing?: ExistingTmdbContent | null;
  entityKind?: "movie" | "series";
};

export function TmdbIdAvailabilityHint({
  status,
  existing,
  entityKind = "series",
}: TmdbIdAvailabilityHintProps) {
  const entityLabel = entityKind === "movie" ? "فیلم" : "سریال";
  const editHref =
    existing?.id != null
      ? entityKind === "movie"
        ? `/admin/content-management/movies/${existing.id}`
        : `/admin/content-management/series/${existing.id}`
      : null;

  if (status === "idle") {
    return null;
  }

  if (status === "checking") {
    return (
      <p className="mt-2 text-xs text-[#8ea4b3]">در حال بررسی تکراری بودن کد TMDb…</p>
    );
  }

  if (status === "available") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#86efac]">
        <HiOutlineCheckCircle className="h-4 w-4" />
        این کد TMDb آزاد است.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-1.5 rounded-2xl border border-[#fb7185]/30 bg-[#fb7185]/10 px-3 py-2.5">
      <p className="flex items-start gap-1.5 text-xs text-[#fecdd3]">
        <HiOutlineXCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          این کد TMDb قبلاً ثبت شده
          {existing?.title ? (
            <>
              {" "}
              برای {entityLabel} «
              <strong className="font-semibold text-white">{existing.title}</strong>»
            </>
          ) : null}
          {existing?.id ? ` (#${existing.id})` : ""}.
        </span>
      </p>
      {editHref ? (
        <Link
          href={editHref}
          className="inline-flex text-xs font-semibold text-[#8bdcff] transition hover:text-[#bfeaff]"
        >
          رفتن به ویرایش همان {entityLabel}
        </Link>
      ) : null}
    </div>
  );
}
