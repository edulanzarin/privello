import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubscriber } from "@/lib/services";
import { ReviewBodySchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const subscriber = await isSubscriber(session.user.id);
  if (!subscriber) {
    return NextResponse.json({ error: "Apenas assinantes podem avaliar." }, { status: 403 });
  }

  const result = ReviewBodySchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }
  const { profileSlug, rating, comment } = result.data;

  const profile = await prisma.profile.findUnique({ where: { slug: profileSlug } });
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  const profileId = profile.id;

  // Upsert so the user can update their existing review
  await prisma.review.upsert({
    where: { profileId_userId: { profileId, userId: session.user.id } },
    update: { rating, comment: comment ?? null, updatedAt: new Date() },
    create: { profileId, userId: session.user.id, rating, comment: comment ?? null },
  });

  // Recompute cached avg + count on the profile
  const stats = await prisma.review.aggregate({
    where: { profileId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.profile.update({
    where: { id: profileId },
    data: {
      ratingAvg: stats._avg.rating ?? 0,
      ratingCount: stats._count.rating,
    },
  });

  return NextResponse.json({ ok: true });
}
