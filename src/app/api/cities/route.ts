/**
 * Route Handler — Lista pública de cidades atendidas.
 *
 * Endpoint: `GET /api/cities`
 *
 * Retorna todas as `City` cadastradas (slug + nome) ordenadas alfabeticamente.
 * Consumido por seletores de cidade em formulários de cadastro/onboarding e
 * pelos filtros públicos da home.
 *
 * Convenções:
 * - Autenticação: público.
 * - Rate limit: n/a.
 * - Validação Zod: n/a (sem input).
 * - Cache: ISR com `revalidate = 3600` + header `Cache-Control: public,
 *   max-age=3600, stale-while-revalidate=7200`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.3 (`/api/cities` — sem input).
 * - src/lib/services/city.service.ts (lookup análogo do lado do servidor).
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // cache for 1 hour

/**
 * Lista todas as cidades em ordem alfabética.
 *
 * @returns
 *   - 200: `{ cities: Array<{ slug: string; label: string }> }`.
 *
 * Side effects: nenhum (somente leitura).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.3
 */
export async function GET() {
    const cities = await prisma.city.findMany({
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(
        { cities: cities.map((c) => ({ slug: c.slug, label: c.name })) },
        {
            headers: {
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
            },
        },
    );
}
