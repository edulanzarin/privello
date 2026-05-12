import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  // Must be CLIENT (not a provider) to like
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "CLIENT") return NextResponse.json({ ok: false, error: "only_clients" }, { status: 403 });

  const { storyId } = await req.json();
  if (!storyId) return NextResponse.json({ ok: false }, { status: 400 });

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
}
