/**
 * Route Handler — Job semanal de reset do período "hot".
 *
 * Endpoint: `GET /api/cron/reset-hot`
 *
 * Reseta `viewsCurrentPeriod` de todos os profiles e atualiza
 * `HotPeriodConfig.startedAt` para o instante da execução. Deve ser invocado
 * toda segunda-feira às 00:00 BRT por um scheduler externo (Vercel Cron,
 * GitHub Actions, cron-job.org).
 *
 * Convenções:
 * - Autenticação: cron secret via `verifyCronSecret` — aceita
 *   `Authorization: Bearer <CRON_SECRET>`, `X-Cron-Secret: <CRON_SECRET>` e,
 *   em janela de transição, `?secret=<CRON_SECRET>` (deprecated).
 * - Rate limit: n/a (gateado pelo segredo).
 * - Validação Zod: n/a (sem body/query do usuário).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.2 (`/api/cron/reset-hot`).
 * - src/lib/security/cron-auth.ts — verificação do segredo.
 * - .kiro/specs/fase-1-seguranca/requirements.md > Requirement 2.
 */
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyCronSecret } from "@/lib/security/cron-auth";

/**
 * End of the query-string transition window for `/api/cron/*`.
 *
 * Until this date, requests carrying the secret via `?secret=` are still
 * accepted (with a structured deprecation warning emitted by `verifyCronSecret`).
 * After this date, the query-string path is rejected with HTTP 401.
 *
 * BEFORE 2026-06-15T00:00:00Z, every external scheduler hitting this route
 * MUST be migrated to either header form:
 *   - `Authorization: Bearer <CRON_SECRET>`
 *   - `X-Cron-Secret: <CRON_SECRET>`
 *
 * Schedulers to update (checklist):
 *   - vercel.json `crons` entries (no `vercel.json` present in the repo today;
 *     if one is added before the cutoff, ensure each cron entry uses the
 *     header form — vercel.json supports `headers` per cron in modern Vercel
 *     deployments).
 *   - cron-job.org jobs targeting this endpoint — set the request header
 *     instead of appending `?secret=` to the URL.
 *   - GitHub Actions workflow schedulers (`.github/workflows/*.yml`) that hit
 *     this endpoint via `curl`/`gh api` — pass `-H "Authorization: Bearer …"`.
 *
 * Spec references:
 *   - requirements.md > Requirement 2 (2.1, 2.2, 2.3, 2.4)
 *   - design.md > Components and Interfaces > 2. src/lib/security/cron-auth.ts
 */
const transitionEndsAt = new Date("2026-06-15T00:00:00Z");

/**
 * Reseta o período "hot" semanal: zera `viewsCurrentPeriod` de todos os
 * profiles e atualiza `HotPeriodConfig.startedAt`.
 *
 * Body/query: nenhum (auth via header).
 *
 * @returns
 *   - 200: `{ ok: true, profilesReset: number, resetAt: ISO8601 }`.
 *   - 401: cron secret inválido/ausente (sem body — contrato cron-auth).
 *
 * Side effects:
 * - DB: `Profile.updateMany` → `viewsCurrentPeriod = 0` para todos os perfis.
 * - DB: `HotPeriodConfig.upsert({ id: "hot" })` → `startedAt = new Date()`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.2
 * @see src/lib/security/cron-auth.ts
 */
export async function GET(req: Request) {
  const auth = verifyCronSecret(req, { transitionEndsAt });
  if (!auth.ok) {
    return new NextResponse(null, { status: 401 });
  }

  const [updated] = await Promise.all([
    prisma.profile.updateMany({ data: { viewsCurrentPeriod: 0 } }),
    prisma.hotPeriodConfig.upsert({
      where: { id: "hot" },
      update: { startedAt: new Date() },
      create: { id: "hot", startedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    profilesReset: updated.count,
    resetAt: new Date().toISOString(),
  });
}
