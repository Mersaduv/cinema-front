/** Full-screen immersive skeleton for the watch page — spinner only. */
export default function WatchPageSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black"
      role="status"
      aria-busy="true"
      aria-label="در حال بارگذاری"
    >
      <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-white/15 border-t-[#F5C518]" />
    </div>
  );
}
