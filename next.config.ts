import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "*.substackcdn.com" },
      { protocol: "https", hostname: "tellingshowoflove.substack.com" },
      { protocol: "https", hostname: "*.vimeocdn.com" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
      { protocol: "https", hostname: "static-cdn.jtvnw.net" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "f4.bcbits.com" },
      { protocol: "https", hostname: "*.bcbits.com" },
      { protocol: "https", hostname: "*.sndcdn.com" },
      { protocol: "https", hostname: "soundcloud.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["next/font/google"],
  },
  // Security headers live in middleware (src/lib/security-headers.ts) only.
  // Keep cache hints here for static assets that skip the middleware matcher.
  headers: async () => [
    {
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

export default nextConfig;

// Local `next dev` only — never during CI / Workers Builds.
if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev();
}
