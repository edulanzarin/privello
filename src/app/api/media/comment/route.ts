import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubscriber } from "@/lib/queries";
import {
  CommentListQuerySchema,
  CommentBodySchema,
  CommentDeleteBodySchema,
} from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitConfigFor } from "@/lib/rate-limit-config";

export async function GET(req: NextRequest) {
  const result = CommentListQuerySchema.safeParse({
    mediaId: req.nextUrl.searchParams.get("mediaId"),
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const comments = await prisma.mediaComment.findMany({
    where: { mediaId: result.data.mediaId },
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

  // Rate limit: 5 comments per minute per userId. Excess returns 429 with
  // a Retry-After header and a structured audit log line.
  const rl = await rateLimit(rateLimitConfigFor("comment", session.user.id));
  if (!rl.allowed) {
    console.warn({
      ts: Date.now(),
      endpoint: "comment",
      key: session.user.id,
      retryAfter: rl.retryAfter,
    });
    return NextResponse.json(
      { error: "Muitos comentários em pouco tempo. Tente novamente em alguns instantes." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter ?? 60) },
      },
    );
  }

  const result = CommentBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { mediaId, text } = result.data;

  const comment = await prisma.mediaComment.create({
    data: { mediaId, userId: session.user.id, text },
    include: { user: { select: { id: true, name: true, slug: true } } },
  });
  return NextResponse.json({ comment });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const result = CommentDeleteBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { commentId } = result.data;

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
