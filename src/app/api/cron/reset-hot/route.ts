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
 * GET /api/cron/reset-hot
 *
 * Resets `viewsCurrentPeriod` for all profiles and updates `HotPeriodConfig`.
 * Should be called every Monday at 00:00 (BRT) by an external cron service
 * (Vercel Cron, GitHub Actions, cron-job.org).
 *
 * Auth: see `verifyCronSecret`. On failure, responds 401 with no body
 * (per cron-auth contract).
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
