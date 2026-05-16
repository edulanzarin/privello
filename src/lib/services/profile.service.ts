/**
 * src/lib/services/profile.service.ts
 *
 * Service layer central para a entidade `Profile` (perfis públicos de providers
 * e seus dados derivados: mídia paginada, reviews, contadores).
 *
 * Cobertura:
 * - `getProfileBySlug` — perfil público completo com paginação cursor-based de mídia
 *   e batching de reviews (corrige N+1 da pré-auditoria; cf. fase-3-backend EAR 1).
 * - `getProfileMediaPage` — paginação cursor-based pura (validada pela Property 2).
 * - Helpers de cursor (`encodeMediaCursor`, `decodeMediaCursor`).
 * - Listagens para descobrir, em-alta, em-destaque (consumidas via `getOrCreateCityBySlug`).
 *
 * Convenções:
 * - Server-side, lê Prisma direto. Consumidores: Server Components em `/p/[slug]/`, `/descobrir/[citySlug]/`, painel.
 * - Cursor é base64url de `{ sortOrder, id }` (estável entre requisições).
 * - Pré-auditoria: a maior parte vivia em `src/lib/queries.ts`. Migrada na fase-3-backend.
 *
 * Cf. `.kiro/specs/fase-3-backend/metricas-baseline.md` para benchmarks antes/depois.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { REVIEWS_PAGE_SIZE } from "@/lib/constants";

// ─── Tipos públicos do service ──────────────────────────────────────────────

export type GetProfileBySlugOptions = {
    /** ID do usuário logado, usado para resolver `media.likes` por `userId`. */
    userId?: string;
    /**
     * Cursor opaco devolvido por uma chamada anterior. Decodificado via
     * {@link decodeMediaCursor}. Cursor inválido cai silenciosamente para
     * a primeira página (cf. AC 1.4).
     */
    mediaCursor?: string;
    /**
     * Número de itens de mídia pública por página. Default 12 (cf. AC 1.2);
     * teto rígido de 24 (cf. design.md > Components > Paginação cursor-based).
     */
    mediaPageSize?: number;
    /**
     * Se `true`, inclui também itens com `isPublic: false`. Usado pelo dono
     * do perfil ao se auto-visualizar. Quando `false` (default), AC 1.2 se
     * aplica: apenas pública, ≤ `mediaPageSize`.
     */
    includePrivate?: boolean;
};

export type ProfileMediaItem = {
    id: string;
    url: string;
    mediaType: string;
    isPublic: boolean;
    isCover: boolean;
    sortOrder: number;
    caption: string | null;
    createdAt: Date;
    _count: { likes: number; comments: number };
    likes?: { id: string }[];
};

export type ProfileMediaPage = {
    items: ProfileMediaItem[];
    nextCursor: string | null;
    hasMore: boolean;
};

const MEDIA_PAGE_SIZE_DEFAULT = 12;
const MEDIA_PAGE_SIZE_MAX = 24;

// ─── Cursor opaco (sortOrder, id) ───────────────────────────────────────────
//
// O cursor é base64url(`${sortOrder}:${id}`). A chave composta
// (sortOrder asc, id asc) é estritamente monotônica desde que `id` seja
// único — o que vale para `cuid()` do Prisma. Cursor malformado vira `null`
// (volta à primeira página, AC 1.4).
//
// Schema: `Media.sortOrder Int @default(0)` — não-nulo. O cursor sempre
// carrega um Int. Se um futuro migrate tornar a coluna nullable, este código
// emite NaN no `Number()` e o decode retorna `null` (volta à primeira página).

type DecodedCursor = { sortOrder: number; id: string };

function encodeMediaCursor(item: { sortOrder: number; id: string }): string {
    return Buffer.from(`${item.sortOrder}:${item.id}`, "utf8").toString("base64url");
}

function decodeMediaCursor(cursor: string | undefined): DecodedCursor | null {
    if (!cursor) return null;
    try {
        const decoded = Buffer.from(cursor, "base64url").toString("utf8");
        const sep = decoded.indexOf(":");
        if (sep <= 0) return null;
        const so = decoded.slice(0, sep);
        const id = decoded.slice(sep + 1);
        if (!id) return null;
        const n = Number(so);
        if (!Number.isFinite(n)) return null;
        return { sortOrder: n, id };
    } catch {
        return null;
    }
}

function clampPageSize(requested: number | undefined): number {
    if (requested == null || !Number.isFinite(requested) || requested <= 0) {
        return MEDIA_PAGE_SIZE_DEFAULT;
    }
    return Math.min(Math.floor(requested), MEDIA_PAGE_SIZE_MAX);
}

