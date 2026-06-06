export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-16 sm:px-8">
        <div className="text-center space-y-8">


          {/* Status */}
          <div className="mt-8">
            <p className="text-slate-400 text-sm">
              Status: <span className="text-green-500">Online</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
