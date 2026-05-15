import { prisma } from "@/lib/prisma";
import { COMMENTS_PAGE_SIZE } from "@/lib/constants";

/**
 * Busca mídia com contadores de likes e comentários.
 */
export async function getMediaWithCounts(mediaId: string, userId?: string) {
    return prisma.media.findUnique({
        where: { id: mediaId },
        include: {
            _count: { select: { likes: true, comments: true } },
            likes: userId ? { where: { userId }, select: { id: true } } : false,
        },
    });
}

/**
 * Lista comentários de uma mídia.
 */
export async function listMediaComments(mediaId: string) {
    return prisma.mediaComment.findMany({
        where: { mediaId },
        orderBy: { createdAt: "asc" },
        take: COMMENTS_PAGE_SIZE,
        include: {
            user: { select: { id: true, name: true, slug: true } },
        },
    });
}
