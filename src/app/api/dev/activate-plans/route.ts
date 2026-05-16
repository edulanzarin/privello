import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEV_AUTH_UNAUTHORIZED_MESSAGE,
  requireAdminOrToken,
} from "@/lib/security/dev-auth";

export async function GET(req: Request) {
  const auth = await requireAdminOrToken(req);
  if (!auth.ok) {
    const body =
      auth.status === 404
        ? { error: "Not Found" }
        : { error: DEV_AUTH_UNAUTHORIZED_MESSAGE };
    return NextResponse.json(body, { status: auth.status });
  }

  const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.profile.updateMany({
    where: { planExpiresAt: null },
    data: { planExpiresAt, isOnline: true, isVerified: false },
  });

  return NextResponse.json({ updated: result.count, planExpiresAt, note: "isVerified reset to false — use admin panel to approve real verifications" });
}
