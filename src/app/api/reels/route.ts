import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSubscriber, listReels } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? undefined;

  // Check subscriber status and whether viewer is a provider (owns a profile)
  let viewerIsSubscriber = false;
  let ownerId: string | undefined;
  if (userId) {
    const [subStatus, profile] = await Promise.all([
      isSubscriber(userId),
      prisma.profile.findUnique({ where: { userId }, select: { id: true } }),
    ]);
    viewerIsSubscriber = subStatus;
    // Providers always see their own private reels; pass their profile id as ownerId
    // so the query can unlock them
    if (profile) ownerId = profile.id;
  }

  const p = req.nextUrl.searchParams;
  const data = await listReels({
    cityId:    p.get("cityId")    ?? undefined,
    profileId: p.get("profileId") ?? undefined,
    cursor:    p.get("cursor")    ?? undefined,
    limit:     p.get("limit")     ? Number(p.get("limit")) : 10,
    userId,
    viewerIsSubscriber,
    ownerId,
  });
  return NextResponse.json(data);
}
