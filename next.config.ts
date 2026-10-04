import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "substackcdn.com" },
      { protocol: "https", hostname: "**.substack.com" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
      { protocol: "https", hostname: "static-cdn.jtvnw.net" },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
