import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { storyId } = await req.json();
  if (!storyId) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.storyView.upsert({
    where: { storyId_userId: { storyId, userId: session.user.id } },
    update: { viewedAt: new Date() },
    create: { storyId, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
