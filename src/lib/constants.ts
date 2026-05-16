/**
 * Constantes do app
 *
 * Caminho: src/lib/constants.ts
 *
 * Concentra valores fixos compartilhados entre server actions, route handlers,
 * services e componentes — preços, durações, limites de upload, threshold de
 * moderação, paginação, e identidade de plataforma. Centralizar aqui evita
 * mágica espalhada e permite ajuste em um único ponto.
 *
 * Convenções:
 * - Pure constants, sem side effects nem dependência de runtime.
 * - Valores monetários em centavos (`number`) — formatação visual fica em
 *   `src/lib/money.ts`.
 * - Durações em milissegundos (`number`) — compatíveis com `Date.now()` e
 *   `new Date(now + duration)`.
 * - `as const` quando o consumidor precisa do tipo literal (ex.:
 *   `PLAN_PRICES`, `DAYS_PT`).
 *
 * Cross-refs:
 * - src/lib/services/* — usam constantes de paginação e moderação.
 * - src/app/_actions/* — usam durações e threshold de suspensão.
 * - src/app/api/* — usam limites de upload e durações.
 */

// ─── Planos e Preços ──────────────────────────────────────────────────────────

/**
 * Preço por tier de plano de provider, em centavos de BRL. Usado como
 * referência canônica para checkout, exibição em landing e admin.
 *
 * Unidade: centavos (BRL).
 *
 * Consumidores: `src/components/marketing/*` (página de planos),
 * `src/app/admin/financeiro/page.tsx` (cálculo de MRR estimado).
 */
export const PLAN_PRICES = {
  ESSENCIAL: 3990,
  DESTAQUE: 8900,
  PREMIUM: 18900,
} as const; // em centavos

/**
 * Preço da assinatura Premium (cliente final), em centavos de BRL.
 *
 * Unidade: centavos (BRL).
 *
 * Consumidor: `src/app/_actions/subscription.ts > createSubscriptionAction`.
 */
export const SUBSCRIPTION_PRICE_BRL = 1990; // em centavos

/**
 * Rótulo formatado da assinatura para exibição direta na UI. Mantido como
 * string literal (em vez de derivar de `SUBSCRIPTION_PRICE_BRL`) para evitar
 * `Intl.NumberFormat` em Client Components quando não é necessário.
 *
 * Consumidores: `src/app/assinar/subscribe-button.tsx`,
 * `src/components/reels/reels-feed.tsx`, `src/components/profile/media-gallery.tsx`.
 */
export const SUBSCRIPTION_PRICE_LABEL = "R$19,90/mês";

/**
 * Duração padrão de um plano de provider (30 dias).
 *
 * Unidade: milissegundos.
 *
 * Consumidores: `src/app/_actions/client-profile.ts` (cooldown de troca de
 * slug — 30 dias) e `src/app/api/mp/webhook/route.ts` (cálculo de
 * `planExpiresAt` ao confirmar pagamento de plano).
 */
export const PLAN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Duração padrão de um boost (destaque pago) (24 h).
 *
 * Unidade: milissegundos.
 *
 * Consumidor: `src/app/api/mp/webhook/route.ts` (define
 * `Profile.featuredUntil = now + BOOST_DURATION_MS`).
 */
export const BOOST_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Duração padrão da assinatura Premium (cliente) — 30 dias.
 *
 * Unidade: milissegundos.
 *
 * Consumidor: `src/app/_actions/subscription.ts > createSubscriptionAction`
 * (define `Subscription.expiresAt = now + SUBSCRIPTION_DURATION_MS`).
 */
export const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Tamanho máximo (bytes) de upload de mídia genérica (imagem/vídeo).
 *
 * Unidade: bytes (20 MB).
 *
 * Consumidores: `src/app/api/upload/route.ts`,
 * `src/app/api/upload/verification/route.ts`.
 */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * Tamanho máximo (bytes) de upload de áudio (apresentação do provider).
 *
 * Unidade: bytes (20 MB).
 *
 * Consumidor: `src/app/api/upload-audio/route.ts`.
 */
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20MB

