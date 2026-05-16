/**
 * Route Handler — Avaliação (review) de um profile.
 *
 * Endpoint: `POST /api/review`
 *
 * Cria ou atualiza (upsert) a avaliação que um cliente assinante deixou em um
 * profile, identificado por `profileSlug`. Após o upsert, recomputa
 * `Profile.ratingAvg`/`ratingCount` para manter o cache denormalizado em sincronia.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth + assinatura ativa (`isSubscriber`).
 * - Rate limit: n/a (espelhado pelo upsert por par `(profileId, userId)` —
 *   spam não cria duplicatas).
 * - Validação Zod: `ReviewBodySchema` em `src/lib/validation/review.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/review`).
 * - src/lib/services/media.service.ts — `isSubscriber`.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubscriber } from "@/lib/services";
import { ReviewBodySchema } from "@/lib/validation";

/**
 * Cria/atualiza avaliação do usuário no profile e recomputa as agregações em
 * `Profile.ratingAvg`/`Profile.ratingCount`.
 *
 * Body esperado:
 *   - `profileSlug` (string, required, regex slug).
 *   - `rating` (int 1–5, required).
 *   - `comment` (string, optional, trim, max 1000 chars, nullable).
 *
 * @returns
 *   - 200: `{ ok: true }`.
 *   - 400: validation error (`flatten()`).
 *   - 401: não autenticado.
 *   - 403: usuário sem assinatura ativa.
 *   - 404: profile não encontrado.
 *
 * Side effects:
 * - DB: `Review.upsert` por par `(profileId, userId)`.
 * - DB: `Profile.update` recomputando `ratingAvg` e `ratingCount` via
 *   `prisma.review.aggregate`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const subscriber = await isSubscriber(session.user.id);
  if (!subscriber) {
    return NextResponse.json({ error: "Apenas assinantes podem avaliar." }, { status: 403 });
  }

  const result = ReviewBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { profileSlug, rating, comment } = result.data;

  const profile = await prisma.profile.findUnique({ where: { slug: profileSlug } });
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  const profileId = profile.id;

  // Upsert so the user can update their existing review
  await prisma.review.upsert({
    where: { profileId_userId: { profileId, userId: session.user.id } },
    update: { rating, comment: comment ?? null, updatedAt: new Date() },
    create: { profileId, userId: session.user.id, rating, comment: comment ?? null },
  });

  // Recompute cached avg + count on the profile
  const stats = await prisma.review.aggregate({
    where: { profileId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.profile.update({
    where: { id: profileId },
    data: {
      ratingAvg: stats._avg.rating ?? 0,
      ratingCount: stats._count.rating,
    },
  });

  return NextResponse.json({ ok: true });
}
