"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { personsService, type PersonDetail } from "../../lib/persons";

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
      const res = await personsService.fetchBySlug(slug);
      if (!(res.success && res.data?.person)) {
        setError(res.message || "اطلاعات یافت نشد.");
        setPerson(null);
      } else {
        setPerson(res.data.person);
      }
      setLoading(false);
    };
    void run();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b12] px-4 py-16 text-center text-white/70">
        در حال بارگذاری…
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-[#070b12] px-4 py-16 text-center text-red-300">
        {error || "صفحه یافت نشد."}
      </div>
    );
  }

  const hasWork =
    person.cast_in_movies.length > 0 ||
    person.cast_in_series.length > 0 ||
    person.directing.length > 0;

  return (
    <div className="min-h-screen bg-[#070b12] text-white" dir="rtl">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 md:flex-row md:items-start">
        <div className="mx-auto w-full max-w-xs shrink-0 md:mx-0">
          <div className="aspect-[2/3] overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {person.profile_url ? (
              <Image
                src={person.profile_url}
                alt={person.name}
                width={400}
                height={600}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl font-black text-white/30">
                {person.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">{person.name}</h1>
            {person.known_for_department ? (
              <p className="mt-2 text-sm text-white/55">{person.known_for_department}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/70">
              {person.birthday ? <span>زادروز: {person.birthday}</span> : null}
              {person.place_of_birth ? <span>{person.place_of_birth}</span> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/60">
              <span>{person.stats.movies_on_platform} فیلم در این سایت</span>
              <span>{person.stats.series_on_platform} سریال در این سایت</span>
              {person.imdb_id ? (
                <a
                  className="text-sky-300 underline"
                  href={`https://www.imdb.com/name/${person.imdb_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  IMDb
                </a>
              ) : null}
            </div>
          </div>
          <section>
            <h2 className="text-lg font-bold text-white/90">درباره</h2>
            <p className="mt-2 leading-8 text-white/75">
              {person.biography?.trim() || "اطلاعاتی موجود نیست."}
            </p>
          </section>
          {!hasWork ? (
            <p className="text-white/55">این شخص هنوز فیلم یا سریالی در این سایت ندارد.</p>
          ) : (
            <section className="space-y-6">
              {person.cast_in_movies.length > 0 ? (
                <div>
                  <h2 className="text-lg font-bold">فیلم‌ها</h2>
                  <ul className="mt-3 space-y-2">
                    {person.cast_in_movies.map((m) => (
                      <li key={m.movie_id}>
                        <Link href={`/movies/${m.slug}`} className="text-sky-300 hover:underline">
                          {m.title}
                        </Link>
                        {m.release_year ? <span className="text-white/45"> ({m.release_year})</span> : null}
                        {m.character ? (
                          <span className="text-white/55"> — نقش: {m.character}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {person.cast_in_series.length > 0 ? (
                <div>
                  <h2 className="text-lg font-bold">سریال‌ها</h2>
                  <ul className="mt-3 space-y-2">
                    {person.cast_in_series.map((s) => (
                      <li key={s.series_id}>
                        <span className="text-white/80">{s.title}</span>
                        {s.character ? (
                          <span className="text-white/55"> — نقش: {s.character}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
