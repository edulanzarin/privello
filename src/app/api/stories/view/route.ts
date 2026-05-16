/**
 * Route Handler — Registro idempotente de view em story.
 *
 * Endpoint: `POST /api/stories/view`
 *
 * Faz upsert em `StoryView` para o par `(storyId, userId)`. O incremento é
 * idempotente por `(userId, storyId)` em janela de 1h via rate limit
 * (`storyView`) — visualizações repetidas na mesma janela respondem 200 mas
 * **não** atualizam a contagem.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth válida.
 * - Rate limit: `storyView` (1 req / 1h por par `(userId, storyId)`) via
 *   `rateLimitConfigFor("storyView", "<userId>:<storyId>")`. Em rate limit
 *   hit responde **200 silencioso** sem tocar o banco (per `rate-limits.md`).
 * - Validação Zod: `StoriesViewBodySchema` em
 *   `src/lib/validation/stories-api.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/stories/view`).
 * - .kiro/specs/fase-1-seguranca/rate-limits.md §"Tabela canônica" (linha
 *   `visualização de stories`).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoriesViewBodySchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitConfigFor } from "@/lib/rate-limit-config";

/**
 * Marca a story como vista pelo usuário (idempotente em janela de 1h).
 *
 * Body esperado:
 *   - `storyId` (cuid, required).
 *
 * @returns
 *   - 200: `{ ok: true }` (sucesso real **ou** rate limit hit silencioso).
 *   - 400: validation error (`flatten()`).
 *   - 401: não autenticado.
 *   - 404: story inexistente ou expirada (FK error tratado).
 *
 * Side effects:
 * - DB: `StoryView.upsert` por par `(storyId, userId)` quando o rate limit
 *   permite. Em hit, **nenhum** efeito.
 *
 * @see .kiro/specs/fase-1-seguranca/rate-limits.md (`storyView`)
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = StoriesViewBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { storyId } = parsed.data;

  // Idempotent rate-limit: 1 view per (userId, storyId) per hour. On excess
  // we return 200 silently and SKIP the prisma upsert — repeat views in the
  // same window must not bump counters (per `rate-limits.md`).
  const rl = await rateLimit(rateLimitConfigFor("storyView", `${session.user.id}:${storyId}`));
  if (!rl.allowed) {
    return NextResponse.json({ ok: true });
  }

  try {
    // Verify story exists before upserting
    const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
    if (!story) return NextResponse.json({ ok: false, error: "Story not found" }, { status: 404 });

    await prisma.storyView.upsert({
      where: { storyId_userId: { storyId, userId: session.user.id } },
      update: { viewedAt: new Date() },
      create: { storyId, userId: session.user.id },
    });
  } catch {
    // Gracefully handle foreign key errors (story may have expired/been deleted)
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
