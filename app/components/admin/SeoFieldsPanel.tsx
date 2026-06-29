"use client";

import { useEffect } from "react";

type SeoFieldsPanelProps = {
  title: string;
  synopsis: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
};

export default function SeoFieldsPanel({
  title,
  synopsis,
  slug,
  metaTitle,
  metaDescription,
  onMetaTitleChange,
  onMetaDescriptionChange,
}: SeoFieldsPanelProps) {
  useEffect(() => {
    if (!metaTitle.trim() && title.trim()) {
      onMetaTitleChange(title.trim().slice(0, 160));
    }
  }, [title, metaTitle, onMetaTitleChange]);

  useEffect(() => {
    if (!metaDescription.trim() && synopsis.trim()) {
      onMetaDescriptionChange(synopsis.trim().slice(0, 320));
    }
  }, [synopsis, metaDescription, onMetaDescriptionChange]);

  const previewTitle = metaTitle.trim() || title.trim() || "عنوان صفحه";
  const previewDescription =
    metaDescription.trim() || synopsis.trim().slice(0, 160) || "توضیحات متا برای موتورهای جستجو.";
  const previewUrl = slug.trim()
    ? `https://cinema.af/${slug.trim()}`
    : "https://cinema.af/example-title";

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm text-[#8ea4b3]">عنوان سئو (meta title)</span>
        <input
          type="text"
          value={metaTitle}
          onChange={(event) => onMetaTitleChange(event.target.value.slice(0, 160))}
          placeholder="عنوان پیش‌فرض از نام محتوا"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
        />
        <p className="mt-1 text-xs text-[#8ea4b3]">
          {metaTitle.length}/160 — توصیه: حداکثر ۶۰ کاراکتر
        </p>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-[#8ea4b3]">توضیحات سئو (meta description)</span>
        <textarea
          rows={4}
          value={metaDescription}
          onChange={(event) => onMetaDescriptionChange(event.target.value.slice(0, 320))}
          placeholder="خلاصهٔ کوتاه برای نتایج جستجو"
          className="w-full rounded-[26px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-[#f5c518]/45"
        />
        <p className="mt-1 text-xs text-[#8ea4b3]">
          {metaDescription.length}/320 — توصیه: حداکثر ۱۶۰ کاراکتر
        </p>
      </label>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <p className="mb-3 text-xs font-semibold text-[#8ea4b3]">پیش‌نمایش نتایج جستجو</p>
        <div className="space-y-1 rounded-2xl bg-white px-4 py-3 text-left" dir="ltr">
          <p className="truncate text-lg text-[#1a0dab]">{previewTitle}</p>
          <p className="truncate text-sm text-[#006621]">{previewUrl}</p>
          <p className="line-clamp-2 text-sm text-[#545454]">{previewDescription}</p>
        </div>
      </div>
    </div>
  );
}
