"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineCheckCircle, HiOutlineSearch } from "react-icons/hi";
import type { TmdbSearchResult } from "../../lib/admin-movies";

type TmdbTitleSearchProps = {
  onSelect: (tmdbId: number) => void;
  search: (
    query: string,
  ) => Promise<ApiResponse<{ results: TmdbSearchResult[] }>>;
  debounceMs?: number;
  placeholder?: string;
  label?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export default function TmdbTitleSearch({
  onSelect,
  search,
  debounceMs = 500,
  placeholder = "جستجو با عنوان فیلم یا سریال…",
  label = "جستجوی عنوان در TMDB",
}: TmdbTitleSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2 || /^\d+$/.test(trimmed)) {
      setResults([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      const requestId = ++requestRef.current;
      setLoading(true);

      try {
        const response = await search(trimmed);

        if (requestId !== requestRef.current) {
          return;
        }

        if (response.success && response.data?.results) {
          setResults(response.data.results);
          setOpen(response.data.results.length > 0);
        } else {
          setResults([]);
          setOpen(false);
        }
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, debounceMs, search]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
          <HiOutlineSearch className="h-4 w-4" />
          {label}
          {loading ? (
            <span className="text-xs text-[#38bdf8]">در حال جستجو…</span>
          ) : null}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#38bdf8]/45"
        />
      </label>

      {open && results.length > 0 ? (
        <ul className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#071019] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          {results.map((result) => {
            const title = result.title || result.original_title || "بدون عنوان";
            const subtitle = [
              result.original_title && result.original_title !== result.title
                ? result.original_title
                : null,
              result.release_year ? String(result.release_year) : null,
              result.tmdb_id ? `TMDB ${result.tmdb_id}` : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={result.tmdb_id ?? title}>
                <button
                  type="button"
                  onClick={() => {
                    if (result.tmdb_id) {
                      onSelect(result.tmdb_id);
                      setQuery("");
                      setOpen(false);
                      setResults([]);
                    }
                  }}
                  className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-right transition last:border-b-0 hover:bg-white/[0.06]"
                >
                  {result.poster_url ? (
                    <img
                      src={result.poster_url}
                      alt=""
                      className="h-16 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[10px] text-[#728896]">
                      TMDB
                    </div>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {title}
                    </span>
                    {subtitle ? (
                      <span className="mt-1 block truncate text-xs text-[#8ea4b3]">
                        {subtitle}
                      </span>
                    ) : null}
                  </span>
                  <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-[#38bdf8]/70" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
