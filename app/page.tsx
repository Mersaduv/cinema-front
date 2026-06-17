import ContinueWatching from "./components/ContinueWatching";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <main className="mx-auto w-full max-w-[1820px] px-4 py-8 md:px-7 md:py-10">
        <section className="mb-10 space-y-3">
          <h1 className="text-3xl font-black text-white md:text-4xl">سینما</h1>
          <p className="max-w-2xl text-sm leading-7 text-white/60 md:text-base">
            پلتفرم تماشای فیلم و سریال — از منوی کناری برای مرور کاتالوگ استفاده کنید.
          </p>
        </section>

        <ContinueWatching mediaType="all" limit={16} />
      </main>
    </div>
  );
}
