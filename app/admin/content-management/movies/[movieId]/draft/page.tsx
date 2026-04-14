"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineChip,
  HiOutlineChatAlt2,
  HiOutlineFolderOpen,
  HiOutlineGlobeAlt,
  HiOutlineHashtag,
  HiOutlineMenuAlt2,
  HiOutlineMinusCircle,
  HiOutlinePhotograph,
  HiOutlinePencilAlt,
  HiOutlinePlusCircle,
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
  type UpdateAdminMovieDraftPayload,
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
  previewUrl?: string | null;
  previewKind?: "image" | "video";
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
        {previewUrl && previewKind ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#02070c]">
            {previewKind === "image" ? (
              <img src={previewUrl} alt={title} className="h-64 w-full object-cover" />
            ) : (
              <video
                src={previewUrl}
                controls
                preload="metadata"
                className="h-64 w-full bg-black object-cover"
              />
            )}
          </div>
        ) : null}

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

export default function EditDraftMoviePage() {
  const params = useParams<{ movieId: string }>();
  const router = useRouter();
  const movieId = params.movieId;
  const [movie, setMovie] = useState<AdminMovie | null>(null);
  const [options, setOptions] = useState<AdminMovieOptionsResponse>(emptyOptions);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sourceSelection, setSourceSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [posterSelection, setPosterSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [trailerSelection, setTrailerSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [dubbedSelection, setDubbedSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [subtitleSelection, setSubtitleSelection] = useState<MediaBrowserFileEntry | null>(null);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [posterPickerOpen, setPosterPickerOpen] = useState(false);
  const [trailerPickerOpen, setTrailerPickerOpen] = useState(false);
  const [dubbedPickerOpen, setDubbedPickerOpen] = useState(false);
  const [subtitlePickerOpen, setSubtitlePickerOpen] = useState(false);
  const [audioTrackPickerIndex, setAudioTrackPickerIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    original_title: "",
    title: "",
    slug: "",
    release_year: "",
    provider_name: "",
    source_path: "",
    selected_hls_profiles: [] as string[],
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
  const [extraAudioTracks, setExtraAudioTracks] = useState<ExtraAudioTrackForm[]>([]);

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
          original_title: nextMovie.original_title || nextMovie.title || "",
          title: nextMovie.title || "",
          slug: nextMovie.slug || "",
          release_year: nextMovie.release_year ? String(nextMovie.release_year) : "",
          provider_name: nextMovie.provider_name || "",
          source_path: nextMovie.media_asset?.source_path || "",
          selected_hls_profiles:
            nextMovie.media_asset?.selected_hls_profiles.length
              ? nextMovie.media_asset.selected_hls_profiles
              : optionsResponse.success && optionsResponse.data
                ? optionsResponse.data.hls_profiles.map((profile) => profile.key)
                : [],
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

  const handleProfileToggle = (profileKey: string) => {
    if (movie?.processing_status === "ready") {
      return;
    }

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

  const resolvedSlug = useMemo(
    () => slugify(form.slug || form.original_title),
    [form.slug, form.original_title]
  );

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const payload: UpdateAdminMovieDraftPayload = {
      original_title: form.original_title.trim(),
      title: form.title.trim(),
      slug: resolvedSlug,
      release_year: form.release_year ? Number(form.release_year) : null,
      provider_name: form.provider_name.trim() || undefined,
      source_path: form.source_path.trim(),
      selected_hls_profiles: form.selected_hls_profiles,
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
    };

    const response = await adminMoviesService.updateDraftForm(movieId, payload);

    if (response.success && response.data) {
      setMovie(response.data.movie);
      setSuccessMessage("تغییرات پیش‌نویس با موفقیت ذخیره شد.");
      router.push(`/admin/content-management/movies/${response.data.movie.id}`);
      router.refresh();
    } else {
      const firstError = response.errors
        ? Object.values(response.errors)[0]?.[0]
        : undefined;

      setError(firstError || response.message || "ذخیره پیش‌نویس انجام نشد.");
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
        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(140deg,rgba(56,189,248,0.14),rgba(8,16,24,0.96)_40%,rgba(245,197,24,0.14))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/25 bg-[#38bdf8]/10 px-3 py-1 text-xs text-[#7dd3fc]">
                <HiOutlinePencilAlt className="h-4 w-4" />
                ویرایش پیش‌نویس
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white md:text-5xl">
                ویرایش کامل اطلاعات فیلم
              </h2>
              <p className="mt-5 text-base leading-8 text-[#dce8ef] md:text-lg">
                از این فرم می‌توانی اطلاعات پایه، فایل منبع، پوستر، تریلر و
                طبقه‌بندی‌های فیلم را یک‌جا ویرایش کنی.
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

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">عنوان اصلی فیلم</span>
                  <input
                    value={form.original_title}
                    onChange={(event) => handleChange("original_title", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">عنوان برای نمایش</span>
                  <input
                    value={form.title}
                    onChange={(event) => handleChange("title", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">slug</span>
                  <input
                    value={form.slug}
                    onChange={(event) => handleChange("slug", event.target.value)}
                    placeholder={resolvedSlug || "movie-slug"}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-[#8ea4b3]">سال انتشار</span>
                  <input
                    type="number"
                    min="1888"
                    max="2100"
                    value={form.release_year}
                    onChange={(event) => handleChange("release_year", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm text-[#8ea4b3]">منبع فایل / تامین‌کننده محتوا</span>
                <input
                  value={form.provider_name}
                  onChange={(event) => handleChange("provider_name", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45"
                />
              </label>

              <SelectedServerFileCard
                title="فایل منبع فیلم"
                helper="می‌توانی فایل منبع را به مسیر دیگری تغییر بدهی. خروجی مدیریت‌شده همچنان داخل media باقی می‌ماند."
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
                      این بخش برای assetهای فنی قبل از پردازش است تا پلیر بعداً ترک دوبله را درست نمایش دهد.
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
                      helper="می‌تواند فایل صوتی مستقل یا نسخه‌ای باشد که صدای دوبله در آن وجود دارد."
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
                        برای زبان دوم یا سوم، هر فایل را با عنوان و کد زبان خودش ثبت کن.
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
                      هنوز صوت اضافه‌ای ثبت نشده است.
                    </div>
                  )}
                </div>
              ) : null}

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071019] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">فایل زیرنویس</p>
                    <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                      اگر زیرنویس خارجی داری، اینجا ثبتش کن تا همراه پردازش به manifest وصل شود.
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

              {movie.processing_status !== "ready" ? (
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">کیفیت‌های پردازش</p>
                    <p className="mt-1 text-xs leading-6 text-[#8ea4b3]">
                      چون این مدیا هنوز کامل پردازش نشده، می‌توانی کیفیت‌های خروجی HLS را از همین‌جا تنظیم کنی.
                    </p>
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
                              {profile.resolution} . {(profile.bandwidth / 1000).toFixed(0)} kbps
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

              <div className="space-y-5">
                <SelectedServerFileCard
                  title="پوستر فیلم"
                  helper="پوستر انتخاب‌شده برای کارت‌ها و صفحه جزئیات استفاده می‌شود."
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
                  helper="در صورت نیاز تریلر را هم از روی سرور انتخاب کن."
                  value={form.trailer_path}
                  file={trailerSelection}
                  previewUrl={trailerPreviewUrl}
                  previewKind="video"
                  buttonLabel="انتخاب تریلر"
                  icon={<HiOutlineVideoCamera className="h-5 w-5" />}
                  onOpen={() => setTrailerPickerOpen(true)}
                />
              </div>

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
                  <span className="mb-2 block text-sm text-[#8ea4b3]">درجه سنی</span>
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-[#f5c518]/45"
                />
              </label>

              <button
                type="submit"
                disabled={submitting || !form.source_path || !resolvedSlug}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f5c518] px-5 py-3 text-sm font-semibold text-[#081018] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HiOutlineCheckCircle className="h-5 w-5" />
                {submitting ? "در حال ذخیره..." : "ذخیره تغییرات پیش‌نویس"}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-[#0b1720] p-6">
              <h3 className="text-lg font-bold text-white">خروجی مدیریت‌شده</h3>
              <div className="mt-4 space-y-3 text-sm text-[#dbe5ec]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">مسیر نهایی</p>
                  <p className="mt-2 break-all font-semibold text-white">
                    {options.media_root}\\movies\\{resolvedSlug || "movie-slug"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">وضعیت پردازش</p>
                  <p className="mt-2 font-semibold text-white">
                    {movie.processing_status}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-[#8ea4b3]">انتشار فعلی</p>
                  <p className="mt-2 font-semibold text-white">
                    {movie.publish_status}
                  </p>
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
