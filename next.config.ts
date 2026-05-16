import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

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

// AGENTS_Rule (area: images-config) — consulta em 2026-03-14:
//   - node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md
//     (página "images" — cobre loaders/CDN; não documenta `remotePatterns` em si).
//   - node_modules/next/dist/shared/lib/image-config.d.ts:24 — declaração canônica
//     `export type RemotePattern = { protocol?: 'http'|'https'; hostname: string;
//      port?: string; pathname?: string; search?: string }`. Wildcards: `*` casa
//     um único segmento de subdomínio/path; `**` casa qualquer número.
//
// Whitelist explícita (Tarefa 3.2 de fase-1-seguranca, Requirement 3.1/3.2).
// Substitui o curinga `{ hostname: "**" }` que ficava antes desta lista.
// Inventário de origens auditadas em:
//   - .kiro/specs/fase-1-seguranca/csp-origins.md > §2.4 (img-src)
//   - .kiro/specs/fase-1-seguranca/endpoints-zod.md > §5 (Imagens externas)
// PRODUCTION_HOSTNAME entra como entrada apenas quando definido em .env (cobre
// uploads servidos pelo próprio domínio de produção em /uploads/**).
const remotePatterns: RemotePattern[] = [
  ...(process.env.PRODUCTION_HOSTNAME
    ? [
      {
        protocol: "https" as const,
        hostname: process.env.PRODUCTION_HOSTNAME,
        pathname: "/uploads/**",
      },
    ]
    : []),
  // Placeholder usado quando profile.media[0] é undefined
  // (src/lib/queries.ts:441,501; src/components/profile/profile-card.tsx:44 etc.)
  { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
  // Vídeos seed (scripts/seed-media-eduarda.ts:10–19).
  { protocol: "https", hostname: "commondatastorage.googleapis.com", pathname: "/**" },
  // Vídeos seed de verificação/reels (prisma/seed.ts:79–92).
  { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
  // Avatares Google (NextAuth OAuth Google — futuro; mantido por simetria com
  // csp-origins.md §2.4). `*` casa um único segmento de subdomínio.
  { protocol: "https", hostname: "*.googleusercontent.com", pathname: "/**" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.93", ...extraOrigins],
  images: {
    remotePatterns,
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
