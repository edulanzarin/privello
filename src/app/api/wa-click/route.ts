import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { profileId, source } = (await req.json()) as {
      profileId: string;
      source?: string;
    };
    if (!profileId) return NextResponse.json({ ok: false });

    const session = await auth();

    let visitor = "anônimo";
    let verified = false;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true, name: true },
      });
      visitor = user?.slug ? `@${user.slug}` : (user?.name ?? "usuário");
      verified = true;
    }

    await prisma.whatsAppClick.create({
      data: {
        profileId,
        source: source ?? "perfil",
        visitor,
        verified,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
