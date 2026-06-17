"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { HiOutlinePaperAirplane, HiOutlinePaperClip, HiOutlineX } from "react-icons/hi";
import { uploadTicketAttachment } from "../../lib/tickets";

export type TicketComposerPayload = {
  body: string;
  imageDirectory?: string;
  imageFilename?: string;
};

type TicketMessageComposerProps = {
  disabled?: boolean;
  placeholder?: string;
  submitLabel?: string;
  secondaryLabel?: string;
  onSubmit: (payload: TicketComposerPayload) => Promise<boolean>;
  onSecondarySubmit?: (payload: TicketComposerPayload) => Promise<boolean>;
};

export default function TicketMessageComposer({
  disabled = false,
  placeholder = "پیام خود را بنویسید...",
  submitLabel = "ارسال پیام",
  secondaryLabel,
  onSubmit,
  onSecondarySubmit,
}: TicketMessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUpload, setAttachmentUpload] = useState<{
    fileDirectory: string;
    fileName: string;
  } | null>(null);

  const canSubmit = body.trim().length >= 5 || attachmentUpload !== null;

  const clearAttachment = () => {
    setAttachmentPreview(null);
    setAttachmentName(null);
    setAttachmentUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAttachmentSelect = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError("");
    setUploading(true);
    setAttachmentName(file.name);

    if (file.type.startsWith("image/")) {
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentPreview(null);
    }

    const response = await uploadTicketAttachment(file);

    setUploading(false);

    if (!response.success || !response.data?.fileName) {
      setError(response.message || "آپلود فایل انجام نشد.");
      clearAttachment();
      return;
    }

    setAttachmentUpload({
      fileDirectory: response.data.fileDirectory,
      fileName: response.data.fileName,
    });
  };

  const buildPayload = (): TicketComposerPayload => ({
    body: body.trim(),
    imageDirectory: attachmentUpload?.fileDirectory,
    imageFilename: attachmentUpload?.fileName,
  });

  const handleSubmit = async (secondary = false) => {
    if (!canSubmit || sending || disabled || uploading) {
      return;
    }

    setSending(true);
    setError("");

    const payload = buildPayload();
    const success =
      secondary && onSecondarySubmit
        ? await onSecondarySubmit(payload)
        : await onSubmit(payload);

    setSending(false);

    if (success) {
      setBody("");
      clearAttachment();
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
      {error ? (
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {attachmentName ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            {attachmentPreview ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10">
                <Image src={attachmentPreview} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/70">
                فایل
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{attachmentName}</p>
              <p className="text-xs text-white/45">
                {uploading ? "در حال آپلود..." : attachmentUpload ? "آماده ارسال" : "در انتظار آپلود"}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={uploading || sending}
            onClick={clearAttachment}
            className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <textarea
        value={body}
        disabled={disabled || sending || uploading}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit(false);
          }
        }}
        rows={3}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#f5c518]/35 disabled:opacity-60"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.zip,.doc,.docx,.txt"
            className="hidden"
            onChange={(event) => void handleAttachmentSelect(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={disabled || sending || uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-60"
          >
            <HiOutlinePaperClip className="h-4 w-4" />
            پیوست تصویر یا فایل
          </button>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {secondaryLabel && onSecondarySubmit ? (
            <button
              type="button"
              disabled={disabled || sending || uploading || !canSubmit}
              onClick={() => void handleSubmit(true)}
              className="rounded-xl border border-slate-400/30 bg-slate-500/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-500/20 disabled:opacity-60"
            >
              {sending ? "در حال ارسال..." : secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled || sending || uploading || !canSubmit}
            onClick={() => void handleSubmit(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#f5c518] px-5 py-2.5 text-sm font-black text-black transition hover:bg-[#e7b900] disabled:opacity-60"
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
            {sending ? "در حال ارسال..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
