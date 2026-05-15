// ─── Planos e Preços ──────────────────────────────────────────────────────────
export const PLAN_PRICES = {
  ESSENCIAL: 3990,
  DESTAQUE: 8900,
  PREMIUM: 18900,
} as const; // em centavos

export const SUBSCRIPTION_PRICE_BRL = 1990; // em centavos
export const SUBSCRIPTION_PRICE_LABEL = "R$19,90/mês";

export const PLAN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const BOOST_DURATION_MS = 24 * 60 * 60 * 1000;
export const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Upload ──────────────────────────────────────────────────────────────────
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20MB

// ─── Moderação ───────────────────────────────────────────────────────────────
export const SUSPENSION_THRESHOLD = 3;

// ─── Localização ─────────────────────────────────────────────────────────────
export const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

// ─── Plataforma ──────────────────────────────────────────────────────────────
export const SITE_URL = "https://privello.com.br";
export const SITE_NAME = "Privello";

export const DEMO_PROVIDER_SLUG = "helena-jardins";

export const FALLBACK_PLATFORM_STATS = {
  profiles: 4812,
  verified: 4427,
  cities: 38,
  verifiedPct: 92,
};

// ─── Paginação ───────────────────────────────────────────────────────────────
export const SECTION_PAGE_SIZE = 8;
export const DISCOVER_PAGE_SIZE = 60;
export const REELS_PAGE_SIZE = 10;
export const REVIEWS_PAGE_SIZE = 12;
export const COMMENTS_PAGE_SIZE = 50;
