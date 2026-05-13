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

export async function submitVerificationCase(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const profile = await getProviderProfile();

  const documentFrontUrl = (formData.get("documentFrontUrl") as string | null)?.trim() || null;
  const documentBackUrl  = (formData.get("documentBackUrl")  as string | null)?.trim() || null;
  const selfieUrl        = (formData.get("selfieUrl")        as string | null)?.trim() || null;
  const documentType     = (formData.get("documentType")     as string | null)?.trim() || "RG";

  if (!documentFrontUrl || !documentBackUrl || !selfieUrl) {
    return { error: "Envie os três arquivos antes de submeter." };
  }

  // Upsert — replace previous pending case if any
  const existing = await prisma.verificationCase.findFirst({
    where: { profileId: profile.id, status: "NOVO" },
  });

  if (existing) {
    await prisma.verificationCase.update({
      where: { id: existing.id },
      data: { documentFrontUrl, documentBackUrl, selfieUrl, documentType, waitingSince: new Date() },
    });
  } else {
    await prisma.verificationCase.create({
      data: { profileId: profile.id, documentFrontUrl, documentBackUrl, selfieUrl, documentType },
    });
  }

  revalidatePath("/conta/verificacao");
  return { success: true };
}

export async function getVerificationStatus() {
  const profile = await getProviderProfile();
  const latest = await prisma.verificationCase.findFirst({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true },
  });
  return latest;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") redirect("/");
}

export async function approveVerification(caseId: string): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const vc = await prisma.verificationCase.findUnique({
    where: { id: caseId },
    select: { id: true, profileId: true },
  });
  if (!vc) return { error: "Caso não encontrado." };

  await prisma.$transaction([
    prisma.verificationCase.update({
      where: { id: caseId },
      data: { status: "APROVADO" },
    }),
    prisma.profile.update({
      where: { id: vc.profileId },
      data: { isVerified: true },
    }),
  ]);

  revalidatePath("/admin/moderacao");
  revalidatePath("/admin/verificacoes");
  return { success: true };
}

export async function rejectVerification(caseId: string, note?: string): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();

  const vc = await prisma.verificationCase.findUnique({
    where: { id: caseId },
    select: { id: true, profileId: true },
  });
  if (!vc) return { error: "Caso não encontrado." };

  await prisma.$transaction([
    prisma.verificationCase.update({
      where: { id: caseId },
      data: { status: "REJEITADO", documentNote: note ?? null },
    }),
    prisma.profile.update({
      where: { id: vc.profileId },
      data: { isVerified: false },
    }),
  ]);

  revalidatePath("/admin/moderacao");
  revalidatePath("/admin/verificacoes");
  return { success: true };
}

export async function adminToggleVerification(profileId: string): Promise<void> {
  await requireAdmin();
  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { isVerified: true } });
  if (!profile) return;
  await prisma.profile.update({ where: { id: profileId }, data: { isVerified: !profile.isVerified } });
  revalidatePath("/admin/perfis");
}

export async function adminSetPlan(profileId: string, plan: string): Promise<void> {
  await requireAdmin();
  const valid = ["ESSENCIAL", "DESTAQUE", "PREMIUM"];
  if (!valid.includes(plan)) return;
  await prisma.profile.update({
    where: { id: profileId },
    data: { planTier: plan as "ESSENCIAL" | "DESTAQUE" | "PREMIUM" },
  });
  revalidatePath("/admin/perfis");
}
