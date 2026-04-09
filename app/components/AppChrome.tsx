"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header />}
      <div className={isAdminRoute ? "min-h-screen" : "pt-[72px]"}>
        {children}
      </div>
    </>
  );
}
