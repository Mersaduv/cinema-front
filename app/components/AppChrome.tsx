"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import Footer from "./Footer";
import Header from "./Header";
import TvSidebarNav from "./tv/TvSidebarNav";
import { useIsTvCompat, useIsTvUi } from "../hooks/useTvCapabilities";
import { useTvPageNavigation } from "../hooks/useTvPageNavigation";

export default function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageRef = useRef<HTMLDivElement>(null);
  const isTvCompat = useIsTvCompat();
  const isTvUi = useIsTvUi();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isWatchRoute = pathname?.startsWith("/watch/");
  const isLoginRoute = pathname === "/login";
  const isAuthFullBleedRoute =
    pathname === "/signup" ||
    pathname === "/tv-login" ||
    pathname?.startsWith("/forgot-password");
  const isPublicDetailRoute =
    (pathname?.startsWith("/movies/") && pathname.split("/").length === 3) ||
    (pathname?.startsWith("/series/") && pathname.split("/").length === 3) ||
    (pathname?.startsWith("/actors/") && pathname.split("/").length === 3);
  const showTvSidebar =
    isTvUi && !isAdminRoute && !isWatchRoute && !isLoginRoute && !isAuthFullBleedRoute;
  const shouldHideHeader = isAdminRoute || isWatchRoute || showTvSidebar || isAuthFullBleedRoute;
  const shouldOverlayHeader = isPublicDetailRoute && !showTvSidebar;

  useTvPageNavigation(pageRef, {
    enabled: isTvCompat && !isAdminRoute && !isWatchRoute,
  });

  return (
    <>
      {showTvSidebar ? <TvSidebarNav /> : null}
      {!shouldHideHeader ? <Header overlay={shouldOverlayHeader} isTv={false} /> : null}
      <div
        ref={pageRef}
        data-tv-page={isTvCompat && !isAdminRoute && !isWatchRoute ? "true" : undefined}
        data-tv-unified-ui={isTvCompat && !isTvUi ? "true" : undefined}
        className={
          isWatchRoute
            ? isTvCompat
              ? "h-screen overflow-hidden bg-black"
              : "h-dvh overflow-hidden bg-black"
            : shouldHideHeader || shouldOverlayHeader
              ? `flex min-h-screen flex-col${showTvSidebar ? " pr-[220px]" : ""}`
              : `flex min-h-screen flex-col pt-[138px] xl:pt-[81px] ${showTvSidebar ? " pr-[220px]" : ""}`
        }
      >
        <main className={isWatchRoute ? "h-full overflow-hidden" : "flex-1"}>
          {children}
        </main>
        {!shouldHideHeader ? <Footer isTv={false} /> : null}
      </div>
    </>
  );
}
