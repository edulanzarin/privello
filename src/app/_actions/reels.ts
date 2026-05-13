"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function getProviderProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");
  return profile;
}

export async function createReel(formData: FormData) {
  const profile = await getProviderProfile();
  const url       = (formData.get("url") as string).trim();
  const caption   = (formData.get("caption") as string | null)?.trim() || null;
  const isPrivate = formData.get("isPrivate") === "true";
  if (!url) return { error: "URL inválida." };

  const count = await prisma.media.count({ where: { profileId: profile.id, mediaType: "REEL" } });

  await prisma.media.create({
    data: {
      profileId: profile.id,
      url,
      caption,
      isPublic: !isPrivate,
      sortOrder: count,
      isCover: false,
      mediaType: "REEL",
    },
  });

  revalidatePath("/painel/reels");
  return { success: true };
}

export async function deleteReel(mediaId: string) {
  const profile = await getProviderProfile();
  await prisma.media.deleteMany({ where: { id: mediaId, profileId: profile.id, mediaType: "REEL" } });
  revalidatePath("/painel/reels");
}

export async function toggleReelPrivacy(mediaId: string) {
  const profile = await getProviderProfile();
  const reel = await prisma.media.findFirst({
    where: { id: mediaId, profileId: profile.id, mediaType: "REEL" },
    select: { id: true, isPublic: true },
  });
  if (!reel) return { error: "Reel não encontrado." };

  await prisma.media.update({
    where: { id: reel.id },
    data: { isPublic: !reel.isPublic },
  });

  revalidatePath("/painel/reels");
  return { isPublic: !reel.isPublic };
}
