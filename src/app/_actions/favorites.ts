"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ToggleFavoriteSchema, GetFavoriteStatusSchema } from "@/lib/validation";

export async function toggleFavorite(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Faça login para curtir perfis." };

  const parsed = ToggleFavoriteSchema.safeParse({ profileId });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { profileId: pid } = parsed.data;

  // Prevent self-favoriting
  const viewerProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (viewerProfile?.id === pid) return { error: "Você não pode curtir seu próprio perfil." };

  const userId = session.user.id;

  // Guard against stale JWTs (e.g. after a DB re-seed)
  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) return { error: "Sessão expirada. Faça login novamente." };

  const existing = await prisma.favorite.findUnique({
    where: { userId_profileId: { userId, profileId: pid } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/conta/perfil");
    return { favorited: false };
  } else {
    await prisma.favorite.create({ data: { userId, profileId: pid } });
    revalidatePath("/conta/perfil");
    return { favorited: true };
  }
}

export async function getFavoriteStatus(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  const parsed = GetFavoriteStatusSchema.safeParse({ profileId });
  if (!parsed.success) return false;
  const fav = await prisma.favorite.findUnique({
    where: { userId_profileId: { userId: session.user.id, profileId: parsed.data.profileId } },
  });
  return !!fav;
}

export async function getClientFavorites() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      profile: {
        include: {
          city: { select: { name: true, slug: true } },
          district: { select: { name: true, slug: true } },
          media: {
            where: { isPublic: true, isCover: true },
            take: 1,
            select: { url: true, isCover: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
