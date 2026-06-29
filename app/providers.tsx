"use client";

import AppChrome from "@/app/components/AppChrome";
import TvCompatRoot from "@/app/components/tv/TvCompatRoot";
import { AuthProvider } from "@/app/contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TvCompatRoot />
      <AppChrome>{children}</AppChrome>
    </AuthProvider>
  );
}
