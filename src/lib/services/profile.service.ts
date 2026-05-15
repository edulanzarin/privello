import { prisma } from "@/lib/prisma";
import { REVIEWS_PAGE_SIZE } from "@/lib/constants";

/**
 * Busca perfil completo por slug (para página pública).
 */
export async function getProfileBySlug(slug: string, userId?: string) {
    return prisma.profile.findUnique({
        where: { slug },
        include: {
            city: true,
            district: true,
            media: {
                orderBy: { createdAt: "desc" },
                include: {
                    _count: { select: { likes: true, comments: true } },
                    likes: userId ? { where: { userId }, select: { id: true } } : false,
                },
            },
            reviews: {
                orderBy: { createdAt: "desc" },
                take: REVIEWS_PAGE_SIZE,
                include: { user: { select: { id: true, name: true, slug: true } } },
            },
            availabilityRules: { orderBy: [{ weekday: "asc" }] },
            durationOptions: {
                where: { active: true },
                orderBy: [{ sortOrder: "asc" }, { minutes: "asc" }],
            },
        },
    });
}

/**
 * Busca perfil para o painel do provider.
 */
export async function getProfileBySlugForPainel(slug: string) {
    return prisma.profile.findUnique({
        where: { slug },
        include: {
            user: { select: { name: true, email: true } },
            city: true,
            district: true,
        },
    });
}

/**
 * Busca a review de um usuário para um perfil específico.
 */
export async function getUserReviewForProfile(profileId: string, userId: string) {
    return prisma.review.findUnique({
        where: { profileId_userId: { profileId, userId } },
    });
}
