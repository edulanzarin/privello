/**
 * Route Handler — Comentários em mídias de profile.
 *
 * Endpoint: `GET, POST, DELETE /api/media/comment`
 *
 * Lista, cria e remove comentários (`MediaComment`) atrelados a uma `Media`.
 * Postagem é exclusiva de assinantes (`isSubscriber`); deleção é permitida ao
 * autor do comentário e ao dono do profile que hospeda a mídia.
 *
 * Convenções:
 * - Autenticação: público para `GET`; sessão NextAuth válida para `POST`/
 *   `DELETE`. `POST` exige adicionalmente assinatura ativa.
 * - Rate limit: `comment` (5 req / 1 min por `userId`) aplicado em `POST` via
 *   `rateLimitConfigFor("comment", userId)`.
 * - Validação Zod: `CommentListQuerySchema`, `CommentBodySchema`,
 *   `CommentDeleteBodySchema` em `src/lib/validation/media.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/media/comment`).
 * - .kiro/specs/fase-1-seguranca/rate-limits.md §"Tabela canônica" (linha
 *   `comentários`).
 * - src/lib/services/media.service.ts (`isSubscriber` reaproveitado).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubscriber } from "@/lib/services";
import {
  CommentListQuerySchema,
  CommentBodySchema,
  CommentDeleteBodySchema,
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitConfigFor } from "@/lib/rate-limit-config";

/**
 * Lista até 50 comentários da mídia, ordenados por `createdAt` ascendente.
 *
 * Query esperada:
 *   - `mediaId` (cuid, required).
 *
 * @returns
 *   - 200: `{ comments: Array<MediaComment & { user }> }`.
 *   - 400: validation error (`flatten()`).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 */
export async function GET(req: NextRequest) {
  const result = CommentListQuerySchema.safeParse({
    mediaId: req.nextUrl.searchParams.get("mediaId"),
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const comments = await prisma.mediaComment.findMany({
    where: { mediaId: result.data.mediaId },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: { user: { select: { id: true, name: true, slug: true } } },
  });
  return NextResponse.json({ comments });
}

/**
 * Cria um novo comentário na mídia.
 *
 * Body esperado:
 *   - `mediaId` (cuid, required).
 *   - `text` (string, required, trim, 1-500 chars).
 *
 * @returns
 *   - 200: `{ comment: MediaComment & { user } }`.
 *   - 400: validation error (`flatten()`).
 *   - 401: não autenticado.
 *   - 403: usuário sem assinatura ativa.
 *   - 429: rate limited (`Retry-After` header + log de auditoria).
 *
 * Side effects:
 * - DB: `MediaComment.create` com `userId` da sessão.
 * - Log: linha estruturada `{ ts, endpoint, key, retryAfter }` em rate-limit hit.
 *
 * @see .kiro/specs/fase-1-seguranca/rate-limits.md (`comment`)
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const subscriber = await isSubscriber(session.user.id);
  if (!subscriber) {
    return NextResponse.json({ error: "Apenas assinantes podem comentar." }, { status: 403 });
  }

  // Rate limit: 5 comments per minute per userId. Excess returns 429 with
  // a Retry-After header and a structured audit log line.
  const rl = await rateLimit(rateLimitConfigFor("comment", session.user.id));
  if (!rl.allowed) {
    console.warn({
      ts: Date.now(),
      endpoint: "comment",
      key: session.user.id,
      retryAfter: rl.retryAfter,
    });
    return NextResponse.json(
      { error: "Muitos comentários em pouco tempo. Tente novamente em alguns instantes." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter ?? 60) },
      },
    );
  }

  const result = CommentBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { mediaId, text } = result.data;

  const comment = await prisma.mediaComment.create({
    data: { mediaId, userId: session.user.id, text },
    include: { user: { select: { id: true, name: true, slug: true } } },
  });
  return NextResponse.json({ comment });
}

/**
 * Remove um comentário. Permitido ao autor do comentário ou ao dono do
 * profile que hospeda a mídia.
 *
 * Body esperado:
 *   - `commentId` (cuid, required).
 *
 * @returns
 *   - 200: `{ ok: true }`.
 *   - 400: validation error (`flatten()`).
 *   - 401: não autenticado.
 *   - 403: sem permissão (não é autor nem dono da mídia).
 *   - 404: comentário inexistente.
 *
 * Side effects:
 * - DB: `MediaComment.delete`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const result = CommentDeleteBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { commentId } = result.data;

  const comment = await prisma.mediaComment.findUnique({
    where: { id: commentId },
    include: { media: { include: { profile: { select: { userId: true } } } } },
  });
  if (!comment) return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });

  const isOwn = comment.userId === session.user.id;
  const isProfileOwner = comment.media.profile.userId === session.user.id;
  if (!isOwn && !isProfileOwner) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await prisma.mediaComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
