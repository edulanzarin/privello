/**
 * @deprecated 2026-05-30 — funções migradas para `@/lib/services/*` na
 * Wave 7 da fase-3-backend (cf. `metricas-baseline.md > §5 Decisões >
 * queries.ts final`). Remoção planejada após 2026-06-13 (janela ≥ 14 dias
 * conforme design.md > Boundaries).
 *
 * Este arquivo agora contém:
 *   1. Re-exports temporários de `@/lib/services` para compatibilidade.
 *   2. Os helpers `sortProfileCards` e `finalizeDiscoverOrder` JUSTIFICADOS:
 *      são oráculo da Property 1 (`discover.service.pbt.ts` valida paridade
 *      do agrupamento por `planTier` em JS — cf. design.md > Correctness
 *      Properties). Removê-los exigirá refatoração da Property 1 para
 *      comparar contra um snapshot (já planejado em
 *      `design.md > Testing Strategy > teste de paridade vs unitário`).
 *   3. O include `profileCardInclude` JUSTIFICADO: ainda referenciado pelo
 *      tipo legado `ProfileCardPayload` que esses helpers consomem.
 *
 * Após a janela, este arquivo deve sumir e a Property 1 passa a usar um
 * snapshot estático como oráculo (sem dependência de SQL).
 */

import type { PlanTier, Prisma } from "@prisma/client";

// ─── Re-exports a partir da camada de services ────────────────────────────
// Mantém a compatibilidade dos consumidores que ainda importem de
// `@/lib/queries`. Após a janela de remoção, qualquer import remanescente
// vira erro de build e migra para `@/lib/services` ou é removido.

export {
  isSubscriber,
  getActiveSubscription,
  getProfileBySlug,
  getProfileBySlugForPainel,
  getProfileMediaPage,
  getUserReviewForProfile,
  getCityBySlug,
  getOrCreateCityBySlug,
  getAllCities,
  getCitiesWithReels,
  getMediaWithCounts,
  listMediaComments,
  listProfilesForCity,
  searchProfilesGlobal,
  getPremiumWeekProfiles,
  getHotProfiles,
  getBoostedProfiles,
  getSectionProfiles,
  getStoriesForProfile,
  listStoriesForCity,
  getPlatformStats,
  getHotPeriodStart,
  listWhatsAppClicksRecent,
  countWhatsAppClicksToday,
  listFinancialRecordsForMonth,
  listReels,
  listModerationQueue,
} from "@/lib/services";

export type {
  GetProfileBySlugOptions,
  ProfileMediaItem,
  ProfileMediaPage,
  DiscoverFilters,
  GenderFilter,
  ProfileSort,
  StoryGroup,
} from "@/lib/services";

// ─── JUSTIFICADO: oráculo da Property 1 ──────────────────────────────────
//
// `profileCardInclude`, `ProfileCardPayload`, `sortProfileCards`,
// `finalizeDiscoverOrder` permanecem aqui por enquanto porque são lidos
// como ORÁCULO em `discover.service.pbt.ts` (Property 1). Há equivalentes
// privados em `discover.service.ts > __test_internal__` (`profileCardInclude`,
// `sortProfileCardsInner`, `finalizeDiscoverOrderInner`). Após a janela de
// remoção, o teste passa a comparar contra um snapshot estático e este
// bloco vai embora.

const profileCardInclude = {
  city: { select: { name: true, slug: true } },
  district: { select: { name: true, slug: true } },
  media: {
    where: { isPublic: true },
    orderBy: { sortOrder: "asc" as const },
    take: 20,
    select: { url: true, isCover: true, mediaType: true },
  },
} satisfies Prisma.ProfileInclude;

export type ProfileCardPayload = Prisma.ProfileGetPayload<{
  include: typeof profileCardInclude;
}>;

import type { ProfileSort as _ProfileSort } from "@/lib/services";

export function sortProfileCards<T extends ProfileCardPayload>(
  profiles: T[],
  sort: _ProfileSort,
): T[] {
  const copy = [...profiles];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.priceHour - b.priceHour);
    case "price_desc":
      return copy.sort((a, b) => b.priceHour - a.priceHour);
    case "rating":
    case "relevance":
      return copy.sort(
        (a, b) =>
          b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount,
      );
    default:
      return copy;
  }
}

const PLAN_ORDER: PlanTier[] = ["PREMIUM", "DESTAQUE", "ESSENCIAL"];

export function finalizeDiscoverOrder<T extends ProfileCardPayload>(
  profiles: T[],
  sort: _ProfileSort,
): T[] {
  const inner: _ProfileSort = sort === "relevance" ? "rating" : sort;
  const now = new Date();

  const boosted = profiles.filter(
    (p) => p.featuredUntil != null && new Date(p.featuredUntil) > now,
  );
  const rest = profiles.filter(
    (p) => !(p.featuredUntil != null && new Date(p.featuredUntil) > now),
  );

  const sortedBoosted: T[] = [];
  for (const tier of PLAN_ORDER) {
    const g = boosted.filter((p) => p.planTier === tier);
    sortedBoosted.push(...sortProfileCards(g, inner));
  }

  const out: T[] = [...sortedBoosted];
  for (const tier of PLAN_ORDER) {
    const g = rest.filter((p) => p.planTier === tier);
    out.push(...sortProfileCards(g, inner));
  }
  return out;
}
