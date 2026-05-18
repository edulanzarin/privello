/**
 * Sitemap.ts — Privello (SEO Fase 1).
 *
 * Caminho: src/app/sitemap.ts
 * Next docs: app/sitemap
 *
 * Gera o sitemap.xml dinamicamente com 4 grupos de URLs:
 *
 * 1. **Static / public** (`/`, `/descobrir`, `/cidades`, `/em-alta`,
 *    `/em-destaque`, `/novidades`, `/reels`, `/planos`, legal). Prioridades
 *    descrescentes do raiz para legais.
 *
 * 2. **Cidades** (`/descobrir/[citySlug]`) — listings de descoberta por cidade
 *    são as URLs com maior potencial de tráfego orgânico
 *    ("acompanhantes São Paulo"). Prioridade alta (0.9), revisão diária.
 *
 * 3. **Perfis públicos ativos** (`/p/[slug]`) — qualquer perfil com plano
 *    válido (`planExpiresAt > now`) e não suspenso. Mesma gating do
 *    `listProfilesForCity` para evitar sitemap stale apontando para 404.
 *
 * 4. **Reels por perfil** (`/reels/[slug]`) — só perfis que têm pelo menos
 *    1 mídia `REEL` pública. Reusa a query existente `getCitiesWithReels`
 *    como base, mas filtra por slug.
 *
 * Cada entrada inclui `lastModified` derivado do timestamp mais recente
 * disponível (perfil: `lastUpdatedAt`; cidade: now por enquanto).
 *
 * Cache: este file é tratado como Route Handler estático por padrão; o tipo
 * de DB call força revalidação a cada deploy. Para revalidação periódica,
 * configurar `revalidate = 3600` se a quantidade de URLs crescer demais.
 */
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.AUTH_URL ?? SITE_URL;

// Revalida a cada hora — perfis novos / boosts / cidades novas entram no
// índice em até 60 minutos sem precisar redeploy.
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

const STATIC_ROUTES: ReadonlyArray<{
    path: string;
    priority: number;
    changeFrequency: SitemapEntry["changeFrequency"];
}> = [
        { path: "/", priority: 1.0, changeFrequency: "daily" },
        { path: "/descobrir", priority: 0.9, changeFrequency: "daily" },
        { path: "/cidades", priority: 0.85, changeFrequency: "weekly" },
        { path: "/em-alta", priority: 0.85, changeFrequency: "daily" },
        { path: "/em-destaque", priority: 0.85, changeFrequency: "daily" },
        { path: "/novidades", priority: 0.8, changeFrequency: "daily" },
        { path: "/reels", priority: 0.8, changeFrequency: "daily" },
        { path: "/planos", priority: 0.7, changeFrequency: "monthly" },
        { path: "/termos-de-uso", priority: 0.3, changeFrequency: "yearly" },
        { path: "/politica-de-privacidade", priority: 0.3, changeFrequency: "yearly" },
    ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const [cities, profiles, reelsProfiles] = await Promise.all([
        prisma.city.findMany({
            select: { slug: true },
            orderBy: { name: "asc" },
        }),
        prisma.profile.findMany({
            where: {
                isSuspended: false,
                planExpiresAt: { gt: now },
            },
            select: { slug: true, lastUpdatedAt: true },
            orderBy: { lastUpdatedAt: "desc" },
        }),
        prisma.profile.findMany({
            where: {
                isSuspended: false,
                planExpiresAt: { gt: now },
                media: { some: { mediaType: "REEL", isPublic: true } },
            },
            select: { slug: true, lastUpdatedAt: true },
            orderBy: { lastUpdatedAt: "desc" },
        }),
    ]);

    const staticEntries: SitemapEntry[] = STATIC_ROUTES.map((r) => ({
        url: `${BASE_URL}${r.path}`,
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
    }));

    const cityEntries: SitemapEntry[] = cities.map((c) => ({
        url: `${BASE_URL}/descobrir/${c.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
    }));

    const profileEntries: SitemapEntry[] = profiles.map((p) => ({
        url: `${BASE_URL}/p/${p.slug}`,
        lastModified: p.lastUpdatedAt,
        changeFrequency: "daily",
        priority: 0.7,
    }));

    const reelsEntries: SitemapEntry[] = reelsProfiles.map((p) => ({
        url: `${BASE_URL}/reels/${p.slug}`,
        lastModified: p.lastUpdatedAt,
        changeFrequency: "weekly",
        priority: 0.5,
    }));

    return [...staticEntries, ...cityEntries, ...profileEntries, ...reelsEntries];
}
