"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineChip,
  HiOutlineChatAlt2,
  HiOutlineFolderOpen,
  HiOutlineMinusCircle,
  HiOutlinePlusCircle,
  HiOutlineSparkles,
  HiOutlineVideoCamera,
} from "react-icons/hi";
import MediaPathPickerModal from "../../../../components/admin/MediaPathPickerModal";
import {
  adminMoviesService,
  type AdminMovieOptionsResponse,
  type CreateAdminMoviePayload,
  type MediaBrowserFileEntry,
} from "../../../../lib/admin-movies";

const emptyOptions: AdminMovieOptionsResponse = {
  publish_statuses: [],
  processing_statuses: [],
  hls_profiles: [],
  taxonomies: {
    genres: [],
    countries: [],
    languages: [],
    tags: [],
    actors: [],
  },
  media_root: "D:\\media",
};

const initialForm = {
  original_title: "",
  slug: "",
  release_year: "",
  provider_name: "",
  source_path: "",
  start_processing: true,
  selected_hls_profiles: [] as string[],
  has_dubbed_audio: false,
  dubbed_source_path: "",
  has_subtitle: false,
  subtitle_source_path: "",
};

type ExtraAudioTrackForm = {
  label: string;
  language: string;
  source_path: string;
  selection: MediaBrowserFileEntry | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "نامشخص";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SelectedServerFileCard({
  title,
  helper,
  value,
  file,
  buttonLabel,
  icon,
  onOpen,
}: {
  title: string;
  helper: string;
  value: string;
  file: MediaBrowserFileEntry | null;
  buttonLabel: string;
  icon: ReactNode;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[#7dd3fc]">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">{helper}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-4 py-2 text-sm text-[#cbeeff] transition hover:border-[#38bdf8]/40 hover:bg-[#38bdf8]/15"
        >
          <HiOutlineFolderOpen className="h-4 w-4" />
          {buttonLabel}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
        <p className="truncate text-sm font-semibold text-white">
          {value || "هنوز فایلی از روی سرور انتخاب نشده است."}
        </p>
        {file ? (
          <p className="mt-2 text-xs text-[#7f94a1]">
            {file.size_label} . {file.extension.toUpperCase()} .{" "}
            {formatDateTime(file.last_modified_at)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function AddMoviePage() {
  const router = useRouter();
  const [options, setOptions] = useState<AdminMovieOptionsResponse>(emptyOptions);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sourceSelection, setSourceSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [dubbedSelection, setDubbedSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [subtitleSelection, setSubtitleSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [dubbedPickerOpen, setDubbedPickerOpen] = useState(false);
  const [subtitlePickerOpen, setSubtitlePickerOpen] = useState(false);
  const [audioTrackPickerIndex, setAudioTrackPickerIndex] = useState<number | null>(null);
  const [extraAudioTracks, setExtraAudioTracks] = useState<ExtraAudioTrackForm[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const response = await adminMoviesService.options();

      if (response.success && response.data) {
        const optionsData = response.data;

        setOptions(response.data);
        setForm((current) => ({
          ...current,
          selected_hls_profiles: optionsData.hls_profiles.map((profile) => profile.key),
        }));
      } else {
        setError(response.message || "دریافت اطلاعات فرم با خطا روبه‌رو شد.");
      }

      setLoading(false);
    };

    void loadOptions();
  }, []);

  const resolvedSlug = useMemo(
    () => slugify(form.slug || form.original_title || sourceSelection?.name.replace(/\.[^.]+$/, "") || ""),
    [form.slug, form.original_title, sourceSelection]
  );

  const managedFolderPreview = resolvedSlug
    ? `${options.media_root}\\movies\\${resolvedSlug}`
    : `${options.media_root}\\movies\\movie-slug`;

  const handleChange = (
    field: keyof typeof initialForm,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProfileToggle = (profileKey: string) => {
    setForm((current) => {
      const exists = current.selected_hls_profiles.includes(profileKey);

      return {
        ...current,
        selected_hls_profiles: exists
          ? current.selected_hls_profiles.filter((item) => item !== profileKey)
          : [...current.selected_hls_profiles, profileKey],
      };
    });
  };

  const addAudioTrack = () => {
    setExtraAudioTracks((current) => [
      ...current,
      {
        label: `صوت ${current.length + 2}`,
        language: "fa",
        source_path: "",
        selection: null,
      },
    ]);
  };

  const updateAudioTrack = (
    index: number,
    field: "label" | "language" | "source_path" | "selection",
    value: string | MediaBrowserFileEntry | null
  ) => {
    setExtraAudioTracks((current) =>
      current.map((track, trackIndex) =>
        trackIndex === index ? { ...track, [field]: value } : track
      )
    );
  };

  const removeAudioTrack = (index: number) => {
    setExtraAudioTracks((current) =>
      current.filter((_, trackIndex) => trackIndex !== index)
    );

    if (audioTrackPickerIndex === index) {
      setAudioTrackPickerIndex(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    if (!form.source_path.trim()) {
      setError("ابتدا فایل ویدئو را از روی سرور انتخاب کن.");
      setSubmitting(false);
      return;
    }

    const payload: CreateAdminMoviePayload = {
      original_title: form.original_title.trim(),
      title: form.original_title.trim(),
      slug: form.slug.trim() || undefined,
      release_year: form.release_year ? Number(form.release_year) : null,
      provider_name: form.provider_name.trim() || undefined,
      source_path: form.source_path.trim(),
      start_processing: form.start_processing,
      selected_hls_profiles: form.selected_hls_profiles,
      has_dubbed_audio: form.has_dubbed_audio,
      dubbed_source_path: form.has_dubbed_audio ? form.dubbed_source_path.trim() || undefined : undefined,
      audio_tracks: extraAudioTracks
        .filter((track) => track.source_path.trim() !== "")
        .map((track) => ({
          label: track.label.trim() || "صوت اضافه",
          language: track.language.trim() || "und",
          source_path: track.source_path.trim(),
        })),
      has_subtitle: form.has_subtitle,
      subtitle_source_path: form.has_subtitle ? form.subtitle_source_path.trim() || undefined : undefined,
    };

    const response = await adminMoviesService.create(payload);

    if (response.success && response.data) {
      setSuccessMessage("پیش‌نویس فیلم با موفقیت ثبت شد.");
      window.setTimeout(() => {
        router.push(`/admin/content-management/movies/${response.data?.movie.id}`);
      }, 900);
    } else {
      const firstError = response.errors
        ? Object.values(response.errors)[0]?.[0]
        : undefined;

      setError(firstError || response.message || "ثبت پیش‌نویس انجام نشد.");
    }

    setSubmitting(false);
  };

  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(140deg,rgba(56,189,248,0.14),rgba(8,16,24,0.96)_40%,rgba(245,197,24,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-3 py-1 text-xs text-[#7dd3fc]">
                <HiOutlineSparkles className="h-4 w-4" />
                ایجاد فیلم پیش‌نویس
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
                ثبت سریع برای ورود به پردازش
              </h2>
              <p className="mt-5 text-base leading-8 text-[#dce8ef] md:text-lg">
                این فرم فقط اطلاعات پایه و فایل منبع را می‌گیرد تا فیلم سریع وارد سیستم و صف پردازش HLS شود.
                فرم پخش نهایی بعد از این مرحله به‌صورت جداگانه تکمیل می‌شود.
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
            <h3 className="text-xl font-bold text-white">فرم پیش‌نویس</h3>
            <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
              وضعیت انتشار در این مرحله همیشه پیش‌نویس است و از این فرم حذف شده تا جریان ثبت سریع‌تر بماند.
            </p>

            {error ? (
              <div className="mt-5 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
                {error}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
                <HiOutlineCheckCircle className="h-5 w-5" />
                {successMessage}
              </div>
            ) : null}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">عنوان اصلی فیلم</span>
                  <input
                    value={form.original_title}
                    onChange={(event) => handleChange("original_title", event.target.value)}
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

              <SelectedServerFileCard
                title="فایل منبع ویدئو"
                helper="فایل فیلم را از هر مسیر موجود روی سرور انتخاب کن. خروجی نهایی داخل D:\\media ساخته می‌شود."
                value={form.source_path}
                file={sourceSelection}
                buttonLabel="انتخاب فایل فیلم"
                icon={<HiOutlineVideoCamera className="h-5 w-5" />}
                onOpen={() => setSourcePickerOpen(true)}
              />

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">فایل دوبله</p>
                    <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                      اگر نسخه دوبله یا فایل صوت دوبله را همین حالا داشته باشی، قبل از پردازش ثبت می‌شود تا HLS از همان ابتدا درست ساخته شود.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.has_dubbed_audio}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        has_dubbed_audio: event.target.checked,
                        dubbed_source_path: event.target.checked ? current.dubbed_source_path : "",
                      }))
                    }
                    className="h-5 w-5 accent-[#f5c518]"
                  />
                </label>

                {form.has_dubbed_audio ? (
                  <div className="mt-4">
                    <SelectedServerFileCard
                      title="فایل صوت/نسخه دوبله"
                      helper="می‌تواند فایل صوتی مستقل یا نسخه ویدئویی دارای دوبله باشد."
                      value={form.dubbed_source_path}
                      file={dubbedSelection}
                      buttonLabel="انتخاب فایل دوبله"
                      icon={<HiOutlineChip className="h-5 w-5" />}
                      onOpen={() => setDubbedPickerOpen(true)}
                    />
                  </div>
                ) : null}
              </div>

              {form.has_dubbed_audio ? (
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">صوت‌های اضافه</p>
                      <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                        اگر زبان دوم یا سوم داری، از همین‌جا اضافه‌اش کن تا بعداً در پلیر قابل انتخاب باشد.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addAudioTrack}
                      className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-4 py-2 text-sm text-[#cbeeff] transition hover:border-[#38bdf8]/40 hover:bg-[#38bdf8]/15"
                    >
                      <HiOutlinePlusCircle className="h-4 w-4" />
                      افزودن
                    </button>
                  </div>

                  {extraAudioTracks.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {extraAudioTracks.map((track, index) => (
                        <div
                          key={`${index}-${track.source_path || track.label}`}
                          className="rounded-3xl border border-white/10 bg-[#071019] p-4"
                        >
                          <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
                            <label className="block">
                              <span className="mb-2 block text-sm text-[#8ea4b3]">عنوان صوت</span>
                              <input
                                value={track.label}
                                onChange={(event) => updateAudioTrack(index, "label", event.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#38bdf8]/45"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-sm text-[#8ea4b3]">کد زبان</span>
                              <input
                                value={track.language}
                                onChange={(event) => updateAudioTrack(index, "language", event.target.value)}
                                placeholder="fa / en"
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#38bdf8]/45"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => removeAudioTrack(index)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3] transition hover:border-[#fb7185]/40 hover:bg-[#fb7185]/15"
                            >
                              <HiOutlineMinusCircle className="h-4 w-4" />
                              حذف
                            </button>
                          </div>

                          <div className="mt-4">
                            <SelectedServerFileCard
                              title={`فایل صوت ${index + 2}`}
                              helper="فایل صوتی یا نسخه‌ای که زبان اضافه در آن وجود دارد."
                              value={track.source_path}
                              file={track.selection}
                              buttonLabel="انتخاب فایل صوت"
                              icon={<HiOutlineChip className="h-5 w-5" />}
                              onOpen={() => setAudioTrackPickerIndex(index)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-[#071019] px-4 py-5 text-sm text-[#7f94a1]">
                      هنوز صوت اضافه‌ای انتخاب نشده است.
                    </div>
                  )}
                </div>
              ) : null}

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">فایل زیرنویس</p>
                    <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                      اگر زیرنویس خارجی داری، قبل از پردازش انتخابش کن تا همراه خروجی HLS آماده شود.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.has_subtitle}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        has_subtitle: event.target.checked,
                        subtitle_source_path: event.target.checked ? current.subtitle_source_path : "",
                      }))
                    }
                    className="h-5 w-5 accent-[#f5c518]"
                  />
                </label>

                {form.has_subtitle ? (
                  <div className="mt-4">
                    <SelectedServerFileCard
                      title="فایل زیرنویس"
                      helper="فرمت‌های متنی رایج مثل srt, vtt, ass, ssa پشتیبانی می‌شوند."
                      value={form.subtitle_source_path}
                      file={subtitleSelection}
                      buttonLabel="انتخاب فایل زیرنویس"
                      icon={<HiOutlineChatAlt2 className="h-5 w-5" />}
                      onOpen={() => setSubtitlePickerOpen(true)}
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">سال انتشار</span>
                  <input
                    type="number"
                    min="1888"
                    max="2100"
                    value={form.release_year}
                    onChange={(event) => handleChange("release_year", event.target.value)}
                    placeholder="2026"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">منبع فایل / تامین‌کننده محتوا</span>
                  <input
                    value={form.provider_name}
                    onChange={(event) => handleChange("provider_name", event.target.value)}
                    placeholder="اختیاری"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#d7e3ea]">
                <input
                  type="checkbox"
                  checked={form.start_processing}
                  onChange={(event) => handleChange("start_processing", event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent text-[#f5c518]"
                />
                <span>بعد از ثبت، پردازش HLS هم شروع شود</span>
              </label>

              {form.start_processing ? (
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">کیفیت‌های پردازش</p>
                      <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                        مشخص کن برای این فیلم چه کیفیت‌هایی ساخته شوند. به‌صورت پیش‌فرض همه کیفیت‌ها فعال هستند.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {options.hls_profiles.map((profile) => {
                      const checked = form.selected_hls_profiles.includes(profile.key);

                      return (
                        <label
                          key={profile.key}
                          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                            checked
                              ? "border-[#f5c518]/35 bg-[#f5c518]/10 text-white"
                              : "border-white/10 bg-[#071019] text-[#c5d4de]"
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{profile.label}</p>
                            <p className="mt-1 text-xs text-[#8ea4b3]">
                              {profile.resolution}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleProfileToggle(profile.key)}
                            className="h-4 w-4 rounded border-white/20 bg-transparent text-[#f5c518]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || loading || !form.source_path}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-[#081018] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <HiOutlineCheckCircle className="h-5 w-5" />
                  {submitting ? "در حال ثبت..." : "ایجاد پیش‌نویس فیلم"}
                </button>

                <Link
                  href="/admin/content-management/movies"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  انصراف
                </Link>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
              <h3 className="text-lg font-bold text-white">جریان ذخیره‌سازی</h3>
              <p className="mt-2 text-sm leading-7 text-[#8ea4b3]">
                در این مرحله فقط source ثبت می‌شود و فیلم در وضعیت پیش‌نویس باقی می‌ماند. بعد از تکمیل پردازش،
                فرم پخش نهایی را جداگانه تکمیل می‌کنی.
              </p>

              <div className="mt-4 rounded-[28px] border border-[#f5c518]/20 bg-[#f5c518]/[0.06] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#f5c518]">
                  Output Path
                </p>
                <p className="mt-3 break-all text-sm font-semibold text-white">
                  {managedFolderPreview}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#dbe5ec]">
                <p className="font-semibold text-white">نتیجه</p>
                <p className="mt-2 text-xs leading-6 text-[#8ea4b3]">
                  وضعیت انتشار: پیش‌نویس
                  <br />
                  مسیر منبع: {form.source_path || "هنوز انتخاب نشده"}
                  <br />
                  خروجی HLS: {managedFolderPreview}\hls\master.m3u8
                </p>
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
              <h3 className="text-lg font-bold text-white">بعد از این مرحله</h3>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[#d8e4ea]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  1. فیلم ثبت و در حالت پیش‌نویس ذخیره می‌شود.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  2. پردازش HLS انجام می‌شود و خروجی آماده پخش می‌گردد.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  3. فرم پخش نهایی را جداگانه کامل می‌کنی و بعد فیلم را منتشر می‌کنی.
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <MediaPathPickerModal
        open={sourcePickerOpen}
        title="انتخاب فایل فیلم از روی سرور"
        kind="video"
        currentPath={form.source_path || undefined}
        onClose={() => setSourcePickerOpen(false)}
        onSelect={(file) => {
          setSourceSelection(file);
          handleChange("source_path", file.path);
        }}
      />

      <MediaPathPickerModal
        open={dubbedPickerOpen}
        title="انتخاب فایل دوبله از روی سرور"
        kind="dubbed"
        currentPath={form.dubbed_source_path || undefined}
        onClose={() => setDubbedPickerOpen(false)}
        onSelect={(file) => {
          setDubbedSelection(file);
          handleChange("dubbed_source_path", file.path);
        }}
      />

      <MediaPathPickerModal
        open={subtitlePickerOpen}
        title="انتخاب فایل زیرنویس از روی سرور"
        kind="subtitle"
        currentPath={form.subtitle_source_path || undefined}
        onClose={() => setSubtitlePickerOpen(false)}
        onSelect={(file) => {
          setSubtitleSelection(file);
          handleChange("subtitle_source_path", file.path);
        }}
      />

      <MediaPathPickerModal
        open={audioTrackPickerIndex !== null}
        title="انتخاب فایل صوت اضافه از روی سرور"
        kind="dubbed"
        currentPath={
          audioTrackPickerIndex !== null
            ? extraAudioTracks[audioTrackPickerIndex]?.source_path || undefined
            : undefined
        }
        onClose={() => setAudioTrackPickerIndex(null)}
        onSelect={(file) => {
          if (audioTrackPickerIndex === null) {
            return;
          }

          updateAudioTrack(audioTrackPickerIndex, "selection", file);
          updateAudioTrack(audioTrackPickerIndex, "source_path", file.path);
          setAudioTrackPickerIndex(null);
        }}
      />
    </>
  );
}
