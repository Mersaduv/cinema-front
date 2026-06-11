"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiArrowDown,
  HiArrowUp,
  HiOutlineSearch,
  HiOutlineTrash,
} from "react-icons/hi";
import { PosterImage } from "../../../../components/images";
import { adminApiErrorMessage } from "../../../../lib/admin-api";
import { adminMoviesService } from "../../../../lib/admin-movies";
import {
  adminCollectionsService,
  type AdminCollection,
  type AdminCollectionMovie,
  type AdminCollectionPayload,
} from "../../../../lib/admin-collections";

type FormState = {
  name: string;
  slug: string;
  tmdb_collection_id: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  is_visible: boolean;
  sort_order: string;
  movies: AdminCollectionMovie[];
};

function toFormState(collection?: AdminCollection | null): FormState {
  return {
    name: collection?.name ?? "",
    slug: collection?.slug ?? "",
    tmdb_collection_id: collection?.tmdb_collection_id
      ? String(collection.tmdb_collection_id)
      : "",
    description: collection?.description ?? "",
    poster_url: collection?.poster_url ?? "",
    backdrop_url: collection?.backdrop_url ?? "",
    is_visible: collection?.is_visible ?? true,
    sort_order: String(collection?.sort_order ?? 0),
    movies: collection?.movies ?? [],
  };
}

