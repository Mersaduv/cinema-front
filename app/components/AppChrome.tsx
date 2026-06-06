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
  const isPublicDetailRoute =
    (pathname?.startsWith("/movies/") && pathname.split("/").length === 3) ||
    (pathname?.startsWith("/series/") && pathname.split("/").length === 3);
  const shouldHideHeader = isAdminRoute || isWatchRoute;
  const shouldOverlayHeader = isPublicDetailRoute;

  return (
    <>
      {!shouldHideHeader ? <Header overlay={shouldOverlayHeader} /> : null}
      <div
        className={
          shouldHideHeader || shouldOverlayHeader
            ? "min-h-screen"
            : "min-h-screen pt-[138px] xl:pt-[92px]"
        }
      >
        {children}
      </div>
    </>
  );
}
