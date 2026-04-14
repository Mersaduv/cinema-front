"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineChip,
  HiOutlineCheckCircle,
  HiOutlineChatAlt2,
  HiOutlineFolderOpen,
  HiOutlineGlobeAlt,
  HiOutlineHashtag,
  HiOutlineMenuAlt2,
  HiOutlineMinusCircle,
  HiOutlinePhotograph,
  HiOutlinePlusCircle,
  HiOutlineSparkles,
  HiOutlineTranslate,
  HiOutlineUserGroup,
  HiOutlineVideoCamera,
} from "react-icons/hi";
import AdminMultiSelect from "../../../../../components/admin/AdminMultiSelect";
import AdminSelect from "../../../../../components/admin/AdminSelect";
import MediaPathPickerModal from "../../../../../components/admin/MediaPathPickerModal";
import {
  adminMoviesService,
  type AdminMovie,
  type AdminMovieOptionsResponse,
  type MediaBrowserFileEntry,
} from "../../../../../lib/admin-movies";

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

const ageRatingOptions = [
  { value: "", label: "بدون درجه سنی", description: "در صورت نیاز بعداً تعیین می‌شود" },
  { value: "G", label: "G", description: "مناسب همه سنین" },
  { value: "PG", label: "PG", description: "تماشا با راهنمایی والدین" },
  { value: "PG-13", label: "PG-13", description: "مناسب 13 سال به بالا" },
  { value: "R", label: "R", description: "نیازمند محدودیت سنی" },
  { value: "18+", label: "18+", description: "ویژه بزرگسالان" },
];

