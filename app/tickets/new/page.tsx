"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HiOutlinePhotograph, HiOutlineX } from "react-icons/hi";
import ProtectedRoute from "../../components/ProtectedRoute";
import ProfileShell from "../../components/profile/ProfileShell";
import {
  fetchTicketCategories,
  submitTicket,
  uploadTicketImage,
  validateTicketForm,
  type TicketCategory,
} from "../../lib/tickets";

function NewTicketPageContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUpload, setImageUpload] = useState<{
    fileDirectory: string;
    fileName: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await fetchTicketCategories();
      if (response.success && response.data?.categories) {
        setCategories(response.data.categories);
        if (response.data.categories[0]) {
          setCategory(response.data.categories[0].slug);
        }
      }
    })();
  }, []);

  const handleImageSelect = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError("");
    setUploadingImage(true);
    setImagePreview(URL.createObjectURL(file));

    const response = await uploadTicketImage(file);

    setUploadingImage(false);

    if (!response.success || !response.data?.fileName) {
      setError(response.message || "آپلود تصویر انجام نشد.");
      setImagePreview(null);
      setImageUpload(null);
      return;
    }

    setImageUpload({
      fileDirectory: response.data.fileDirectory,
      fileName: response.data.fileName,
    });
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const validationError = validateTicketForm({ category, description });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    const response = await submitTicket({
      category,
      description,
      imageDirectory: imageUpload?.fileDirectory,
      imageFilename: imageUpload?.fileName,
    });

    setSubmitting(false);

    if (!response.success) {
      setError(response.message || "ثبت تیکت انجام نشد.");
      return;
    }

    router.push("/tickets");
  };

  return (
    <ProfileShell active="tickets-new">
      <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center">
        <div className="mb-6 w-full max-w-3xl text-center">
          <h1 className="mb-2 text-4xl font-black text-[#f8d977]">تیکت جدید</h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-[#d0d0d0]">
            در صورت بروز مشکل فنی، پیشنهاد یا انتقاد می‌توانید از این فرم استفاده کنید.
            پس از بررسی، پاسخ از همین بخش قابل مشاهده خواهد بود.
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="w-full max-w-3xl rounded-2xl border border-[#f5c518]/25 bg-[#121212]/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.45)] md:p-8"
        >
          <div className="mb-5">
            <label htmlFor="ticket-category" className="mb-2 block text-sm font-semibold text-[#f2f2f2]">
              دسته بندی
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-[#3a3a3a] bg-[#0c0c0c] px-4 py-3 text-white outline-none focus:border-[#f5c518]"
              required
            >
              {categories.map((item) => (
                <option key={item.slug} value={item.slug} className="bg-[#121212]">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label htmlFor="ticket-description" className="mb-2 block text-sm font-semibold text-[#f2f2f2]">
              توضیحات
            </label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={8}
              placeholder="مشکل یا درخواست خود را با جزئیات بنویسید..."
              className="w-full resize-y rounded-lg border border-[#3a3a3a] bg-[#0c0c0c] px-4 py-3 text-white outline-none focus:border-[#f5c518]"
              required
            />
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-[#f2f2f2]">پیوست تصویر (اختیاری)</p>
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-[#4a4a4a] bg-[#0d0d0d] p-4">
              {imagePreview ? (
                <div className="relative">
                  <div className="relative h-40 w-64 overflow-hidden rounded-lg">
                    <Image src={imagePreview} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -left-2 -top-2 rounded-full bg-black/80 p-1 text-white"
                    aria-label="حذف تصویر"
                  >
                    <HiOutlineX className="h-4 w-4" />
                  </button>
                  {uploadingImage ? (
                    <p className="mt-2 text-center text-xs text-gray-400">در حال آپلود...</p>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 items-center justify-center rounded-lg bg-[#1a1a1a] text-[#f8d977] transition hover:bg-[#242424]"
                >
                  <HiOutlinePhotograph className="h-8 w-8" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => void handleImageSelect(event.target.files?.[0] ?? null)}
            />
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="w-full rounded-lg bg-[#f5c518] py-3 text-sm font-black text-black transition hover:bg-[#e7b900] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "در حال ثبت..." : "ثبت تیکت"}
          </button>
        </form>
      </div>
    </ProfileShell>
  );
}

export default function NewTicketPage() {
  return (
    <ProtectedRoute requireViewer>
      <NewTicketPageContent />
    </ProtectedRoute>
  );
}
