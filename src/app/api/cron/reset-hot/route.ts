import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/reset-hot
 *
 * Resets viewsCurrentPeriod for all profiles and updates HotPeriodConfig.
 * Should be called every Monday at 00:00 (BRT) by an external cron service
 * (e.g. Vercel Cron, GitHub Actions, cron-job.org).
 *
 * Protected by a shared secret: ?secret=<CRON_SECRET> env var.
 * If CRON_SECRET is not set, the route is disabled in production.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow in non-production OR when secret matches
  if (process.env.NODE_ENV === "production" && !expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
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