type PublicationAudioTrackForm = {
  label: string;
  language: string;
  source_path: string;
  selection: MediaBrowserFileEntry | null;
};

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
  previewUrl,
  previewKind,
  buttonLabel,
  icon,
  onOpen,
}: {
  title: string;
  helper: string;
  value: string;
  file: MediaBrowserFileEntry | null;
  previewUrl: string | null;
  previewKind: "image" | "video";
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

      <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-[#071019] p-3">
        {previewUrl ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#02070c]">
            {previewKind === "image" ? (
              <img
                src={previewUrl}
                alt={title}
                className="h-64 w-full object-cover"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                preload="metadata"
                className="h-64 w-full bg-black object-cover"
              />
            )}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 text-center text-sm leading-7 text-[#7f94a1]">
            {value
              ? "برای این فایل پیش‌نمایش در دسترس نیست. فایل‌های داخل مسیر مدیا به‌صورت مستقیم قابل پیش‌نمایش هستند."
              : "هنوز فایلی انتخاب نشده است."}
          </div>
        )}

        <div>
          <p className="truncate text-sm font-semibold text-white">
            {value || "هنوز فایلی انتخاب نشده است."}
          </p>
          {file ? (
            <p className="mt-2 text-xs text-[#7f94a1]">
              {file.size_label} . {file.extension.toUpperCase()} .{" "}
              {formatDateTime(file.last_modified_at)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function MoviePublicationFormPage() {
  const params = useParams<{ movieId: string }>();
  const router = useRouter();
  const movieId = params.movieId;
  const [movie, setMovie] = useState<AdminMovie | null>(null);
  const [options, setOptions] = useState<AdminMovieOptionsResponse>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [posterSelection, setPosterSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [trailerSelection, setTrailerSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [dubbedSelection, setDubbedSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [subtitleSelection, setSubtitleSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [posterPickerOpen, setPosterPickerOpen] = useState(false);
  const [trailerPickerOpen, setTrailerPickerOpen] = useState(false);
  const [dubbedPickerOpen, setDubbedPickerOpen] = useState(false);
  const [subtitlePickerOpen, setSubtitlePickerOpen] = useState(false);
  const [audioTrackPickerIndex, setAudioTrackPickerIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    poster_path: "",
    trailer_path: "",
    has_dubbed_audio: false,
    dubbed_source_path: "",
    has_subtitle: false,
    subtitle_source_path: "",
    synopsis: "",
    age_rating: "",
    genre_ids: [] as number[],
    country_ids: [] as number[],
    language_ids: [] as number[],
    tag_ids: [] as number[],
    actor_ids: [] as number[],
  });
  const [extraAudioTracks, setExtraAudioTracks] = useState<PublicationAudioTrackForm[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      const [movieResponse, optionsResponse] = await Promise.all([
        adminMoviesService.show(movieId),
        adminMoviesService.options(),
      ]);

      if (movieResponse.success && movieResponse.data) {
        const nextMovie = movieResponse.data.movie;
        setMovie(nextMovie);
        setForm({
          title: nextMovie.title || nextMovie.original_title || "",
          poster_path: nextMovie.poster_path || "",
          trailer_path: nextMovie.trailer_path || "",
          has_dubbed_audio: nextMovie.has_dubbed_audio || false,
          dubbed_source_path: nextMovie.dubbed_source_path || "",
          has_subtitle: nextMovie.has_subtitle || false,
          subtitle_source_path: nextMovie.subtitle_source_path || "",
          synopsis: nextMovie.synopsis || "",
          age_rating: nextMovie.age_rating || "",
          genre_ids: nextMovie.taxonomies.genres.map((item) => item.id),
          country_ids: nextMovie.taxonomies.countries.map((item) => item.id),
          language_ids: nextMovie.taxonomies.languages.map((item) => item.id),
          tag_ids: nextMovie.taxonomies.tags.map((item) => item.id),
          actor_ids: nextMovie.taxonomies.actors.map((item) => item.id),
        });
        setExtraAudioTracks(
          (nextMovie.audio_tracks || []).map((track, index) => ({
            label: track.label || `صوت ${index + 2}`,
            language: track.language || "und",
            source_path: track.source_path || "",
            selection: track.source_path
              ? {
                  name: track.source_path.split(/[\\/]/).pop() || `track-${index + 2}`,
                  path: track.source_path,
                  extension: (track.source_path.split(".").pop() || "").toLowerCase(),
                  size_bytes: 0,
                  size_label: "",
                  last_modified_at: null,
                  is_supported: true,
                  public_url: track.source_url || null,
                }
              : null,
          }))
        );
      } else {
        setError(movieResponse.message || "دریافت اطلاعات فیلم انجام نشد.");
      }

      if (optionsResponse.success && optionsResponse.data) {
        setOptions(optionsResponse.data);
      }

      setLoading(false);
    };

    if (movieId) {
      void loadData();
    }
  }, [movieId]);

  const handleChange = (
    field: keyof typeof form,
    value: string | number[]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const genreOptions = useMemo(
    () =>
      options.taxonomies.genres.map((item) => ({
        value: item.id,
        label: item.name,
        description: `/${item.slug}`,
      })),
    [options.taxonomies.genres]
  );

  const countryOptions = useMemo(
    () =>
      options.taxonomies.countries.map((item) => ({
        value: item.id,
        label: item.name,
        description: `/${item.slug}`,
      })),
    [options.taxonomies.countries]
  );

  const languageOptions = useMemo(
    () =>
      options.taxonomies.languages.map((item) => ({
        value: item.id,
        label: item.name,
        description: `/${item.slug}`,
      })),
    [options.taxonomies.languages]
  );

  const tagOptions = useMemo(
    () =>
      options.taxonomies.tags.map((item) => ({
        value: item.id,
        label: item.name,
        description: `/${item.slug}`,
      })),
    [options.taxonomies.tags]
  );

  const actorOptions = useMemo(
    () =>
      options.taxonomies.actors.map((item) => ({
        value: item.id,
        label: item.name,
        description: `/${item.slug}`,
        imageUrl: item.image_url,
      })),
    [options.taxonomies.actors]
  );

  const posterPreviewUrl =
    posterSelection?.public_url || movie?.poster_url || null;
  const trailerPreviewUrl =
    trailerSelection?.public_url || movie?.trailer_url || null;
  const dubbedPreviewUrl = dubbedSelection?.public_url || movie?.dubbed_source_url || null;

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
    value: string | MediaBrowserFileEntry | null,
  ) => {
    setExtraAudioTracks((current) =>
      current.map((track, trackIndex) =>
        trackIndex === index
          ? {
              ...track,
              [field]: value,
            }
          : track,
      ),
    );
  };

  const removeAudioTrack = (index: number) => {
    setExtraAudioTracks((current) =>
      current.filter((_, trackIndex) => trackIndex !== index),
    );

    if (audioTrackPickerIndex === index) {
      setAudioTrackPickerIndex(null);
    }
  };

  const buildPublicationPayload = () => ({
    title: form.title.trim(),
    poster_path: form.poster_path.trim() || undefined,
    trailer_path: form.trailer_path.trim() || undefined,
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
    synopsis: form.synopsis.trim() || undefined,
    age_rating: form.age_rating || undefined,
    genre_ids: form.genre_ids,
    country_ids: form.country_ids,
    language_ids: form.language_ids,
    tag_ids: form.tag_ids,
    actor_ids: form.actor_ids,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!movie) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const saveResponse = await adminMoviesService.updatePublicationForm(
      movieId,
      buildPublicationPayload()
    );

    if (!(saveResponse.success && saveResponse.data)) {
      const firstError = saveResponse.errors
        ? Object.values(saveResponse.errors)[0]?.[0]
        : undefined;

      setError(firstError || saveResponse.message || "ذخیره اطلاعات انتشار انجام نشد.");
      setSubmitting(false);
      return;
    }

    setMovie(saveResponse.data.movie);

    const publishResponse = await adminMoviesService.updatePublishStatus(
      saveResponse.data.movie.id,
      "published"
    );

    if (publishResponse.success && publishResponse.data) {
      setMovie(publishResponse.data.movie);
      setSuccessMessage("اطلاعات فیلم ثبت شد و انتشار نهایی با موفقیت انجام شد.");
      router.push(`/admin/content-management/movies/${saveResponse.data.movie.id}`);
      router.refresh();
    } else {
      setError(publishResponse.message || "انتشار نهایی فیلم انجام نشد.");
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-[34px] border border-white/10 bg-white/[0.03]" />
        <div className="h-80 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.03]" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="rounded-[32px] border border-[#fb7185]/25 bg-[#fb7185]/10 px-6 py-8 text-[#fecdd3]">
        {error || "فیلم پیدا نشد."}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,24,0.12),rgba(8,16,24,0.96)_42%,rgba(56,189,248,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs text-[#f8d977]">
                <HiOutlineSparkles className="h-4 w-4" />
                فرم پخش نهایی
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
                تکمیل اطلاعات نمایش و انتشار
              </h2>
              <p className="mt-5 text-base leading-8 text-[#dde7ed] md:text-lg">
                این مرحله برای تکمیل اطلاعات نمایشی فیلم است. بعد از ثبت این فرم،
                همان لحظه انتشار نهایی هم انجام می‌شود.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(`/admin/content-management/movies/${movie.id}`)
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              بازگشت به جزئیات
              <HiOutlineArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="flex items-center gap-2 rounded-2xl border border-[#34d399]/25 bg-[#34d399]/10 px-4 py-3 text-sm text-[#86efac]">
            <HiOutlineCheckCircle className="h-5 w-5" />
            {successMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <SelectedServerFileCard
                  title="پوستر فیلم"
                  helper="بعد از انتخاب، پیش‌نمایش پوستر همین‌جا نمایش داده می‌شود."
                  value={form.poster_path}
                  file={posterSelection}
                  previewUrl={posterPreviewUrl}
                  previewKind="image"
                  buttonLabel="انتخاب پوستر"
                  icon={<HiOutlinePhotograph className="h-5 w-5" />}
                  onOpen={() => setPosterPickerOpen(true)}
                />

                <SelectedServerFileCard
                  title="تریلر فیلم"
                  helper="اگر فایل داخل مسیر مدیا باشد، ویدئوی پیش‌نمایش همین‌جا دیده می‌شود."
                  value={form.trailer_path}
                  file={trailerSelection}
                  previewUrl={trailerPreviewUrl}
                  previewKind="video"
                  buttonLabel="انتخاب تریلر"
                  icon={<HiOutlineVideoCamera className="h-5 w-5" />}
                  onOpen={() => setTrailerPickerOpen(true)}
                />

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">نسخه دوبله / فایل دو زبانه</p>
                      <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                        اگر نسخه جدا برای صدای دوبله داری، فعالش کن تا در پلیر مثل track جداگانه قابل انتخاب شود.
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
                        title="فایل دوبله"
                        helper="می‌تواند فایل ویدئویی یا صوتی جداگانه باشد. سیستم از آن track صدای دوبله می‌سازد."
                        value={form.dubbed_source_path}
                        file={dubbedSelection}
                        previewUrl={dubbedPreviewUrl}
                        previewKind="video"
                        buttonLabel="انتخاب فایل دوبله"
                        icon={<HiOutlineChip className="h-5 w-5" />}
                        onOpen={() => setDubbedPickerOpen(true)}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">صوت‌های اضافه</p>
                      <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                        اگر نسخه دوم یا سوم صدا داری، اینجا اضافه کن تا در پلیر مثل سرویس‌های مدیا قابل انتخاب شود.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addAudioTrack}
                      className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-4 py-2 text-sm text-[#cbeeff] transition hover:border-[#38bdf8]/40 hover:bg-[#38bdf8]/15"
                    >
                      <HiOutlinePlusCircle className="h-5 w-5" />
                      افزودن صوت
                    </button>
                  </div>

                  {extraAudioTracks.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {extraAudioTracks.map((track, index) => (
                        <div
                          key={`${index}-${track.source_path || track.label}`}
                          className="rounded-3xl border border-white/10 bg-[#071019] p-4"
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                صوت اضافه {index + 2}
                              </p>
                              <p className="mt-1 text-xs text-[#8ea4b3]">
                                نامی که در پلیر دیده می‌شود را اینجا مشخص کن.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeAudioTrack(index)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-3 py-2 text-xs text-[#fecdd3] transition hover:border-[#fb7185]/40 hover:bg-[#fb7185]/15"
                            >
                              <HiOutlineMinusCircle className="h-4 w-4" />
                              حذف
                            </button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="block">
                              <span className="mb-2 block text-sm text-[#8ea4b3]">عنوان صوت</span>
                              <input
                                value={track.label}
                                onChange={(event) =>
                                  updateAudioTrack(index, "label", event.target.value)
                                }
                                placeholder={`مثلاً دوبله فارسی ${index + 2}`}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#38bdf8]/45"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-sm text-[#8ea4b3]">کد زبان</span>
                              <input
                                value={track.language}
                                onChange={(event) =>
                                  updateAudioTrack(index, "language", event.target.value)
                                }
                                placeholder="fa / en / hi"
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#38bdf8]/45"
                              />
                            </label>
                          </div>

                          <div className="mt-4">
                            <SelectedServerFileCard
                              title="فایل صوت اضافه"
                              helper="می‌تواند فایل صوتی مستقل یا نسخه ویدئویی دارای همان زبان باشد."
                              value={track.source_path}
                              file={track.selection}
                              previewUrl={track.selection?.public_url || null}
                              previewKind="video"
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
                      هنوز صوت اضافه‌ای ثبت نشده است.
                    </div>
                  )}
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">زیرنویس</p>
                      <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                        اگر فایل منبع زیرنویس داخلی دارد، فقط این گزینه را فعال کن. در صورت داشتن فایل جدا، آن را هم انتخاب کن.
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
                        helper="اختیاری است. اگر خالی بماند، سیستم تلاش می‌کند از زیرنویس داخلی فایل منبع استفاده کند."
                        value={form.subtitle_source_path}
                        file={subtitleSelection}
                        previewUrl={null}
                        previewKind="video"
                        buttonLabel="انتخاب فایل زیرنویس"
                        icon={<HiOutlineChatAlt2 className="h-5 w-5" />}
                        onOpen={() => setSubtitlePickerOpen(true)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">
                  عنوان فیلم برای نمایش
                </span>
                <input
                  value={form.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  placeholder="عنوان نمایشی فیلم"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                  required
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                    <HiOutlineMenuAlt2 className="h-4 w-4" />
                    ژانرها
                  </span>
                  <AdminMultiSelect
                    value={form.genre_ids}
                    onChange={(value) => handleChange("genre_ids", value)}
                    options={genreOptions}
                    placeholder="انتخاب ژانرها"
                    emptyLabel="ابتدا در بخش طبقه‌بندی‌ها ژانر ثبت کن."
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                    <HiOutlineGlobeAlt className="h-4 w-4" />
                    کشورها
                  </span>
                  <AdminMultiSelect
                    value={form.country_ids}
                    onChange={(value) => handleChange("country_ids", value)}
                    options={countryOptions}
                    placeholder="انتخاب کشورها"
                    emptyLabel="ابتدا در بخش طبقه‌بندی‌ها کشور ثبت کن."
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                    <HiOutlineTranslate className="h-4 w-4" />
                    زبان‌ها
                  </span>
                  <AdminMultiSelect
                    value={form.language_ids}
                    onChange={(value) => handleChange("language_ids", value)}
                    options={languageOptions}
                    placeholder="انتخاب زبان‌ها"
                    emptyLabel="ابتدا در بخش طبقه‌بندی‌ها زبان ثبت کن."
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                    <HiOutlineHashtag className="h-4 w-4" />
                    تگ‌ها
                  </span>
                  <AdminMultiSelect
                    value={form.tag_ids}
                    onChange={(value) => handleChange("tag_ids", value)}
                    options={tagOptions}
                    placeholder="انتخاب تگ‌ها"
                    emptyLabel="ابتدا در بخش طبقه‌بندی‌ها تگ ثبت کن."
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm text-[#8ea4b3]">
                    <HiOutlineUserGroup className="h-4 w-4" />
                    بازیگران
                  </span>
                  <AdminMultiSelect
                    value={form.actor_ids}
                    onChange={(value) => handleChange("actor_ids", value)}
                    options={actorOptions}
                    placeholder="انتخاب بازیگران"
                    emptyLabel="ابتدا در بخش طبقه‌بندی‌ها بازیگر ثبت کن."
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">
                    درجه سنی
                  </span>
                  <AdminSelect
                    value={form.age_rating}
                    onChange={(value) => handleChange("age_rating", value)}
                    options={ageRatingOptions}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">خلاصه</span>
                <textarea
                  value={form.synopsis}
                  onChange={(event) => handleChange("synopsis", event.target.value)}
                  rows={6}
                  placeholder="خلاصه نهایی برای نمایش در سایت"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white placeholder:text-[#728896] outline-none transition focus:border-[#f5c518]/45"
                />
              </label>

              <button
                type="submit"
                disabled={submitting || movie.processing_status !== "ready"}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-[#081018] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HiOutlineSparkles className="h-5 w-5" />
                {submitting ? "در حال ثبت و انتشار..." : "ثبت و انتشار"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
              <h3 className="text-lg font-bold text-white">وضعیت فعلی</h3>
              <div className="mt-4 space-y-3 text-sm text-[#dbe5ec]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">عنوان اصلی</p>
                  <p className="mt-2 font-semibold text-white">
                    {movie.original_title || "ثبت نشده"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">وضعیت پردازش</p>
                  <p className="mt-2 font-semibold text-white">
                    {movie.processing_status === "ready"
                      ? "آماده پخش"
                      : movie.processing_status === "processing"
                        ? "در حال پردازش"
                        : movie.processing_status === "queued"
                          ? "در صف"
                          : movie.processing_status === "failed"
                            ? "خطا"
                            : "ثبت شده"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">وضعیت انتشار</p>
                  <p className="mt-2 font-semibold text-white">
                    {movie.publish_status === "published" ? "منتشر شده" : "پیش نویس"}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <MediaPathPickerModal
        open={posterPickerOpen}
        title="انتخاب پوستر از روی سرور"
        kind="image"
        currentPath={form.poster_path || undefined}
        onClose={() => setPosterPickerOpen(false)}
        onSelect={(file) => {
          setPosterSelection(file);
          handleChange("poster_path", file.path);
        }}
      />

      <MediaPathPickerModal
        open={trailerPickerOpen}
        title="انتخاب تریلر از روی سرور"
        kind="video"
        currentPath={form.trailer_path || undefined}
        onClose={() => setTrailerPickerOpen(false)}
        onSelect={(file) => {
          setTrailerSelection(file);
          handleChange("trailer_path", file.path);
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
