import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSubscriber, listReels } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { ReelsQuerySchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const result = ReelsQuerySchema.safeParse({
    cityId: req.nextUrl.searchParams.get("cityId") ?? undefined,
    profileId: req.nextUrl.searchParams.get("profileId") ?? undefined,
    cursor: req.nextUrl.searchParams.get("cursor") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

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
    if (profile) ownerId = profile.id;
  }

  const data = await listReels({
    cityId: result.data.cityId,
    profileId: result.data.profileId,
    cursor: result.data.cursor,
    limit: result.data.limit,
    userId,
    viewerIsSubscriber,
    ownerId,
  });
  return NextResponse.json(data);
}
