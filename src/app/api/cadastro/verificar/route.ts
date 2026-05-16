/**
 * Route Handler — Verificação de disponibilidade de slug no cadastro.
 *
 * Endpoint: `GET /api/cadastro/verificar`
 *
 * Lookup leve para o formulário de cadastro saber se um `slug` (handle do
 * profile) já está em uso, antes de o usuário concluir o pagamento.
 *
 * Convenções:
 * - Autenticação: público.
 * - Rate limit: n/a.
 * - Validação Zod: `VerificarCadastroQuerySchema` em
 *   `src/lib/validation/cadastro.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/cadastro/verificar`).
 * - src/lib/validation/cadastro.schema.ts — schema da query.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VerificarCadastroQuerySchema } from "@/lib/validation";

/**
 * Verifica se o slug informado já está em uso por algum profile.
 *
 * Query esperada:
 *   - `s` (string, required): slug a checar — trim, lowercase, regex
 *     `^[a-z0-9][a-z0-9-]*$`.
 *
 * @returns
 *   - 200: `{ exists: boolean }`.
 *   - 400: validation error (`flatten()`).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 */
export async function GET(req: NextRequest) {
  const result = VerificarCadastroQuerySchema.safeParse({
    s: req.nextUrl.searchParams.get("s"),
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { slug: result.data.s },
    select: { id: true },
  });

  return NextResponse.json({ exists: !!profile });
}
