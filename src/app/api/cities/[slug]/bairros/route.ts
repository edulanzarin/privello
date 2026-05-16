/**
 * Route Handler — Lista de bairros (districts) de uma cidade.
 *
 * Endpoint: `GET /api/cities/[slug]/bairros`
 *
 * Retorna os `District` da cidade identificada pelo `slug` da URL, em ordem
 * alfabética. Usado para alimentar o seletor de bairros no cadastro/onboarding
 * de provider.
 *
 * Convenções:
 * - Autenticação: público.
 * - Rate limit: n/a.
 * - Validação Zod: `BairrosParamsSchema` em
 *   `src/lib/validation/cities.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/cities/[slug]/bairros`).
 * - src/lib/validation/cities.schema.ts — schema do route param.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BairrosParamsSchema } from "@/lib/validation";

/**
 * Lista bairros de uma cidade. Quando a cidade não existe, retorna lista vazia
 * em 200 (contrato pré-existente — facilita o consumo no cliente sem branch
 * extra de erro).
 *
 * Route params esperados:
 *   - `slug` (string, required): slug da cidade — trim, lowercase, regex
 *     `^[a-z0-9][a-z0-9-]*$`.
 *
 * @returns
 *   - 200: `{ bairros: Array<{ id, name, slug }> }` (ou `{ bairros: [] }`).
 *   - 400: validation error (`flatten()`).
 *
 * Side effects: nenhum (somente leitura).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const result = BairrosParamsSchema.safeParse(await params);
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const city = await prisma.city.findUnique({ where: { slug: result.data.slug } });
  if (!city) return NextResponse.json({ bairros: [] });

  const districts = await prisma.district.findMany({
    where: { cityId: city.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ bairros: districts });
}
