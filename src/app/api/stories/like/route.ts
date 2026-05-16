/**
 * Route Handler — Toggle de like em story.
 *
 * Endpoint: `POST /api/stories/like`
 *
 * Verifica existência da story e alterna `StoryLike` para o par
 * `(storyId, userId)`. Em caso de erro genérico (ex: race condition de
 * delete), responde 404 silenciosamente.
 *
 * Convenções:
 * - Autenticação: sessão NextAuth válida.
 * - Rate limit: n/a (operação idempotente — toggle).
 * - Validação Zod: `StoriesLikeBodySchema` em
 *   `src/lib/validation/stories-api.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/stories/like`).
 * - src/lib/validation/stories-api.schema.ts — schema do body.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoriesLikeBodySchema } from "@/lib/validation";

/**
 * Aplica toggle de like na story.
 *
 * Body esperado:
 *   - `storyId` (cuid, required).
 *
 * @returns
 *   - 200: `{ liked: boolean }` — `true` quando criou, `false` quando removeu.
 *   - 400: validation error (`flatten()`).
 *   - 401: não autenticado.
 *   - 404: story não encontrada (ou erro genérico em race condition).
 *
 * Side effects:
 * - DB: `StoryLike.create` ou `StoryLike.delete`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = StoriesLikeBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { storyId } = parsed.data;

  try {
    // Verify story exists
    const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
    if (!story) return NextResponse.json({ ok: false, error: "Story not found" }, { status: 404 });

    const existing = await prisma.storyLike.findUnique({
      where: { storyId_userId: { storyId, userId: session.user.id } },
    });

    if (existing) {
      await prisma.storyLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.storyLike.create({ data: { storyId, userId: session.user.id } });
      return NextResponse.json({ liked: true });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
