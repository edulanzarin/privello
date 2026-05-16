import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEV_AUTH_UNAUTHORIZED_MESSAGE,
  requireAdminOrToken,
} from "@/lib/security/dev-auth";

export async function GET(req: Request) {
  const result = await requireAdminOrToken(req);
  if (!result.ok) {
    const body =
      result.status === 404
        ? { error: "Not Found" }
        : { error: DEV_AUTH_UNAUTHORIZED_MESSAGE };
    return NextResponse.json(body, { status: result.status });
  }

  // Delete in dependency order to avoid FK violations
  await prisma.$transaction([
    prisma.whatsAppClick.deleteMany(),
    prisma.financialRecord.deleteMany(),
    prisma.review.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.storyLike.deleteMany(),
    prisma.storyView.deleteMany(),
    prisma.story.deleteMany(),
    prisma.mediaLike.deleteMany(),
    prisma.mediaComment.deleteMany(),
    prisma.media.deleteMany(),
    prisma.verificationCase.deleteMany(),
    prisma.availabilityRule.deleteMany(),
    prisma.profileDurationOption.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } }),
  ]);

  return NextResponse.json({ ok: true, message: "Todos os perfis e usuários (não-admin) foram apagados." });
}
