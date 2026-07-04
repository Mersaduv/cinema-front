"use client";

import { SWRConfig } from "swr";
import AppChrome from "@/app/components/AppChrome";
import TvCompatRoot from "@/app/components/tv/TvCompatRoot";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { PUBLIC_SWR_DEFAULTS } from "@/app/lib/swr/public-cache";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={PUBLIC_SWR_DEFAULTS}>
      <AuthProvider>
        <TvCompatRoot />
        <AppChrome>{children}</AppChrome>
      </AuthProvider>
    </SWRConfig>
  );
}
