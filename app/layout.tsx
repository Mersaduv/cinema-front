import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import "./tv-compat.css";
import AppChrome from "./components/AppChrome";
import { AuthProvider } from "./contexts/AuthContext";
import TvCompatRoot from "./components/tv/TvCompatRoot";
import { CRYPTO_RANDOM_UUID_POLYFILL } from "./lib/random-id";

const iranSansX = localFont({
  src: [
    {
      path: "./fonts/IRANSansX-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-UltraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-DemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-Heavy.woff2",
      weight: "950",
      style: "normal",
    },
    {
      path: "./fonts/IRANSansX-ExtraBlack.woff2",
      weight: "975",
      style: "normal",
    },
  ],
  variable: "--font-iran-sans-x",
  display: "swap",
  preload: false,
  fallback: ["Tahoma", "Segoe UI", "Arial", "Helvetica", "sans-serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cinema",
  description: "پلتفرم نمایش و مدیریت فیلم و سریال",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <Script
          id="crypto-randomuuid-polyfill"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: CRYPTO_RANDOM_UUID_POLYFILL }}
        />
      </head>
      <body className={`${iranSansX.variable} font-sans antialiased`}>
        <TvCompatRoot />
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
