/**
 * Route Handler — Toggle de like em mídia de profile.
 *
 * Endpoint: `POST /api/media/like`
 *
 * Faz upsert/delete em `MediaLike` para o par `(mediaId, userId)` conforme o
 * flag `liked` enviado pelo cliente. Retorna a contagem agregada atualizada.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth válida (qualquer role).
 * - Rate limit: n/a (operação idempotente — toggle).
 * - Validação Zod: `MediaLikeBodySchema` em `src/lib/validation/media.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/media/like`).
 * - src/lib/validation/media.schema.ts — schema do body.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaLikeBodySchema } from "@/lib/validation";

/**
 * Aplica o toggle de like e retorna a contagem total atual.
 *
 * Body esperado:
 *   - `mediaId` (cuid, required).
 *   - `liked` (boolean, required): `true` para criar, `false` para remover.
 *
 * @returns
 *   - 200: `{ ok: true, likeCount: number }`.
 *   - 400: validation error (`flatten()`).
 *   - 401: não autenticado.
 *
 * Side effects:
 * - DB: `MediaLike.upsert` (quando `liked === true`) ou `MediaLike.deleteMany`
 *   (quando `liked === false`).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const result = MediaLikeBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { mediaId, liked } = result.data;

  if (liked) {
    await prisma.mediaLike.upsert({
      where: { mediaId_userId: { mediaId, userId: session.user.id } },
      update: {},
      create: { mediaId, userId: session.user.id },
    });
  } else {
    await prisma.mediaLike.deleteMany({ where: { mediaId, userId: session.user.id } });
  }

  const count = await prisma.mediaLike.count({ where: { mediaId } });
  return NextResponse.json({ ok: true, likeCount: count });
}
