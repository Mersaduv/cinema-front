import WatchPageClient from "./WatchPageClient";

export const viewport = {
  width: 1920,
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function WatchPage() {
  const cdnOrigin = process.env.NEXT_PUBLIC_CDN_ORIGIN ?? "https://cinema.af";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiOrigin = apiUrl.replace(/\/api\/?$/, "");

  return (
    <>
      <link rel="preconnect" href={cdnOrigin} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={cdnOrigin} />
      {apiOrigin ? <link rel="preconnect" href={apiOrigin} /> : null}
      <WatchPageClient />
    </>
  );
}
