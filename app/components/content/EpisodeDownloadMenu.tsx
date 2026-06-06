"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineDownload } from "react-icons/hi";

function sortQualities(entries: [string, string][]): [string, string][] {
  return entries.sort(
    ([left], [right]) =>
      Number.parseInt(right.replace(/\D/g, ""), 10) -
      Number.parseInt(left.replace(/\D/g, ""), 10),
  );
}

export default function EpisodeDownloadMenu({
  downloadLinks,
  align = "left",
}: {
  downloadLinks: Record<string, string>;
  align?: "left" | "right";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const entries = useMemo(
    () => sortQualities(Object.entries(downloadLinks)),
    [downloadLinks],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (!entries.length) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] text-white/80 transition hover:border-[#f5c518]/35 hover:bg-[#f5c518]/10 hover:text-[#f8d977]"
        title="دانلود مستقیم"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <HiOutlineDownload className="h-6 w-6" />
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute bottom-[calc(100%+0.65rem)] z-30 min-w-[13.5rem] overflow-hidden rounded-[20px] border border-white/12 bg-[#0b1720]/95 shadow-[0_24px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
            align === "right" ? "left-0" : "right-0"
          }`}
        >
          <div className="border-b border-white/8 px-4 py-3">
            <p className="text-xs font-bold text-white">انتخاب کیفیت دانلود</p>
          </div>
          <div className="p-2">
            {entries.map(([quality, url]) => (
              <a
                key={quality}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/85 transition hover:bg-white/[0.08]"
              >
                <span className="font-bold">{quality}</span>
                <span className="text-xs text-[#f8d977]">دانلود</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
