import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaLikeBodySchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const result = MediaLikeBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { mediaId, liked } = result.data;

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
