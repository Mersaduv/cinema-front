"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
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
    (pathname?.startsWith("/series/") && pathname.split("/").length === 3) ||
    (pathname?.startsWith("/actors/") && pathname.split("/").length === 3);
  const shouldHideHeader = isAdminRoute || isWatchRoute;
  const shouldOverlayHeader = isPublicDetailRoute;

  return (
    <>
      {!shouldHideHeader ? <Header overlay={shouldOverlayHeader} /> : null}
      <div
        className={
          shouldHideHeader || shouldOverlayHeader
            ? "flex min-h-screen flex-col"
            : "flex min-h-screen flex-col pt-[138px] xl:pt-[81px]"
        }
      >
        <main className="flex-1">{children}</main>
        {!shouldHideHeader ? <Footer /> : null}
      </div>
    </>
  );
}
