// src/lib/services/reels.service.ts
//
// Wave 7.6 (Requirement 5.2) — `listReels` migrado de `src/lib/queries.ts`.
// Cursor pagination sobre `(createdAt desc, id desc)` já existia no oráculo
// (cursor por id apenas). Mantemos paridade exata: a ordenação é por
// `createdAt desc` no Prisma; o cursor por `id` funciona como tie-breaker
// determinístico via `cursor: { id: cursor }, skip: 1`.
//
// Não houve mudança algorítmica — apenas reorganização para a camada
// services. Fields explícitos via `select` já estavam no oráculo via
// include/select; preservamos verbatim.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ListReelsOptions = {
    cityId?: string;
    profileId?: string;
    cursor?: string;
    limit?: number;
    userId?: string;
    viewerIsSubscriber?: boolean;
    /**
     * Se preenchido, este usuário é dono do perfil — ele sempre vê seus
     * próprios reels privados.
     */
    ownerId?: string;
};

export type ReelItem = {
    id: string;
    url: string;
    caption: string | null;
    isPrivate: boolean;
    isLocked: boolean;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
    profile: {
        id: string;
        slug: string;
        displayName: string;
        coverUrl: string | null;
        cityName: string;
        citySlug: string;
    };
};

export type ReelsPage = {
    reels: ReelItem[];
    hasMore: boolean;
    nextCursor: string | null;
};

export async function listReels(opts: ListReelsOptions = {}): Promise<ReelsPage> {
    const {
        cityId,
        profileId,
        cursor,
        limit = 10,
        userId,
        viewerIsSubscriber = false,
        ownerId,
    } = opts;

    const profileFilter = {
        isSuspended: false,
        ...(cityId ? { cityId } : {}),
        ...(profileId ? { id: profileId } : {}),
    };

    const where: Prisma.MediaWhereInput = {
        mediaType: "REEL",
        profile: profileFilter,
    };

    const items = await prisma.media.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
            profile: {
                select: {
                    id: true,
                    slug: true,
                    displayName: true,
                    city: { select: { name: true, slug: true } },
                    media: {
                        where: { isCover: true },
                        take: 1,
                        select: { url: true },
                    },
                },
            },
            _count: { select: { likes: true, comments: true } },
            likes: userId ? { where: { userId }, select: { id: true } } : false,
        },
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return {
        reels: items.map((r) => {
            const isPrivate = !r.isPublic;
            const isLocked =
                isPrivate && !viewerIsSubscriber && r.profile.id !== ownerId;
            return {
                id: r.id,
                url: isLocked ? "" : r.url,
                caption: isLocked ? null : r.caption,
                isPrivate,
                isLocked,
                createdAt: r.createdAt.toISOString(),
                likeCount: r._count.likes,
                commentCount: r._count.comments,
                likedByMe: userId
                    ? (r.likes as { id: string }[]).length > 0
                    : false,
                profile: {
                    id: r.profile.id,
                    slug: r.profile.slug,
                    displayName: r.profile.displayName,
                    coverUrl: r.profile.media[0]?.url ?? null,
                    cityName: r.profile.city.name,
                    citySlug: r.profile.city.slug,
                },
            };
        }),
        hasMore,
        nextCursor: hasMore ? items[items.length - 1].id : null,
    };
}
