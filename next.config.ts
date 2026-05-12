import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "commondatastorage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "*.googleusercontent.com", pathname: "/**" },
      // Allow any https hostname for user-uploaded photos (URLs from external sources)
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
