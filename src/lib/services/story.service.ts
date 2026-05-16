// src/lib/services/story.service.ts
//
// Wave 6.5 (Requirement 4.3) — `listStoriesForCity` migrado de "buscar todas
// as stories e agrupar com Map em JS" para "buscar perfis com stories
// ativas via `prisma.profile.findMany` com `where: { stories: { some: ... } }`
// e carregar as stories de cada perfil em uma sub-relação".
//
// Diferença com o oráculo em `queries.ts > listStoriesForCity`:
// - Oráculo: 1 query em `Story` retornando todas as stories ativas + perfil
//   incluído via `include`, depois `Map<profileId, StoryGroup>` em JS.
// - Novo: 1 query em `Profile` filtrando por `{ stories: { some: ... } }`,
//   `include: { stories: ..., media: ... }` para carregar tudo em SQL.
//
// Paridade: a ordem dos perfis no oráculo é "primeiro perfil com story mais
// recente". A nova versão precisa preservar isso. Usamos
// `orderBy: { stories: { _count: "desc" } }`? Não — Prisma não suporta
// ordering por coluna agregada de relação. Alternativa: ordenar pelo
// `MAX(story.createdAt)` — também não suportado nativamente. Mantemos a
// ordem do oráculo via post-processing em JS (sort por `stories[0].createdAt
// desc` após o fetch). Isso é fiel à semântica original e evita raw SQL.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type StoryGroup = {
    profileId: string;
    slug: string;
    displayName: string;
    coverUrl: string;
    allSeen: boolean;
    stories: {
        id: string;
        mediaUrl: string;
        mediaType: string;
        caption: string | null;
        createdAt: string;
        viewCount: number;
        likeCount: number;
        seenByMe: boolean;
        likedByMe: boolean;
    }[];
};

export async function getStoriesForProfile(
    profileId: string,
    userId?: string,
): Promise<StoryGroup | null> {
    const now = new Date();
    const rawStories = await prisma.story.findMany({
        where: { profileId, expiresAt: { gt: now } },
        include: {
            profile: {
                select: {
                    id: true,
                    slug: true,
                    displayName: true,
                    media: {
                        where: { isCover: true },
                        take: 1,
                        select: { url: true },
                    },
                },
            },
            _count: { select: { views: true, likes: true } },
            views: userId ? { where: { userId }, select: { id: true } } : false,
            likes: userId ? { where: { userId }, select: { id: true } } : false,
        },
        orderBy: { createdAt: "desc" },
    });

    if (rawStories.length === 0) return null;

    const p = rawStories[0].profile;
    const group: StoryGroup = {
        profileId: p.id,
        slug: p.slug,
        displayName: p.displayName,
        coverUrl: p.media[0]?.url ?? "https://picsum.photos/seed/x/200/200",
        allSeen: false,
        stories: rawStories.map((s) => ({
            id: s.id,
            mediaUrl: s.mediaUrl,
            mediaType: s.mediaType,
            caption: s.caption,
            createdAt: s.createdAt.toISOString(),
            viewCount: s._count.views,
            likeCount: s._count.likes,
            seenByMe: userId ? (s.views as { id: string }[]).length > 0 : false,
            likedByMe: userId ? (s.likes as { id: string }[]).length > 0 : false,
        })),
    };
    group.allSeen = group.stories.every((s) => s.seenByMe);
    return group;
}

/**
 * Lista grupos de stories ativos para uma cidade.
 *
 * Wave 6.5: migrado de "Map JS sobre Story[]" para
 * `prisma.profile.findMany` com `stories: { some }` e include das stories
 * já filtradas por `expiresAt > now`. Reduz o trabalho de agrupamento que
 * antes era O(n_stories) em JS para O(n_profiles) em pós-processamento
 * (sort por timestamp da story mais recente).
 *
 * Paridade preservada: ordem dos perfis = `MAX(stories.createdAt) desc`
 * (mesma ordem do oráculo, que itera stories ordenadas por `createdAt desc`
 * e materializa o primeiro grupo). Stories dentro de cada grupo continuam
 * ordenadas por `createdAt desc`.
 */
export async function listStoriesForCity(
    cityId: string,
    userId?: string,
    gender?: string,
): Promise<StoryGroup[]> {
    const now = new Date();

    const profileWhere: Prisma.ProfileWhereInput = {
        cityId,
        planTier: { in: ["DESTAQUE", "PREMIUM"] },
        stories: { some: { expiresAt: { gt: now } } },
    };
    if (gender === "garotos") profileWhere.servesWomen = true;
    else if (gender === "casais") profileWhere.servesCouples = true;
    else profileWhere.servesMen = true;

    const profiles = await prisma.profile.findMany({
        where: profileWhere,
        select: {
            id: true,
            slug: true,
            displayName: true,
            media: {
                where: { isCover: true },
                take: 1,
                select: { url: true },
            },
            stories: {
                where: { expiresAt: { gt: now } },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    mediaUrl: true,
                    mediaType: true,
                    caption: true,
                    createdAt: true,
                    _count: { select: { views: true, likes: true } },
                    views: userId
                        ? { where: { userId }, select: { id: true } }
                        : false,
                    likes: userId
                        ? { where: { userId }, select: { id: true } }
                        : false,
                },
            },
        },
    });

    // Mapeia para StoryGroup e ordena perfis por timestamp da story mais
    // recente (paridade com oráculo `queries.ts > listStoriesForCity`).
    const groups: StoryGroup[] = profiles
        .filter((p) => p.stories.length > 0)
        .map((p) => {
            const stories = p.stories.map((s) => ({
                id: s.id,
                mediaUrl: s.mediaUrl,
                mediaType: s.mediaType,
                caption: s.caption,
                createdAt: s.createdAt.toISOString(),
                viewCount: s._count.views,
                likeCount: s._count.likes,
                seenByMe: userId
                    ? (s.views as { id: string }[]).length > 0
                    : false,
                likedByMe: userId
                    ? (s.likes as { id: string }[]).length > 0
                    : false,
            }));
            const allSeen = stories.every((s) => s.seenByMe);
            return {
                profileId: p.id,
                slug: p.slug,
                displayName: p.displayName,
                coverUrl: p.media[0]?.url ?? "https://picsum.photos/seed/x/200/200",
                allSeen,
                stories,
            };
        })
        // Ordem: perfil com story mais recente vem primeiro.
        .sort((a, b) => {
            const ta = a.stories[0]?.createdAt ?? "";
            const tb = b.stories[0]?.createdAt ?? "";
            return tb.localeCompare(ta);
        });

    return groups;
}
