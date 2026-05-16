/**
 * Route Handler — Paginação das seções "hot" e "boosted" da home.
 *
 * Endpoint: `GET /api/profiles/section`
 *
 * Retorna mais profiles para uma seção específica da home (`hot` ou
 * `boosted`) usando offset pagination — consumido pelo botão "ver mais" das
 * listagens. A query base é resolvida em `getSectionProfiles`.
 *
 * Convenções:
 * - Autenticação: público.
 * - Rate limit: n/a.
 * - Validação Zod: `ProfilesSectionQuerySchema` em
 *   `src/lib/validation/profiles.schema.ts`.
 * - Cache: `dynamic = "force-dynamic"` — paginação por offset não pode ser
 *   cacheada (justificativa em
 *   `.kiro/specs/fase-3-backend/metricas-baseline.md §3.2`).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/profiles/section`).
 * - src/lib/services/discover.service.ts — `getSectionProfiles`.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSectionProfiles } from "@/lib/services";
import { ProfilesSectionQuerySchema } from "@/lib/validation";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 43 (Route Handler com cursor pagination).
export const dynamic = "force-dynamic";

/**
 * Devolve a próxima página da seção solicitada.
 *
 * Query esperada:
 *   - `type` (enum `"hot" | "boosted"`, required).
 *   - `offset` (int ≥ 0, optional, default 0).
 *
 * @returns
 *   - 200: `{ profiles: ProfileCard[], hasMore: boolean }`.
 *   - 400: validation error (`flatten()`).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1
 * @see src/lib/services/discover.service.ts
 */
export async function GET(req: NextRequest) {
  const result = ProfilesSectionQuerySchema.safeParse({
    type: req.nextUrl.searchParams.get("type"),
    offset: req.nextUrl.searchParams.get("offset") ?? undefined,
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const { profiles, hasMore } = await getSectionProfiles(result.data.type, result.data.offset);
  return NextResponse.json({ profiles, hasMore });
}
