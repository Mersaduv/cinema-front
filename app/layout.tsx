import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";

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
  preload: true,
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const metadata: Metadata = {
  title: "سینما - Cinema",
  description: "پروژه سینما - سیستم مدیریت سینما",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${iranSansX.variable} font-sans antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
