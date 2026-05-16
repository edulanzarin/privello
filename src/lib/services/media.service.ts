/**
 * src/lib/services/media.service.ts
 *
 * Service layer para entidades `Media` e `MediaComment` (galeria de mídia
 * dos perfis: fotos, vídeos, reels e seus comentários/curtidas).
 *
 * Cobertura:
 * - Detalhes de uma mídia individual com contadores e flag `likedByMe` (`getMediaWithCounts`).
 * - Listagem paginada de comentários (`listMediaComments`).
 *
 * Convenções:
 * - Server-side, lê Prisma direto. Consumidores: Route Handlers em `/api/media/*` e RSC.
 * - Página de comentários: `COMMENTS_PAGE_SIZE` (cf. `src/lib/constants.ts`).
 * - Listagem da galeria do perfil em si vive em `profile.service.ts > getProfileMediaPage`.
 *
 * Pré-auditoria: parte dessa lógica vivia em `src/lib/queries.ts`. Migrada na fase-3-backend.
 */

import { prisma } from "@/lib/prisma";
import { COMMENTS_PAGE_SIZE } from "@/lib/constants";

/**
 * Busca uma mídia com contadores agregados (`likes`, `comments`) e flag de like do viewer.
 *
 * Quando `userId` é informado, inclui `likes` filtrado por aquele usuário (length > 0
 * indica que o viewer curtiu). Quando ausente, `likes` retorna `false` (Prisma omite o relacionamento).
 *
 * @returns A mídia com `_count` e `likes`, ou `null` se não encontrada.
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
