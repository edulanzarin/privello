import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { storyId } = await req.json();
  if (!storyId) return NextResponse.json({ ok: false }, { status: 400 });

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
