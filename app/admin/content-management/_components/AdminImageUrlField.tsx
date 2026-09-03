"use client";

import { useRef, useState } from "react";
import { HiOutlineArrowUpTray } from "react-icons/hi2";
import {
  uploadAdminCatalogImage,
  validateAdminImageUploadFile,
  type AdminCatalogImageUploadResult,
} from "../../../lib/admin-upload";

type AdminImageUrlFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUploaded?: (result: AdminCatalogImageUploadResult) => void;
  entityType?: "movie" | "series";
  entityId?: number | string | null;
  imageRole?: "poster" | "backdrop" | "still";
  dir?: "rtl" | "ltr";
  className?: string;
  disabled?: boolean;
  uploadLabel?: string;
};

export default function AdminImageUrlField({
  label,
  value,
  onChange,
  onUploaded,
  entityType,
  entityId,
  imageRole,
  dir = "ltr",
  className = "",
  disabled = false,
  uploadLabel = "آپلود تصویر",
}: AdminImageUrlFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    const validationError = validateAdminImageUploadFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadAdminCatalogImage(file, {
        entityType,
        entityId,
        imageRole,
      });

      if (!response.success || !response.data?.image_path) {
        setError(response.message || "آپلود تصویر انجام نشد.");
        return;
      }

      onChange(response.data.image_path);
      onUploaded?.(response.data);
    } catch {
      setError("آپلود تصویر انجام نشد.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="block">
      <span className="mb-2 block text-sm text-[#8ea4b3]">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          type="url"
          dir={dir}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || uploading}
          className={`min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#607684] focus:border-[#f5c518]/45 disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#f5c518]/35 bg-[#f5c518]/10 px-4 py-3 text-sm font-semibold text-[#f5c518] transition hover:bg-[#f5c518]/15 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <HiOutlineArrowUpTray className="h-4 w-4" />
          {uploading ? "در حال آپلود..." : uploadLabel}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </label>
  );
}