function buildMediaWhere(
    profileId: string,
    cursor: DecodedCursor | null,
    includePrivate: boolean,
): Prisma.MediaWhereInput {
    const base: Prisma.MediaWhereInput = { profileId };
    if (!includePrivate) base.isPublic = true;
    if (!cursor) return base;
    // Próximo item é (sortOrder, id) > (cursor.sortOrder, cursor.id) na ordem
    // lex. SQL: (sortOrder > cursor.sortOrder) OR (sortOrder = cursor.sortOrder
    // AND id > cursor.id).
    return {
        ...base,
        OR: [
            { sortOrder: { gt: cursor.sortOrder } },
            { sortOrder: cursor.sortOrder, id: { gt: cursor.id } },
        ],
    };
}

/**
 * Busca uma página de mídia pública (ou pública+privada) de um perfil.
 *
 * Implementa AC 1.2 (no máx. 12 públicas), AC 1.4 (cursor inválido vira
 * primeira página) e Property 2/3 (paginação completa+disjunta, cursor
 * monotônico). Cf. design.md > Correctness Properties.
 */
export async function getProfileMediaPage(
    slug: string,
    options?: GetProfileBySlugOptions,
): Promise<ProfileMediaPage> {
    const profile = await prisma.profile.findUnique({
        where: { slug },
        select: { id: true },
    });
    if (!profile) return { items: [], nextCursor: null, hasMore: false };

    const pageSize = clampPageSize(options?.mediaPageSize);
    const cursor = decodeMediaCursor(options?.mediaCursor);
    const includePrivate = options?.includePrivate ?? false;
    const userId = options?.userId;

    const rows = await prisma.media.findMany({
        where: buildMediaWhere(profile.id, cursor, includePrivate),
        // take: pageSize + 1 detecta hasMore sem fazer count separado.
        take: pageSize + 1,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
            id: true,
            url: true,
            mediaType: true,
            isPublic: true,
            isCover: true,
            sortOrder: true,
            caption: true,
            createdAt: true,
            _count: { select: { likes: true, comments: true } },
            likes: userId ? { where: { userId }, select: { id: true } } : false,
        },
    });

    const hasMore = rows.length > pageSize;
    const trimmed = (hasMore ? rows.slice(0, pageSize) : rows) as ProfileMediaItem[];
    const last = trimmed[trimmed.length - 1];
    const nextCursor = hasMore && last ? encodeMediaCursor(last) : null;
    return { items: trimmed, nextCursor, hasMore };
}

/**
 * Busca perfil completo por slug (para página pública).
 *
 * Refactor da Wave 5 (Requirement 1):
 * - Mídia pública paginada por cursor (AC 1.2/1.4); `includePrivate=true`
 *   para o dono ver suas mídias privadas.
 * - `select` explícito em `reviews` limitando a ≤ 10 campos por relação
 *   (AC 1.3, atende a Property 4 do spec arquivado).
 * - Profile + reviews + availabilityRules + durationOptions buscados em uma
 *   única query Prisma (via `include`); a paginação cursor-based de mídia
 *   roda em uma query separada com `select` explícito (cf. design.md > N+1).
 *
 * Compatibilidade: `profile.media` continua sendo um array (capeado em
 * `mediaPageSize`, default 12, public-only por padrão). `profile.mediaPage`
 * carrega `{ items, nextCursor, hasMore }` para paginação incremental.
 */
export async function getProfileBySlug(slug: string, options?: GetProfileBySlugOptions) {
    const profile = await prisma.profile.findUnique({
        where: { slug },
        include: {
            city: true,
            district: true,
            reviews: {
                orderBy: { createdAt: "desc" },
                take: REVIEWS_PAGE_SIZE,
                // AC 1.3: select explícito ≤ 10 campos por relação aninhada.
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    user: { select: { id: true, name: true, slug: true } },
                },
            },
            availabilityRules: { orderBy: [{ weekday: "asc" }] },
            durationOptions: {
                where: { active: true },
                orderBy: [{ sortOrder: "asc" }, { minutes: "asc" }],
            },
        },
    });
    if (!profile) return null;

    const mediaPage = await getProfileMediaPage(slug, {
        userId: options?.userId,
        mediaCursor: options?.mediaCursor,
        mediaPageSize: options?.mediaPageSize,
        includePrivate: options?.includePrivate ?? false,
    });

    return Object.assign(profile, {
        media: mediaPage.items,
        mediaPage,
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

// ─── Exports auxiliares para testes (não documentados como API pública) ────
export const __test_internal__ = {
    encodeMediaCursor,
    decodeMediaCursor,
    clampPageSize,
    buildMediaWhere,
    MEDIA_PAGE_SIZE_DEFAULT,
    MEDIA_PAGE_SIZE_MAX,
};
