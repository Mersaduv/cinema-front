"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ActorFilmographyRow from "../../components/actors/ActorFilmographyRow";
import ActorHeroSection from "../../components/actors/ActorHeroSection";
import { toCatalogItem } from "../../lib/catalog/rest";
import { personsService, type PersonDetail } from "../../lib/persons";

function ActorPageSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <div className="relative overflow-hidden bg-black pt-28 md:pt-32">
        <div className="absolute inset-0 animate-pulse bg-white/5" />
        <div className="relative mx-auto flex max-w-[1820px] flex-col gap-8 px-4 pb-10 md:flex-row md:px-7 md:pb-14">
          <div className="mx-auto aspect-[2/3] w-full max-w-[280px] animate-pulse rounded-2xl bg-white/10 md:mx-0" />
          <div className="flex-1 space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded-xl bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-white/8" />
              <div className="h-4 w-full animate-pulse rounded bg-white/8" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-white/8" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-white/8" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1820px] space-y-10 px-4 py-10 md:px-7">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`actor-skeleton-poster-${index}`}
              className="aspect-[2/3] w-[160px] shrink-0 animate-pulse rounded-xl bg-white/10"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ActorProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!slug) {
        return;
      }

      setLoading(true);
      setError("");

      const response = await personsService.fetchBySlug(slug);

      if (!(response.success && response.data?.person)) {
        setError(response.message || "اطلاعات یافت نشد.");
        setPerson(null);
      } else {
        setPerson(response.data.person);
      }

      setLoading(false);
    };

    void run();
  }, [slug]);

  if (loading) {
    return <ActorPageSkeleton />;
  }

  if (error || !person) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-center text-red-300">
        {error || "صفحه یافت نشد."}
      </div>
    );
  }

  const movies = person.cast_in_movies.map((row) =>
    toCatalogItem(row as unknown as Record<string, unknown>, "has_dubbed_audio"),
  );

  const series = person.cast_in_series.map((row) =>
    toCatalogItem(row as unknown as Record<string, unknown>, "has_dubbed"),
  );

  const hasWork = movies.length > 0 || series.length > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <ActorHeroSection
        name={person.name}
        biography={person.biography}
        profileUrl={person.profile_url}
        profileImage={person.profile_image}
      />

      <div className="mx-auto max-w-[1820px] space-y-12 px-4 pb-16 pt-4 md:px-7 md:pb-20">
        {movies.length > 0 ? (
          <ActorFilmographyRow title={`فیلم های ${person.name}`} items={movies} kind="movie" />
        ) : null}

        {series.length > 0 ? (
          <ActorFilmographyRow title={`سریال های ${person.name}`} items={series} kind="series" />
        ) : null}

        {!hasWork ? (
          <p className="text-center text-sm text-white/50">
            هنوز فیلم یا سریالی برای این بازیگر در سایت ثبت نشده است.
          </p>
        ) : null}
      </div>
    </div>
  );
}
