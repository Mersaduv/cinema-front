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
  const isWatchRoute = pathname?.startsWith("/watch/");
  const shouldHideHeader = isAdminRoute || isWatchRoute;

  return (
    <>
      {!shouldHideHeader && <Header />}
      <div className={shouldHideHeader ? "min-h-screen" : "pt-[72px]"}>
        {children}
      </div>
    </>
  );
}
