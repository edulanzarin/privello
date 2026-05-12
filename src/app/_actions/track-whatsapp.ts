"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COOLDOWN_MS = 30 * 60 * 1000; // 30 min cooldown per profile

export async function trackWhatsAppClick(profileId: string, source: string) {
  try {
    const session = await auth();

    // Don't count if the viewer is the profile owner
    if (session?.user?.id) {
      const own = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (own?.id === profileId) return;
    }

    // Cookie-based cooldown
    const jar = await cookies();
    const key = `wa_${profileId}`;
    const last = jar.get(key)?.value;
    if (last && Date.now() - parseInt(last, 10) < COOLDOWN_MS) return;

    jar.set(key, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1800,
      path: "/",
    });

    const visitor = session?.user?.name ?? "Anônimo";

    await prisma.whatsAppClick.create({
      data: {
        profileId,
        source,
        visitor,
        verified: !!session?.user?.id,
      },
    });
  } catch {
    // Never throw
  }
}
