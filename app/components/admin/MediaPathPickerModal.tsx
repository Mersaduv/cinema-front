"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineChevronLeft,
  HiOutlineFolder,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiX,
} from "react-icons/hi";
import {
  adminMoviesService,
  type MediaBrowserEntriesResponse,
  type MediaBrowserFileEntry,
} from "../../lib/admin-movies";

function resolveInitialBrowsePath(path?: string) {
  if (!path) {
    return null;
  }

  const normalized = path.replace(/\//g, "\\").trim();

  if (!normalized) {
    return null;
  }

  const lastSeparatorIndex = normalized.lastIndexOf("\\");

  if (lastSeparatorIndex <= 2) {
    return normalized;
  }

  return normalized.slice(0, lastSeparatorIndex);
}

type MediaPickerKind = "video" | "image" | "subtitle" | "dubbed";

interface MediaPathPickerModalProps {
  open: boolean;
  title: string;
  kind: MediaPickerKind;
  currentPath?: string;
  onClose: () => void;
  onSelect: (file: MediaBrowserFileEntry) => void;
}

const emptyEntries: MediaBrowserEntriesResponse = {
  kind: "video",
  allowed_extensions: [],
  current_path: "",
  parent_path: null,
  directories: [],
  files: [],
};

function kindDescription(kind: MediaPickerKind) {
  switch (kind) {
    case "video":
      return "فقط فایل‌های ویدیویی پشتیبانی‌شده نمایش داده می‌شوند.";
    case "image":
      return "فقط فایل‌های تصویری پشتیبانی‌شده نمایش داده می‌شوند.";
    case "subtitle":
      return "فقط فایل‌های زیرنویس پشتیبانی‌شده نمایش داده می‌شوند.";
    case "dubbed":
      return "فایل‌های صوتی یا ویدیویی مربوط به نسخه دوبله نمایش داده می‌شوند.";
    default:
      return "";
  }
}

function kindIcon(kind: MediaPickerKind) {
  if (kind === "video" || kind === "dubbed") {
    return <HiOutlineVideoCamera className="h-5 w-5" />;
  }

  return <HiOutlinePhotograph className="h-5 w-5" />;
}

export default function MediaPathPickerModal({
  open,
  title,
  kind,
  currentPath,
  onClose,
  onSelect,
}: MediaPathPickerModalProps) {
  const [entries, setEntries] = useState<MediaBrowserEntriesResponse>({
    ...emptyEntries,
    kind,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const subtitle = useMemo(() => {
    if (!entries.allowed_extensions.length) {
      return "";
    }

    return entries.allowed_extensions.map((extension) => `.${extension}`).join(" . ");
  }, [entries.allowed_extensions]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredDirectories = useMemo(() => {
    if (!normalizedSearch) {
      return entries.directories;
    }

    return entries.directories.filter((directory) =>
      `${directory.name} ${directory.path}`.toLowerCase().includes(normalizedSearch)
    );
  }, [entries.directories, normalizedSearch]);

  const filteredFiles = useMemo(() => {
    if (!normalizedSearch) {
      return entries.files;
    }

    return entries.files.filter((file) =>
      `${file.name} ${file.path} ${file.extension}`.toLowerCase().includes(normalizedSearch)
    );
  }, [entries.files, normalizedSearch]);

  const loadEntries = async (path?: string | null) => {
    setLoading(true);
    setError("");
    setSearch("");

    const response = await adminMoviesService.browseEntries(kind, path);

    if (response.success && response.data) {
      setEntries(response.data);
    } else {
      setError(response.message || "خواندن مسیر انتخابی انجام نشد.");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadInitial = async () => {
      setLoading(true);
      setError("");

      const rootsResponse = await adminMoviesService.browserRoots(kind);

      if (!rootsResponse.success || !rootsResponse.data) {
        setError(rootsResponse.message || "دریافت مسیرهای اولیه انجام نشد.");
        setLoading(false);
        return;
      }

      const initialPath =
        resolveInitialBrowsePath(currentPath) ||
        rootsResponse.data.roots[0]?.path ||
        null;

      const entriesResponse = await adminMoviesService.browseEntries(kind, initialPath);

      if (entriesResponse.success && entriesResponse.data) {
        setEntries(entriesResponse.data);
      } else {
        setError(entriesResponse.message || "بارگذاری محتوای پوشه انجام نشد.");
      }

      setLoading(false);
    };

    void loadInitial();
  }, [currentPath, kind, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#02070bcc] px-3 py-4 backdrop-blur-md sm:px-5 sm:py-8">
      <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center">
        <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#09141c] shadow-[0_32px_80px_rgba(0,0,0,0.45)] sm:rounded-[32px]">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="text-xs text-[#7dd3fc]">انتخاب از سیستم</p>
              <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">{kindDescription(kind)}</p>
              {subtitle ? <p className="mt-2 text-xs text-[#5f7380]">{subtitle}</p> : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[#9cb1be] transition hover:border-white/20 hover:text-white"
              aria-label="بستن"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
            <div className="mb-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => entries.parent_path && void loadEntries(entries.parent_path)}
                    disabled={!entries.parent_path || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <HiOutlineChevronLeft className="h-4 w-4" />
                    پوشه قبل
                  </button>

                  <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-[#d9e4eb]">
                    <span className="block break-all">
                      {entries.current_path || "در حال بارگذاری..."}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="جست‌وجوی فایل یا پوشه در همین مسیر..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#6f8492]"
                  />
                </div>
              </div>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-[#071019] px-6 py-16 text-center text-sm text-[#8ea4b3]">
                در حال خواندن محتوای پوشه...
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#071019]">
                <div className="grid grid-cols-[minmax(360px,1.9fr)_110px_110px] gap-3 border-b border-white/8 px-4 py-3 text-xs text-[#7f94a1]">
                  <span>نام</span>
                  <span className="text-center">نوع</span>
                  <span className="text-center">حجم</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
                  {filteredDirectories.length || filteredFiles.length ? (
                    <div className="min-w-[680px]">
                      {filteredDirectories.map((directory) => (
                        <button
                          key={directory.path}
                          type="button"
                          onClick={() => void loadEntries(directory.path)}
                          className="grid w-full grid-cols-[minmax(360px,1.9fr)_110px_110px] gap-3 border-b border-white/8 px-4 py-3 text-right transition hover:bg-white/[0.05]"
                        >
                          <span className="flex min-w-0 items-start gap-3 overflow-hidden">
                            <span className="shrink-0 rounded-2xl bg-[#f5c518]/10 p-2 text-[#f5c518]">
                              <HiOutlineFolder className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 overflow-hidden text-right">
                              <span className="block break-all text-sm font-semibold leading-6 text-white">
                                {directory.name}
                              </span>
                              <span className="mt-2 block break-all text-[11px] leading-5 text-[#5f7380]">
                                {directory.path}
                              </span>
                            </span>
                          </span>
                          <span className="flex items-center justify-center text-xs font-semibold text-[#f8d977]">
                            پوشه
                          </span>
                          <span className="flex items-center justify-center text-xs text-[#7890a0]">
                            <span className="inline-flex items-center gap-2">
                              باز کردن
                              <HiOutlineArrowRight className="h-4 w-4" />
                            </span>
                          </span>
                        </button>
                      ))}

                      {filteredFiles.map((file) => (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => {
                            onSelect(file);
                            onClose();
                          }}
                          className="grid w-full grid-cols-[minmax(360px,1.9fr)_110px_110px] gap-3 border-b border-white/8 px-4 py-3 text-right transition hover:bg-[#38bdf8]/[0.08] last:border-b-0"
                        >
                          <span className="flex min-w-0 items-start gap-3 overflow-hidden">
                            <span className="shrink-0 rounded-2xl bg-[#38bdf8]/10 p-2 text-[#7dd3fc]">
                              {kindIcon(kind)}
                            </span>
                            <span className="min-w-0 overflow-hidden text-right">
                              <span className="block break-all text-sm font-semibold leading-6 text-white">
                                {file.name}
                              </span>
                              <span className="mt-2 block break-all text-[11px] leading-5 text-[#5f7380]">
                                {file.path}
                              </span>
                            </span>
                          </span>
                          <span className="flex items-center justify-center text-xs font-semibold text-[#9ccfe7]">
                            {file.extension.toUpperCase()}
                          </span>
                          <span className="flex items-center justify-center text-xs font-semibold text-[#d8e6ee]">
                            {file.size_label}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-10 text-center text-sm text-[#708592]">
                      {normalizedSearch
                        ? "نتیجه‌ای برای جست‌وجوی فعلی پیدا نشد."
                        : "موردی برای نمایش در این مسیر پیدا نشد."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
