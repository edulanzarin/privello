import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubscriber } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const mediaId = req.nextUrl.searchParams.get("mediaId");
  if (!mediaId) return NextResponse.json({ error: "mediaId obrigatório." }, { status: 400 });

  const comments = await prisma.mediaComment.findMany({
    where: { mediaId },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: { user: { select: { id: true, name: true, slug: true } } },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const subscriber = await isSubscriber(session.user.id);
  if (!subscriber) {
    return NextResponse.json({ error: "Apenas assinantes podem comentar." }, { status: 403 });
  }

  const { mediaId, text } = await req.json() as { mediaId: string; text: string };
  if (!mediaId || !text?.trim()) return NextResponse.json({ error: "Campos obrigatórios." }, { status: 400 });
  if (text.length > 500) return NextResponse.json({ error: "Comentário muito longo." }, { status: 400 });

  const comment = await prisma.mediaComment.create({
    data: { mediaId, userId: session.user.id, text: text.trim() },
    include: { user: { select: { id: true, name: true, slug: true } } },
  });
  return NextResponse.json({ comment });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { commentId } = await req.json() as { commentId: string };
  if (!commentId) return NextResponse.json({ error: "commentId obrigatório." }, { status: 400 });

  const comment = await prisma.mediaComment.findUnique({
    where: { id: commentId },
    include: { media: { include: { profile: { select: { userId: true } } } } },
  });
  if (!comment) return NextResponse.json({ error: "Comentário não encontrado." }, { status: 404 });

  const isOwn = comment.userId === session.user.id;
  const isProfileOwner = comment.media.profile.userId === session.user.id;
  if (!isOwn && !isProfileOwner) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  await prisma.mediaComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