export default function CollectionEditorForm({
  mode,
  collectionId,
  initialCollection,
}: {
  mode: "create" | "edit";
  collectionId?: number;
  initialCollection?: AdminCollection | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialCollection));
  const [loadingCollection, setLoadingCollection] = useState(
    mode === "edit" && !initialCollection,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [movieSearch, setMovieSearch] = useState("");
  const [movieResults, setMovieResults] = useState<AdminCollectionMovie[]>([]);
  const [searchingMovies, setSearchingMovies] = useState(false);
  const [tmdbLoading, setTmdbLoading] = useState(false);

  useEffect(() => {
    if (initialCollection) {
      setForm(toFormState(initialCollection));
    }
  }, [initialCollection]);

  useEffect(() => {
    if (mode !== "edit" || !collectionId || initialCollection) return;

    let cancelled = false;
    setLoadingCollection(true);

    void adminCollectionsService.show(collectionId).then((response) => {
      if (cancelled) return;
      if (response.success && response.data?.collection) {
        setForm(toFormState(response.data.collection));
      } else {
        setError(adminApiErrorMessage(response, "دریافت مجموعه انجام نشد."));
      }
      setLoadingCollection(false);
    });

    return () => {
      cancelled = true;
    };
  }, [mode, collectionId, initialCollection]);

  const payload = useMemo<AdminCollectionPayload>(
    () => ({
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      tmdb_collection_id: form.tmdb_collection_id
        ? Number(form.tmdb_collection_id)
        : null,
      description: form.description.trim() || null,
      poster_url: form.poster_url.trim() || null,
      backdrop_url: form.backdrop_url.trim() || null,
      is_visible: form.is_visible,
      sort_order: Number(form.sort_order) || 0,
      movies: form.movies.map((movie, index) => ({
        id: movie.id,
        sort_order: index,
      })),
    }),
    [form],
  );

  const searchMovies = useCallback(async () => {
    const query = movieSearch.trim();
    if (!query) {
      setMovieResults([]);
      return;
    }

    setSearchingMovies(true);
    try {
      const response = await adminMoviesService.list({ search: query, page: 1 });
      if (response.success && response.data?.movies) {
        setMovieResults(
          response.data.movies.map((movie) => ({
            id: movie.id,
            title: movie.title,
            slug: movie.slug,
            synopsis: movie.synopsis ?? null,
            release_year: movie.release_year ?? null,
            poster_url: movie.poster_url ?? null,
            details: { genres: [] },
          })),
        );
      } else {
        setMovieResults([]);
      }
    } finally {
      setSearchingMovies(false);
    }
  }, [movieSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchMovies();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchMovies]);

  const addMovie = (movie: AdminCollectionMovie) => {
    if (form.movies.some((item) => item.id === movie.id)) return;
    setForm((current) => ({ ...current, movies: [...current.movies, movie] }));
  };

  const removeMovie = (movieId: number) => {
    setForm((current) => ({
      ...current,
      movies: current.movies.filter((item) => item.id !== movieId),
    }));
  };

  const moveMovie = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const next = [...current.movies];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, movies: next };
    });
  };

  const fetchFromTmdb = async () => {
    const tmdbId = Number(form.tmdb_collection_id);
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      setError("شناسه TMDB مجموعه را وارد کنید.");
      return;
    }

    setTmdbLoading(true);
    setError("");
    try {
      const response = await adminCollectionsService.fetchTmdb(tmdbId);
      if (!response.success || !response.data?.collection) {
        setError(adminApiErrorMessage(response, "دریافت مجموعه از TMDB انجام نشد."));
        return;
      }

      const data = response.data.collection;
      setForm((current) => ({
        ...current,
        name: data.name || current.name,
        description: data.description ?? current.description,
        poster_url: data.poster_url ?? current.poster_url,
        backdrop_url: data.backdrop_url ?? current.backdrop_url,
      }));
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response =
        mode === "create"
          ? await adminCollectionsService.create(payload)
          : await adminCollectionsService.update(collectionId as number, payload);

      if (!response.success || !response.data?.collection) {
        setError(adminApiErrorMessage(response, "ذخیره مجموعه انجام نشد."));
        return;
      }

      router.push(`/admin/content-management/collections/${response.data.collection.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loadingCollection) {
    return (
      <div className="h-36 animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">
            {mode === "create" ? "افزودن مجموعه" : "ویرایش مجموعه"}
          </h1>
          <p className="mt-2 text-sm text-white/55">
            مدیریت نام، تصاویر، نمایش عمومی و فیلم‌های عضو مجموعه
          </p>
        </div>
        <Link
          href="/admin/content-management/collections"
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5"
        >
          بازگشت به فهرست
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 px-4 py-3 text-sm text-[#fecdd3]">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-white/70">نام مجموعه</span>
          <input
            value={form.name}
            onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-white outline-none focus:border-[#f5c518]/50"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white/70">اسلاگ</span>
          <input
            value={form.slug}
            onChange={(event) => setForm((c) => ({ ...c, slug: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-white outline-none focus:border-[#f5c518]/50"
            placeholder="خالی = خودکار"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white/70">شناسه TMDB Collection</span>
          <div className="flex gap-2">
            <input
              value={form.tmdb_collection_id}
              onChange={(event) =>
                setForm((c) => ({ ...c, tmdb_collection_id: event.target.value }))
              }
              className="w-full rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-white outline-none focus:border-[#f5c518]/50"
            />
            <button
              type="button"
              onClick={() => void fetchFromTmdb()}
              disabled={tmdbLoading}
              className="shrink-0 rounded-2xl bg-[#f5c518] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {tmdbLoading ? "..." : "TMDB"}
            </button>
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white/70">ترتیب نمایش</span>
          <input
            type="number"
            value={form.sort_order}
            onChange={(event) => setForm((c) => ({ ...c, sort_order: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-white outline-none focus:border-[#f5c518]/50"
          />
        </label>

        <label className="block space-y-2 lg:col-span-2">
          <span className="text-sm text-white/70">توضیحات</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-white outline-none focus:border-[#f5c518]/50"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white/70">پوستر</span>
          <input
            value={form.poster_url}
            onChange={(event) => setForm((c) => ({ ...c, poster_url: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-white outline-none focus:border-[#f5c518]/50"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-white/70">بک‌دراپ</span>
          <input
            value={form.backdrop_url}
            onChange={(event) => setForm((c) => ({ ...c, backdrop_url: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-white outline-none focus:border-[#f5c518]/50"
          />
        </label>

        <label className="flex items-center gap-3 lg:col-span-2">
          <input
            type="checkbox"
            checked={form.is_visible}
            onChange={(event) => setForm((c) => ({ ...c, is_visible: event.target.checked }))}
            className="h-4 w-4 rounded border-white/20"
          />
          <span className="text-sm text-white/75">نمایش در سایت عمومی</span>
        </label>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-bold text-white">فیلم‌های مجموعه</h2>
        <p className="mt-1 text-sm text-white/50">جستجو کنید و فیلم‌ها را اضافه یا مرتب کنید.</p>

        <div className="relative mt-5">
          <HiOutlineSearch className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
          <input
            value={movieSearch}
            onChange={(event) => setMovieSearch(event.target.value)}
            placeholder="جستجوی فیلم برای افزودن..."
            className="w-full rounded-2xl border border-white/10 bg-[#0b1018] py-3 pr-12 pl-4 text-white outline-none focus:border-[#f5c518]/50"
          />
        </div>

        {searchingMovies ? (
          <p className="mt-3 text-sm text-white/45">در حال جستجو...</p>
        ) : null}

        {movieResults.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {movieResults.map((movie) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => addMovie(movie)}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1018] p-3 text-right transition hover:border-[#f5c518]/30"
              >
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-[#12161f]">
                  <PosterImage title={movie.title} src={movie.poster_url} usage="poster-card" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{movie.title}</p>
                  <p className="text-xs text-white/45">{movie.release_year ?? "—"}</p>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {form.movies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/45">
              هنوز فیلمی اضافه نشده است.
            </div>
          ) : (
            form.movies.map((movie, index) => (
              <div
                key={movie.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1018] p-3"
              >
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[#12161f]">
                  <PosterImage title={movie.title} src={movie.poster_url} usage="poster-card" />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="font-semibold text-white">{movie.title}</p>
                  <p className="text-xs text-white/45">
                    {movie.release_year ?? "—"} · ترتیب {index + 1}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveMovie(index, -1)}
                    className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5"
                    aria-label="بالا"
                  >
                    <HiArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMovie(index, 1)}
                    className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5"
                    aria-label="پایین"
                  >
                    <HiArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMovie(movie.id)}
                    className="rounded-lg border border-[#fb7185]/20 p-2 text-[#fda4af] hover:bg-[#fb7185]/10"
                    aria-label="حذف"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[#ef4444] px-6 py-3 text-sm font-bold text-white hover:bg-[#dc2626] disabled:opacity-50"
        >
          {saving ? "در حال ذخیره..." : mode === "create" ? "ایجاد مجموعه" : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}
