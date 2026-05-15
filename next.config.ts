import type { NextConfig } from "next";

const extraOrigins = (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.93", ...extraOrigins],
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
