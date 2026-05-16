// src/lib/services/discover.service.ts
//
// Wave 6 (Requirement 4) — sorts em memória movidos para `ORDER BY` no
// Prisma onde a paridade com `queries.ts` permite. Para `listProfilesForCity`
// e `getBoostedProfiles`, o agrupamento por `planTier` (PREMIUM > DESTAQUE >
// ESSENCIAL) permanece em JS porque o Prisma não suporta `ORDER BY CASE WHEN`
// nativamente sem `$queryRaw` (que perde tipagem) ou um campo `planTierWeight`
// no schema (que vira `OutOfScopeFinding` por mudança de schema). Decisão A
// registrada em `metricas-baseline.md > §5 Decisões > Sort relevance`.
//
// Property 1 (paridade SQL ↔ memória) é validada em
// `discover.service.pbt.ts`: a ordem produzida por estas funções deve ser
// idêntica em ID à produzida pelas funções homônimas em `src/lib/queries.ts`
// (oráculo durante a janela de migração).

import type { PlanTier, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    DISCOVER_PAGE_SIZE,
    SECTION_PAGE_SIZE,
} from "@/lib/constants";

// ─── Tipos públicos ────────────────────────────────────────────────────────

export type GenderFilter = "garotos" | "casais" | undefined;

export type DiscoverFilters = {
    gender?: GenderFilter;
    priceMin?: number;
    priceMax?: number;
    ageMin?: number;
    ageMax?: number;
    verifiedOnly?: boolean;
    hasOwnPlace?: boolean;
    homeVisit?: boolean;
    excludeProfileId?: string;
    search?: string;
};

export type ProfileSort = "relevance" | "price_asc" | "price_desc" | "rating";

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

const PLAN_ORDER: PlanTier[] = ["PREMIUM", "DESTAQUE", "ESSENCIAL"];

// ─── Helpers de ordenação ──────────────────────────────────────────────────

/**
 * Sort estável de cards por `sort` (mesmo critério de
 * `queries.ts > sortProfileCards`). Operação interna usada por
 * `finalizeDiscoverOrder` quando o agrupamento por `planTier` precisa
 * acontecer em JS (Prisma não suporta `ORDER BY` por enum).
 */
function sortProfileCardsInner<T extends ProfileCardPayload>(
    profiles: T[],
    sort: ProfileSort,
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

/**
 * Aplica o agrupamento canônico boosted-first → tiers PREMIUM/DESTAQUE/
 * ESSENCIAL com sort interno. Equivalente verbatim a
 * `queries.ts > finalizeDiscoverOrder`.
 *
 * O Prisma não suporta `ORDER BY CASE WHEN planTier = 'PREMIUM' THEN 1 ...`
 * sem `$queryRaw`. Mantemos o agrupamento em JS — ainda é O(N) sobre o set
 * (≤ 60 profiles tipicamente, ver `DISCOVER_PAGE_SIZE`).
 */
function finalizeDiscoverOrderInner<T extends ProfileCardPayload>(
    profiles: T[],
    sort: ProfileSort,
): T[] {
    const inner: ProfileSort = sort === "relevance" ? "rating" : sort;
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
        sortedBoosted.push(...sortProfileCardsInner(g, inner));
    }

    const out: T[] = [...sortedBoosted];
    for (const tier of PLAN_ORDER) {
        const g = rest.filter((p) => p.planTier === tier);
        out.push(...sortProfileCardsInner(g, inner));
    }
    return out;
}

// ─── listProfilesForCity ───────────────────────────────────────────────────

/**
 * Lista perfis para a página `/descobrir/[citySlug]`.
 *
 * SEMÂNTICA PRESERVADA (Property 1, paridade exata com
 * `queries.ts > listProfilesForCity`): take 60 ordenados por `lastUpdatedAt
 * desc` no SQL, depois agrupamento boosted-first + tier + inner sort em JS.
 *
 * O ORDER BY do Prisma (`lastUpdatedAt desc`) já estava em SQL no oráculo —
 * a Wave 6 não muda a base query. A migração para SQL puro do agrupamento
 * por tier exigiria `$queryRaw CASE WHEN` ou um campo `planTierWeight` no
 * schema (registrado como `OutOfScopeFinding` em § 3 caso a métrica depois
 * regrida).
 */
