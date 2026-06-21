import type { NextConfig } from "next";

function imageRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "http", hostname: "localhost" },
    { protocol: "https", hostname: "localhost" },
    { protocol: "http", hostname: "127.0.0.1" },
    { protocol: "https", hostname: "127.0.0.1" },
    { protocol: "https", hostname: "image.tmdb.org" },
    { protocol: "http", hostname: "cinema.af" },
    { protocol: "https", hostname: "cinema.af" },
  ];

  const configuredHost = process.env.NEXT_PUBLIC_CINEMA_IMAGE_HOST?.trim();

  if (configuredHost) {
    patterns.push(
      { protocol: "http", hostname: configuredHost },
      { protocol: "https", hostname: configuredHost },
    );
  }

  return patterns;
}

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [48, 64, 96, 128, 200, 256],
    remotePatterns: imageRemotePatterns(),
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.target = ["web", "es5"];
    }
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/content2/:path*',
        destination: 'http://cinema.af/content2/:path*',
      },
    ];
  },
};

export default nextConfig;