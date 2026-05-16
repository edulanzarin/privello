import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoriesViewBodySchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitConfigFor } from "@/lib/rate-limit-config";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = StoriesViewBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { storyId } = parsed.data;

  // Idempotent rate-limit: 1 view per (userId, storyId) per hour. On excess
  // we return 200 silently and SKIP the prisma upsert — repeat views in the
  // same window must not bump counters (per `rate-limits.md`).
  const rl = await rateLimit(rateLimitConfigFor("storyView", `${session.user.id}:${storyId}`));
  if (!rl.allowed) {
    return NextResponse.json({ ok: true });
  }

  try {
    // Verify story exists before upserting
    const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
    if (!story) return NextResponse.json({ ok: false, error: "Story not found" }, { status: 404 });

    await prisma.storyView.upsert({
      where: { storyId_userId: { storyId, userId: session.user.id } },
      update: { viewedAt: new Date() },
      create: { storyId, userId: session.user.id },
    });
  } catch {
    // Gracefully handle foreign key errors (story may have expired/been deleted)
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
