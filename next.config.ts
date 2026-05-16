import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

// AGENTS_Rule (area: headers) — consulta em 2026-03-14:
//   - node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
//     (guia "Content Security Policy" — cobre nonce dinâmico via middleware,
//     opção de header estático em next.config.ts, e o trade-off com static
//     rendering. Decisão herdada: estático em Report-Only, sem nonce.)
//   - node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md
//     (referência de `headers()` em next.config.js — formato
//     `{ source, headers: [{ key, value }] }`, ordem de matching, restrições
//     de path. `source: "/(.*)"` aplica a todos os paths.)
//
// Cross-references desta fase:
//   - .kiro/specs/fase-1-seguranca/csp-origins.md > §3 — string CSP final.
//     Esta função reproduz §3 verbatim, com a única diferenciação dev/prod:
//     `'unsafe-eval'` em `script-src` apenas em dev (React Fast Refresh).
//     Em prod, `'unsafe-eval'` é removido para não normalizar `eval()` em
//     bundles servidos a usuários reais.
//   - .kiro/specs/fase-1-seguranca/nextauth-prod.md > §5 — janela de
//     validação Report-Only ≥ 7 dias e procedimento de reversão antes da
//     transição para enforcement. A Fase 1 entrega apenas Report-Only; a
//     transição vira commit posterior, fora do escopo desta entrega.
//
// `'unsafe-inline'` é aceito em `script-src` e `style-src` nesta fase porque
// o design escolheu CSP estático sem nonce (nonce-CSP forçaria dynamic
// rendering em todas as rotas e conflitaria com a Fase 3). Ver
// `design.md > Overview > AGENTS_Rule` deste spec-filho.
function buildCSP(isProd: boolean): string {
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://picsum.photos https://commondatastorage.googleapis.com https://storage.googleapis.com https://*.googleusercontent.com",
    "connect-src 'self' https://servicodados.ibge.gov.br",
    "font-src 'self' data:",
    "media-src 'self' blob: https://commondatastorage.googleapis.com https://storage.googleapis.com",
    "frame-ancestors 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ") + "; ";
}

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
  // 180 dias sem preload — janela compatível com a transição CSP em
  // nextauth-prod.md > §5 (Tarefa 7.3 de fase-1-seguranca, Requirement 7.4).
  { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
  // Tarefa 7.2 — CSP em Report-Only (não bloqueia, apenas reporta). Origens
  // listadas em csp-origins.md > §3; helper `buildCSP` no topo deste arquivo.
  {
    key: "Content-Security-Policy-Report-Only",
    value: buildCSP(process.env.NODE_ENV === "production"),
  },
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
