/**
 * Route Handler — Verificação de existência de profile por slug.
 *
 * Endpoint: `GET /api/profiles/check`
 *
 * Lookup leve consumido por formulários de cliente (ex: alteração de slug em
 * `/conta/perfil`) para validar disponibilidade em tempo real.
 *
 * Convenções:
 * - Autenticação: público.
 * - Rate limit: n/a.
 * - Validação Zod: `ProfilesCheckQuerySchema` em
 *   `src/lib/validation/profiles.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/profiles/check`).
 * - src/lib/validation/profiles.schema.ts — schema da query.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProfilesCheckQuerySchema } from "@/lib/validation";

/**
 * Retorna se o slug já existe em `Profile`.
 *
 * Query esperada:
 *   - `slug` (string, required): trim, lowercase, regex `^[a-z0-9][a-z0-9-]*$`.
 *
 * @returns
 *   - 200: `{ exists: boolean }`.
 *   - 400: validation error (`flatten()`).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 */
export async function GET(req: NextRequest) {
  const result = ProfilesCheckQuerySchema.safeParse({
    slug: req.nextUrl.searchParams.get("slug"),
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const count = await prisma.profile.count({ where: { slug: result.data.slug } });
  return NextResponse.json({ exists: count > 0 });
}
