"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/**
 * Increments view counts with anti-spam protection:
 * - Providers never count views on their own profile
 * - Same visitor (cookie-based) can only count once per hour per profile
 */
export async function trackProfileView(profileId: string) {
  try {
    const session = await auth();

    // Don't count if the viewer is the profile owner
    if (session?.user?.id) {
      const ownProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (ownProfile?.id === profileId) return;
    }

    // Cookie-based cooldown: "pv_<profileId>" = timestamp of last view
    const jar = await cookies();
    const cookieKey = `pv_${profileId}`;
    const lastView = jar.get(cookieKey)?.value;

    if (lastView) {
      const elapsed = Date.now() - parseInt(lastView, 10);
      if (elapsed < COOLDOWN_MS) return; // still in cooldown
    }

    // Set cookie for 1h
    jar.set(cookieKey, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        viewsThisMonth: { increment: 1 },
        viewsCurrentPeriod: { increment: 1 },
      },
    });
  } catch {
    // Never throw — view tracking must never break the page
  }
}
