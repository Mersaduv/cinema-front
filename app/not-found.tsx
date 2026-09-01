export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f14] px-4 text-center text-white">
      <div>
        <p className="text-6xl font-bold text-white/20">404</p>
        <h1 className="mt-4 text-2xl font-bold">صفحه پیدا نشد</h1>
        <p className="mt-2 text-sm text-white/50">
          آدرسی که وارد کرده‌اید وجود ندارد.
        </p>
      </div>
    </div>
  );
}
