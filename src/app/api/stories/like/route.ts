import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoriesLikeBodySchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = StoriesLikeBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten(), { status: 400 });
  }
  const { storyId } = parsed.data;

  try {
    // Verify story exists
    const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
    if (!story) return NextResponse.json({ ok: false, error: "Story not found" }, { status: 404 });

    const existing = await prisma.storyLike.findUnique({
      where: { storyId_userId: { storyId, userId: session.user.id } },
    });

    if (existing) {
      await prisma.storyLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.storyLike.create({ data: { storyId, userId: session.user.id } });
      return NextResponse.json({ liked: true });
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
