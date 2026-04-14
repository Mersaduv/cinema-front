"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from "react-icons/hi";
import AdminSelect from "../../../../components/admin/AdminSelect";
import {
  adminMoviesService,
  type AdminMovieOptionsResponse,
  type CreateAdminMoviePayload,
  type PublishStatus,
} from "../../../../lib/admin-movies";

const emptyOptions: AdminMovieOptionsResponse = {
  publish_statuses: [],
  processing_statuses: [],
  hls_profiles: [],
  media_root: "D:\\media",
};

const initialForm = {
  title: "",
  slug: "",
  original_title: "",
  synopsis: "",
  release_year: "",
  duration_seconds: "",
  provider_name: "",
  poster_path: "",
  source_path: "",
  publish_status: "draft" as PublishStatus,
  scheduled_for: "",
  start_processing: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AddMoviePage() {
  const router = useRouter();
  const [options, setOptions] = useState<AdminMovieOptionsResponse>(emptyOptions);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      const response = await adminMoviesService.options();

      if (response.success && response.data) {
        setOptions(response.data);
      } else {
        setError(response.message || "دریافت اطلاعات فرم با خطا روبه‌رو شد.");
      }

      setLoading(false);
    };

    void loadOptions();
  }, []);

  const publishStatusOptions = options.publish_statuses.map((status) => ({
    value: status.value,
    label: status.label,
    description: `وضعیت فعلی این فیلم روی پنل: ${status.label}`,
  }));

  const resolvedSlug = useMemo(
    () => slugify(form.slug || form.title),
    [form.slug, form.title]
  );

  const managedFolderPreview = resolvedSlug
    ? `${options.media_root}\\movies\\${resolvedSlug}`
    : `${options.media_root}\\movies\\movie-slug`;

  const handleChange = (field: keyof typeof initialForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const payload: CreateAdminMoviePayload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      original_title: form.original_title.trim() || undefined,
      synopsis: form.synopsis.trim() || undefined,
      release_year: form.release_year ? Number(form.release_year) : null,
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : null,
      provider_name: form.provider_name.trim() || undefined,
      poster_path: form.poster_path.trim() || undefined,
      source_path: form.source_path.trim(),
      publish_status: form.publish_status,
      scheduled_for:
        form.publish_status === "scheduled" && form.scheduled_for
          ? new Date(form.scheduled_for).toISOString()
          : null,
      start_processing: form.start_processing,
    };

    const response = await adminMoviesService.create(payload);

    if (response.success && response.data) {
      setSuccessMessage("فیلم با موفقیت ثبت شد.");
      window.setTimeout(() => {
        router.push(
          `/admin/content-management/movies/${response.data?.movie.id}`
        );
      }, 900);
    } else {
      const firstError = response.errors
        ? Object.values(response.errors)[0]?.[0]
        : undefined;

      setError(firstError || response.message || "ثبت فیلم انجام نشد.");
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(140deg,rgba(56,189,248,0.14),rgba(8,16,24,0.96)_40%,rgba(245,197,24,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-3 py-1 text-xs text-[#7dd3fc]">
              <HiOutlineSparkles className="h-4 w-4" />
              ثبت و ingest فیلم
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
              فیلم جدید را با مسیر فایل منبع و تنظیمات HLS ثبت کن
            </h2>
            <p className="mt-5 text-base leading-8 text-[#dce8ef] md:text-lg">
              در این فرم فقط metadata و مسیر فایل منبع ثبت می‌شود. سیستم از روی
              همین اطلاعات پوشه‌ی مدیریت‌شده را می‌سازد و در صورت نیاز پردازش HLS
              را در صف قرار می‌دهد.
            </p>
          </div>

          <Link
            href="/admin/content-management/movies"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            بازگشت به فیلم‌ها
            <HiOutlineArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
          <h3 className="text-xl font-bold text-white">اطلاعات فیلم</h3>
          <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
            عنوان، مسیر منبع و وضعیت انتشار را ثبت کن. هیچ فایلی دوباره آپلود
            نمی‌شود و همه‌چیز بر اساس مسیر سرور خوانده خواهد شد.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
              <HiOutlineCheckCircle className="h-5 w-5" />
              {successMessage}
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">عنوان فیلم</span>
                <input
                  value={form.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  placeholder="مثلاً Dune: Part Two"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => handleChange("slug", event.target.value)}
                  placeholder={resolvedSlug || "auto-generated-from-title"}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">
                  عنوان اصلی
                </span>
                <input
                  value={form.original_title}
                  onChange={(event) =>
                    handleChange("original_title", event.target.value)
                  }
                  placeholder="نام اصلی فیلم"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">
                  تامین‌کننده
                </span>
                <input
                  value={form.provider_name}
                  onChange={(event) =>
                    handleChange("provider_name", event.target.value)
                  }
                  placeholder="مثلاً Provider A"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">
                مسیر فایل منبع
              </span>
              <input
                value={form.source_path}
                onChange={(event) => handleChange("source_path", event.target.value)}
                placeholder="D:\\media\\incoming\\movie.mp4"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">
                مسیر پوستر
              </span>
              <input
                value={form.poster_path}
                onChange={(event) => handleChange("poster_path", event.target.value)}
                placeholder="D:\\media\\movies\\movie-slug\\assets\\poster.jpg"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">
                  سال انتشار
                </span>
                <input
                  type="number"
                  min="1888"
                  max="2100"
                  value={form.release_year}
                  onChange={(event) =>
                    handleChange("release_year", event.target.value)
                  }
                  placeholder="2026"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">
                  مدت زمان به ثانیه
                </span>
                <input
                  type="number"
                  min="1"
                  value={form.duration_seconds}
                  onChange={(event) =>
                    handleChange("duration_seconds", event.target.value)
                  }
                  placeholder="7800"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">
                وضعیت انتشار
              </span>
              <AdminSelect
                value={form.publish_status}
                onChange={(value) =>
                  handleChange("publish_status", value as PublishStatus)
                }
                options={publishStatusOptions}
                disabled={loading}
              />
            </label>

            {form.publish_status === "scheduled" && (
              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">
                  زمان انتشار
                </span>
                <input
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={(event) =>
                    handleChange("scheduled_for", event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                  required
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm text-[#8ea4b3]">خلاصه</span>
              <textarea
                value={form.synopsis}
                onChange={(event) => handleChange("synopsis", event.target.value)}
                rows={5}
                placeholder="خلاصه فیلم را اینجا بنویس..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#d7e3ea]">
              <input
                type="checkbox"
                checked={form.start_processing}
                onChange={(event) =>
                  handleChange("start_processing", event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-transparent text-[#f5c518]"
              />
              <span>بعد از ثبت، فیلم در صف پردازش HLS قرار بگیرد</span>
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e1b400] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "در حال ثبت..." : "ثبت فیلم"}
              </button>
              <Link
                href="/admin/content-management/movies"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                انصراف
              </Link>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">پیش‌نمایش ساختار فایل</h3>
            <div className="mt-5 rounded-[28px] border border-white/10 bg-[#09141c] p-5 text-sm leading-7 text-[#d7e3ea]">
              <p className="text-[#8ea4b3]">پوشه مدیریت‌شده فیلم</p>
              <p className="mt-2 break-all font-semibold text-white">
                {managedFolderPreview}
              </p>
              <p className="mt-4 text-[#8ea4b3]">master playlist</p>
              <p className="mt-2 break-all text-white">
                {managedFolderPreview}\\hls\\master.m3u8
              </p>
              <p className="mt-4 text-[#8ea4b3]">assets</p>
              <p className="mt-2 break-all text-white">
                {managedFolderPreview}\\assets
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <h3 className="text-xl font-bold text-white">پروفایل‌های HLS</h3>
            <div className="mt-5 space-y-3">
              {options.hls_profiles.map((profile) => (
                <div
                  key={profile.key}
                  className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">{profile.label}</span>
                    <span className="text-[#8ea4b3]">{profile.resolution}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#8ea4b3]">
                    bandwidth: {profile.bandwidth.toLocaleString("en-US")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[#38bdf8]/18 bg-[#08121a] p-6">
            <h3 className="text-xl font-bold text-white">قاعده این بخش</h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]">
                سیستم فایل منبع را دوباره کپی نمی‌کند و فقط آن را به‌عنوان source
                ثبت می‌کند.
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]">
                خروجی HLS داخل پوشه‌ی مدیریت‌شده همان فیلم ساخته می‌شود تا ساختار
                پخش منظم و قابل انتقال بماند.
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3dee5]">
                اگر وضعیت را روی «زمان بندی شده» بگذاری، تاریخ انتشار باید ثبت شود.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
