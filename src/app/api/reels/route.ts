/**
 * Route Handler — Listagem paginada de reels.
 *
 * Endpoint: `GET /api/reels`
 *
 * Cursor pagination da feed de reels. A query pode ser filtrada por
 * `cityId` ou `profileId`. O serviço `listReels` resolve a visibilidade
 * (privado vs público) usando o status de assinatura do viewer (`isSubscriber`)
 * e se o viewer é dono do profile (`ownerId`).
 *
 * Convenções:
 * - Autenticação: opcional — quando há sessão, o serviço enriquece o resultado
 *   com info de assinatura/ownership; quando não há, devolve só os reels
 *   públicos.
 * - Rate limit: n/a (somente leitura).
 * - Validação Zod: `ReelsQuerySchema` em `src/lib/validation/reels-api.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/reels`).
 * - src/lib/services/reels.service.ts — `listReels`.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSubscriber, listReels } from "@/lib/services";
import { prisma } from "@/lib/prisma";
import { ReelsQuerySchema } from "@/lib/validation";

/**
 * Devolve a próxima página de reels visíveis para o viewer.
 *
 * Query esperada:
 *   - `cityId` (cuid, optional): filtra reels da cidade.
 *   - `profileId` (cuid, optional): filtra reels de um profile específico.
 *   - `cursor` (string, optional): id do último item retornado.
 *   - `limit` (int 1–50, optional, default 10).
 *
 * @returns
 *   - 200: `{ reels, nextCursor }` (shape definido em `listReels`).
 *   - 400: validation error (`flatten()`).
 *
 * Side effects: nenhum (somente leitura). Faz `Profile.findUnique` para
 * descobrir `ownerId` quando há sessão.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 * @see src/lib/services/reels.service.ts
 */
export async function GET(req: NextRequest) {
  const result = ReelsQuerySchema.safeParse({
    cityId: req.nextUrl.searchParams.get("cityId") ?? undefined,
    profileId: req.nextUrl.searchParams.get("profileId") ?? undefined,
    cursor: req.nextUrl.searchParams.get("cursor") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? undefined;

  // Check subscriber status and whether viewer is a provider (owns a profile)
  let viewerIsSubscriber = false;
  let ownerId: string | undefined;
  if (userId) {
    const [subStatus, profile] = await Promise.all([
      isSubscriber(userId),
      prisma.profile.findUnique({ where: { userId }, select: { id: true } }),
    ]);
    viewerIsSubscriber = subStatus;
    if (profile) ownerId = profile.id;
  }

  const data = await listReels({
    cityId: result.data.cityId,
    profileId: result.data.profileId,
    cursor: result.data.cursor,
    limit: result.data.limit,
    userId,
    viewerIsSubscriber,
    ownerId,
  });
  return NextResponse.json(data);
}