// ─── Moderação ───────────────────────────────────────────────────────────────

/**
 * Limite de advertências antes da suspensão automática do perfil. Acima
 * desse valor (`>= SUSPENSION_THRESHOLD`), `warnProfile` aciona o fluxo de
 * suspensão e dispara `suspensionTemplate`.
 *
 * Unidade: contagem (inteiro).
 *
 * Consumidor: `src/app/_actions/admin-moderation.ts > warnProfile`.
 */
export const SUSPENSION_THRESHOLD = 3;

// ─── Localização ─────────────────────────────────────────────────────────────

/**
 * Abreviação dos dias da semana em pt-BR, indexada por `weekday` (0 = domingo,
 * 6 = sábado). Mantém alinhamento com `Date.getDay()` e com o campo
 * `AvailabilityRule.weekday` do schema Prisma.
 *
 * Consumidores: `src/app/p/[slug]/page.tsx` (perfil público — agenda),
 * `src/app/solicitar/[slug]/page.tsx` (formulário de solicitação).
 */
export const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

// ─── Plataforma ──────────────────────────────────────────────────────────────

/**
 * URL canônica do site em produção. Usada como fallback quando
 * `process.env.NEXTAUTH_URL` não está definido.
 *
 * Consumidor: `src/app/_actions/admin-moderation.ts` (compõe `APP_URL` para
 * links em e-mails de moderação).
 */
export const SITE_URL = "https://privello.com.br";

/**
 * Nome de exibição da plataforma (branding). Reservado para metadata,
 * footer e cabeçalhos de e-mail.
 */
export const SITE_NAME = "Privello";

/**
 * Slug do provider de demonstração usado em conteúdo estático/marketing.
 * Quando o seed é aplicado, este slug aponta para um perfil real.
 */
export const DEMO_PROVIDER_SLUG = "helena-jardins";

/**
 * Estatísticas de fallback exibidas na home quando o aggregate em DB falha
 * ou ainda não foi populado. Evita exibir zeros na primeira visita.
 *
 * Unidades: contagens absolutas, exceto `verifiedPct` (porcentagem 0-100).
 *
 * Consumidor: `src/app/page.tsx` (home/landing).
 */
export const FALLBACK_PLATFORM_STATS = {
  profiles: 4812,
  verified: 4427,
  cities: 38,
  verifiedPct: 92,
};

// ─── Paginação ───────────────────────────────────────────────────────────────

/**
 * Tamanho de página de uma "section" (carrosséis Hot/Boosted/Premium na home
 * e em listagens segmentadas).
 *
 * Unidade: itens por página.
 *
 * Consumidor: `src/lib/services/discover.service.ts > getSectionProfiles`.
 */
export const SECTION_PAGE_SIZE = 8;

/**
 * Tamanho de página da listagem principal de discover (`/c/[slug]`).
 *
 * Unidade: itens por página.
 *
 * Consumidor: `src/lib/services/discover.service.ts > listProfilesForCity`.
 */
export const DISCOVER_PAGE_SIZE = 60;

/**
 * Tamanho de página do feed de Reels.
 *
 * Unidade: itens por página.
 *
 * Consumidor: `src/lib/services/reels.service.ts > listReels`.
 */
export const REELS_PAGE_SIZE = 10;

/**
 * Tamanho de página de avaliações exibidas no perfil público.
 *
 * Unidade: itens por página.
 *
 * Consumidor: `src/lib/services/profile.service.ts > getProfileBySlug`
 * (relação `reviews`).
 */
export const REVIEWS_PAGE_SIZE = 12;

/**
 * Tamanho de página da listagem de comentários por mídia.
 *
 * Unidade: itens por página.
 *
 * Consumidor: `src/lib/services/media.service.ts > listMediaComments`.
 */
export const COMMENTS_PAGE_SIZE = 50;
