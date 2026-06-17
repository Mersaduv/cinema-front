"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import Footer from "./Footer";
import Header from "./Header";
import TvSidebarNav from "./tv/TvSidebarNav";
import { useIsTv } from "../hooks/useTvCapabilities";
import { useTvPageNavigation } from "../hooks/useTvPageNavigation";

export default function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageRef = useRef<HTMLDivElement>(null);
  const isTv = useIsTv();
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
    isTv && !isAdminRoute && !isWatchRoute && !isLoginRoute && !isAuthFullBleedRoute;
  const shouldHideHeader = isAdminRoute || isWatchRoute || showTvSidebar || isAuthFullBleedRoute;
  const shouldOverlayHeader = isPublicDetailRoute && !showTvSidebar;

  useTvPageNavigation(pageRef, {
    enabled: isTv && !isAdminRoute && !isWatchRoute,
  });

  return (
    <>
      {showTvSidebar ? <TvSidebarNav /> : null}
      {!shouldHideHeader ? <Header overlay={shouldOverlayHeader} isTv={isTv} /> : null}
      <div
        ref={pageRef}
        data-tv-page={isTv && !isAdminRoute && !isWatchRoute ? "true" : undefined}
        className={
          isWatchRoute
            ? isTv
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
        {!shouldHideHeader ? <Footer isTv={isTv} /> : null}
      </div>
    </>
  );
}
