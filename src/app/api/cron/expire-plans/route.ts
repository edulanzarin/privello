import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/expire-plans?secret=<CRON_SECRET>
 *
 * Runs daily. Downgrades provider plans that have passed planExpiresAt back to
 * ESSENCIAL, and marks expired client subscriptions as EXPIRED.
 *
 * Configure in vercel.json or an external scheduler (cron-job.org, GitHub Actions)
 * to call once per day.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NODE_ENV === "production" && !expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
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
