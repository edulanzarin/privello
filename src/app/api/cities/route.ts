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

// `dynamic = "force-dynamic"` evita prerender no `next build`. O handler
// faz `prisma.city.findMany()` que exige `DATABASE_URL` em runtime — em
// build a env não está disponível (nem em Docker local sem build-arg, nem
// no Railway que só liga DB ao service em runtime). Forçar dynamic
// também é semanticamente correto: a lista de cidades é leitura simples
// que não justifica complexidade de ISR para um payload pequeno.
// Cross-ref: .kiro/specs/migracao-infra-producao § Task 8 (build smoke).
export const dynamic = "force-dynamic";

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
