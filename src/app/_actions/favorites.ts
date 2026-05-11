"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Faça login para curtir perfis." };

  const userId = session.user.id;

  const existing = await prisma.favorite.findUnique({
    where: { userId_profileId: { userId, profileId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/conta/perfil");
    return { favorited: false };
  } else {
    await prisma.favorite.create({ data: { userId, profileId } });
    revalidatePath("/conta/perfil");
    return { favorited: true };
  }
}

export async function getFavoriteStatus(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  const fav = await prisma.favorite.findUnique({
    where: { userId_profileId: { userId: session.user.id, profileId } },
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
