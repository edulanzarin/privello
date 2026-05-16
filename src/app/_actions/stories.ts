"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateStorySchema, DeleteStorySchema, formDataToObject } from "@/lib/validation";

async function getProviderProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");
  return profile;
}

export async function createStory(formData: FormData) {
  const profile = await getProviderProfile();
  const parsed = CreateStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;
  const { mediaUrl, caption, mediaType } = parsed.data;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.story.create({
    data: { profileId: profile.id, mediaUrl, mediaType, caption: caption ?? null, expiresAt },
  });

  revalidatePath("/painel/perfil");
  revalidatePath("/painel/stories");
}

export async function deleteStory(formData: FormData) {
  const profile = await getProviderProfile();
  const parsed = DeleteStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;

  await prisma.story.deleteMany({ where: { id: parsed.data.storyId, profileId: profile.id } });

  revalidatePath("/painel/perfil");
  revalidatePath("/painel/stories");
}
