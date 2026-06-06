import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 480, 640, 828, 1080, 1200],
    imageSizes: [48, 64, 96, 128, 200, 256],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "http",
        hostname: "cinema.af",
      },
      {
        protocol: "https",
        hostname: "cinema.af",
      },
    ],
  },
};

export default nextConfig;