export async function listProfilesForCity(
    cityId: string,
    filters: DiscoverFilters,
    sort: ProfileSort = "relevance",
) {
    const now = new Date();
    const where: Prisma.ProfileWhereInput = {
        cityId,
        isSuspended: false,
        planExpiresAt: { gt: now },
        media: { some: { isCover: true } },
    };

    // Default: mostra perfis que atendem homens (garotas).
    if (filters.gender === "garotos") where.servesWomen = true;
    else if (filters.gender === "casais") where.servesCouples = true;
    else where.servesMen = true;

    if (filters.priceMin != null || filters.priceMax != null) {
        where.priceHour = {};
        if (filters.priceMin != null) where.priceHour.gte = filters.priceMin;
        if (filters.priceMax != null) where.priceHour.lte = filters.priceMax;
    }
    if (filters.ageMin != null || filters.ageMax != null) {
        where.age = {};
        if (filters.ageMin != null) where.age.gte = filters.ageMin;
        if (filters.ageMax != null) where.age.lte = filters.ageMax;
    }
    if (filters.verifiedOnly) where.isVerified = true;
    if (filters.hasOwnPlace) where.hasOwnPlace = true;
    if (filters.homeVisit) where.homeVisit = true;
    if (filters.excludeProfileId) where.id = { not: filters.excludeProfileId };
    if (filters.search) {
        const q = filters.search.replace(/^@/, "").trim();
        where.OR = [
            { displayName: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
        ];
    }

    const profiles = await prisma.profile.findMany({
        where,
        include: profileCardInclude,
        orderBy: [{ lastUpdatedAt: "desc" }],
        take: DISCOVER_PAGE_SIZE,
    });

    return finalizeDiscoverOrderInner(profiles, sort);
}

// ─── searchProfilesGlobal ─────────────────────────────────────────────────

export async function searchProfilesGlobal(q: string, limit = 30) {
    const term = q.replace(/^@/, "").trim();
    if (!term) return [] as ProfileCardPayload[];
    const now = new Date();
    const profiles = await prisma.profile.findMany({
        where: {
            isSuspended: false,
            planExpiresAt: { gt: now },
            OR: [
                { displayName: { contains: term, mode: "insensitive" } },
                { slug: { contains: term, mode: "insensitive" } },
            ],
        },
        include: profileCardInclude,
        orderBy: [{ lastUpdatedAt: "desc" }],
        take: limit,
    });
    return finalizeDiscoverOrderInner(profiles, "relevance");
}

// ─── getPremiumWeekProfiles ───────────────────────────────────────────────

export async function getPremiumWeekProfiles() {
    const now = new Date();
    return prisma.profile.findMany({
        where: {
            planTier: { in: ["PREMIUM", "DESTAQUE"] },
            isSuspended: false,
            planExpiresAt: { gt: now },
        },
        include: profileCardInclude,
        orderBy: [{ featuredUntil: "desc" }, { ratingAvg: "desc" }],
        take: 8,
    });
}

// ─── getHotProfiles ───────────────────────────────────────────────────────

/**
 * "Em alta da semana" — ordem 100% em SQL (`viewsCurrentPeriod desc`), sem
 * tier-grouping. Idêntico ao oráculo em `queries.ts`.
 */
export async function getHotProfiles(limit = 20) {
    const now = new Date();
    return prisma.profile.findMany({
        where: {
            isSuspended: false,
            planExpiresAt: { gt: now },
            media: { some: { isCover: true } },
        },
        include: profileCardInclude,
        orderBy: { viewsCurrentPeriod: "desc" },
        take: limit,
    });
}

// ─── getBoostedProfiles ───────────────────────────────────────────────────

/**
 * Perfis com boost ativo (`featuredUntil > now`). Order by tier
 * (PREMIUM/DESTAQUE/ESSENCIAL) + `viewsCurrentPeriod desc`. Tier grouping
 * em JS (mesma justificativa de `listProfilesForCity`).
 */
export async function getBoostedProfiles(limit = 8) {
    const now = new Date();
    const profiles = await prisma.profile.findMany({
        where: {
            featuredUntil: { gt: now },
            isSuspended: false,
            planExpiresAt: { gt: now },
            media: { some: { isCover: true } },
        },
        include: profileCardInclude,
        orderBy: { viewsCurrentPeriod: "desc" },
        take: limit * 3,
    });

    const out: typeof profiles = [];
    for (const tier of PLAN_ORDER) {
        const group = profiles
            .filter((p) => p.planTier === tier)
            .sort((a, b) => b.viewsCurrentPeriod - a.viewsCurrentPeriod);
        out.push(...group);
        if (out.length >= limit) break;
    }

    return out.slice(0, limit);
}

// ─── getSectionProfiles ──────────────────────────────────────────────────

/**
 * Paginação por offset para a home (seções `hot` e `boosted`).
 *
 * Wave 6:
 * - `hot`: ordem 100% em SQL (`viewsCurrentPeriod desc`); `take = limit + 1`
 *   detecta `hasMore` sem `count`.
 * - `boosted`: tier-grouping em JS (mesma justificativa de
 *   `listProfilesForCity`). Buscamos `take = offset + limit + 100` para ter
 *   margem suficiente após o reordenamento por tier (mesma heurística do
 *   oráculo em `queries.ts`).
 */
export async function getSectionProfiles(
    type: "hot" | "boosted",
    offset = 0,
    limit = SECTION_PAGE_SIZE,
) {
    const now = new Date();

    if (type === "hot") {
        const rows = await prisma.profile.findMany({
            where: {
                isSuspended: false,
                planExpiresAt: { gt: now },
                media: { some: { isCover: true } },
            },
            include: profileCardInclude,
            orderBy: { viewsCurrentPeriod: "desc" },
            skip: offset,
            take: limit + 1,
        });
        const hasMore = rows.length > limit;
        return { profiles: rows.slice(0, limit), hasMore };
    }

    // boosted — agrupamento tier em JS
    const rows = await prisma.profile.findMany({
        where: {
            featuredUntil: { gt: now },
            isSuspended: false,
            planExpiresAt: { gt: now },
            media: { some: { isCover: true } },
        },
        include: profileCardInclude,
        orderBy: { viewsCurrentPeriod: "desc" },
        take: offset + limit + 100,
    });
    const sorted = [...rows].sort((a, b) => {
        const order: Record<string, number> = {
            PREMIUM: 0,
            DESTAQUE: 1,
            ESSENCIAL: 2,
        };
        const diff = (order[a.planTier] ?? 2) - (order[b.planTier] ?? 2);
        return diff !== 0 ? diff : b.viewsCurrentPeriod - a.viewsCurrentPeriod;
    });
    const page = sorted.slice(offset, offset + limit);
    const hasMore = sorted.length > offset + limit;
    return { profiles: page, hasMore };
}

// ─── Exports auxiliares para testes ──────────────────────────────────────

export const __test_internal__ = {
    sortProfileCardsInner,
    finalizeDiscoverOrderInner,
    PLAN_ORDER,
    profileCardInclude,
};
