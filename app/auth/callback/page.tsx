import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

function AuthCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#f5c518]"></div>
        <p className="mt-4 text-gray-400">در حال ورود...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackClient />
    </Suspense>
  );
}
