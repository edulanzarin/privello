/**
 * Route Handler — Top 5 cidades com mais profiles.
 *
 * Endpoint: `GET /api/top-cities`
 *
 * Retorna as 5 cidades com maior contagem de profiles cadastrados.
 * Consumido pela home/landing para destacar regiões com oferta.
 *
 * Convenções:
 * - Autenticação: público.
 * - Rate limit: n/a.
 * - Validação Zod: n/a (sem input).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.3 (`/api/top-cities` — sem input).
 * - src/lib/services/stats.service.ts (lookups análogos do lado do servidor).
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Lista as 5 cidades mais populadas (por número de profiles).
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
        where: { profiles: { some: {} } },
        select: { name: true, slug: true, _count: { select: { profiles: true } } },
        orderBy: { profiles: { _count: "desc" } },
        take: 5,
    });

    return NextResponse.json({
        cities: cities.map((c) => ({ slug: c.slug, label: c.name })),
    });
}
