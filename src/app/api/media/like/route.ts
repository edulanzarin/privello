import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { mediaId, liked } = await req.json() as { mediaId: string; liked: boolean };
  if (!mediaId) return NextResponse.json({ error: "mediaId obrigatório." }, { status: 400 });

  if (liked) {
    await prisma.mediaLike.upsert({
      where: { mediaId_userId: { mediaId, userId: session.user.id } },
      update: {},
      create: { mediaId, userId: session.user.id },
    });
  } else {
    await prisma.mediaLike.deleteMany({ where: { mediaId, userId: session.user.id } });
  }

  const count = await prisma.mediaLike.count({ where: { mediaId } });
  return NextResponse.json({ ok: true, likeCount: count });
}
