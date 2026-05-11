"use server";

import { prisma } from "@/lib/prisma";

/**
 * Increments viewsThisMonth and viewsCurrentPeriod for a profile.
 * Called fire-and-forget from the profile page client component.
 * No auth required — counts logged-in and anonymous visitors alike.
 */
export async function trackProfileView(profileId: string) {
  try {
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
