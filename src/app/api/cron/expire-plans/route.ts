/**
 * Route Handler — Job de expiração de planos e assinaturas.
 *
 * Endpoint: `GET /api/cron/expire-plans`
 *
 * Roda diariamente. Faz duas operações idempotentes:
 *   1. Faz downgrade para `ESSENCIAL` de todos os `Profile` cujo
 *      `planExpiresAt` já passou.
 *   2. Marca como `EXPIRED` todas as `Subscription.ACTIVE` com `expiresAt`
 *      no passado.
 *
 * Convenções:
 * - Autenticação: cron secret via `verifyCronSecret` — aceita
 *   `Authorization: Bearer <CRON_SECRET>`, `X-Cron-Secret: <CRON_SECRET>` e,
 *   em janela de transição, `?secret=<CRON_SECRET>` (deprecated).
 * - Rate limit: n/a (gateado pelo segredo).
 * - Validação Zod: n/a (sem body/query do usuário).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.2 (`/api/cron/expire-plans`).
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
 * Roda diariamente. Faz downgrade dos planos de provider expirados para
 * `ESSENCIAL` e marca subscriptions de cliente expiradas como `EXPIRED`.
 *
 * Body/query: nenhum (auth via header).
 *
 * @returns
 *   - 200: `{ ok: true, expiredPlans: number, expiredSubscriptions: number,
 *     ranAt: ISO8601 }`.
 *   - 401: cron secret inválido/ausente (sem body — contrato cron-auth).
 *
 * Side effects:
 * - DB: `Profile.updateMany` → `planTier = ESSENCIAL` para perfis expirados.
 * - DB: `Subscription.updateMany` → `status = EXPIRED` para assinaturas
 *   ACTIVE que já passaram do `expiresAt`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.2
 * @see src/lib/security/cron-auth.ts
 */
export async function GET(req: Request) {
  const auth = verifyCronSecret(req, { transitionEndsAt });
  if (!auth.ok) {
    return new NextResponse(null, { status: 401 });
  }

  const now = new Date();

  const [expiredPlans, expiredSubs] = await Promise.all([
    // Downgrade provider plans that have expired
    prisma.profile.updateMany({
      where: {
        planTier: { not: "ESSENCIAL" },
        planExpiresAt: { lt: now, not: null },
      },
      data: { planTier: "ESSENCIAL" },
    }),
    // Mark client subscriptions as EXPIRED
    prisma.subscription.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    expiredPlans: expiredPlans.count,
    expiredSubscriptions: expiredSubs.count,
    ranAt: now.toISOString(),
  });
}
