"use client";

import { HiOutlineTrash, HiOutlineX } from "react-icons/hi";

type AdminDeleteConfirmModalProps = {
  open: boolean;
  kind: "movie" | "series";
  title: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function AdminDeleteConfirmModal({
  open,
  kind,
  title,
  loading = false,
  onConfirm,
  onCancel,
}: AdminDeleteConfirmModalProps) {
  if (!open) {
    return null;
  }

  const kindLabel = kind === "movie" ? "فیلم" : "سریال";

  return (
    <div
      className="fixed inset-0 z-[120] flex min-h-[100dvh] items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="بستن"
        onClick={loading ? undefined : onCancel}
      />
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1720] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#fb7185]/15 px-5 py-4">
          <div>
            <p className="text-xs text-[#fda4af]">حذف {kindLabel}</p>
            <h3 id="admin-delete-title" className="mt-1 text-lg font-bold text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 p-2 text-white/70 transition enabled:hover:bg-white/5 disabled:opacity-50"
            aria-label="بستن"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-white transition enabled:hover:bg-white/5 disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#fb7185] px-4 py-2.5 text-sm font-bold text-[#1a0509] transition enabled:hover:bg-[#f43f5e] disabled:opacity-70"
          >
            <HiOutlineTrash className="h-4 w-4" />
            {loading ? "در حال حذف..." : "حذف"}
          </button>
        </div>
      </div>
    </div>
  );
}
