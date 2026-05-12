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

export async function createStory(formData: FormData) {
  const profile = await getProviderProfile();
  const mediaUrl = (formData.get("mediaUrl") as string).trim();
  const caption  = (formData.get("caption") as string | null)?.trim() || null;
  if (!mediaUrl) return;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.story.create({
    data: { profileId: profile.id, mediaUrl, caption, expiresAt },
  });

  revalidatePath("/painel/perfil");
  revalidatePath("/painel/stories");
}

export async function deleteStory(formData: FormData) {
  const profile = await getProviderProfile();
  const storyId = formData.get("storyId") as string;
  if (!storyId) return;

  await prisma.story.deleteMany({ where: { id: storyId, profileId: profile.id } });

  revalidatePath("/painel/perfil");
  revalidatePath("/painel/stories");
}
