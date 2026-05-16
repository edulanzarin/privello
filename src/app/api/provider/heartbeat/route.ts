/**
 * Route Handler — Heartbeat de presença do provider.
 *
 * Endpoint: `POST /api/provider/heartbeat`
 *
 * Atualiza `Profile.lastActiveAt` e força `isOnline = true`. Disparado em
 * polling pelo painel da provider para manter o badge "online" preciso.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth com `role === "PROVIDER"`.
 * - Rate limit: n/a (operação leve, sem efeito visível em caso de spam).
 * - Validação Zod: n/a (sem body).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.3
 *   (`/api/provider/heartbeat` — sem input).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Marca o profile como online no instante da chamada.
 *
 * Body/query: nenhum.
 *
 * @returns
 *   - 200: `{ ok: true }`.
 *   - 401: não autenticado **ou** role ≠ `PROVIDER`.
 *
 * Side effects:
 * - DB: `Profile.updateMany` (filtro `userId`) → `lastActiveAt = now`,
 *   `isOnline = true`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.3
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PROVIDER") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await prisma.profile.updateMany({
    where: { userId: session.user.id },
    data: { lastActiveAt: new Date(), isOnline: true },
  });

  return NextResponse.json({ ok: true });
}
