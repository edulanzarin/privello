"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  SubmitVerificationCaseSchema,
  ApproveVerificationSchema,
  RejectVerificationSchema,
  AdminToggleVerificationSchema,
  AdminSetPlanSchema,
  formDataToObject,
} from "@/lib/validation";

async function getProviderProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");
  return profile;
}

export async function submitVerificationCase(formData: FormData): Promise<{ error?: string; issues?: import("zod").ZodIssue[]; success?: boolean }> {
  const profile = await getProviderProfile();
  const parsed = SubmitVerificationCaseSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { documentFrontUrl, documentBackUrl, selfieUrl, videoUrl, documentType } = parsed.data;

  // Upsert — replace previous pending case if any
  const existing = await prisma.verificationCase.findFirst({
    where: { profileId: profile.id, status: "NOVO" },
  });

  if (existing) {
    await prisma.verificationCase.update({
      where: { id: existing.id },
      data: {
        documentFrontUrl,
        documentBackUrl,
        selfieUrl,
        videoUrl: videoUrl ?? null,
        documentType,
        waitingSince: new Date(),
      },
    });
  } else {
    await prisma.verificationCase.create({
      data: {
        profileId: profile.id,
        documentFrontUrl,
        documentBackUrl,
        selfieUrl,
        videoUrl: videoUrl ?? null,
        documentType,
      },
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

export async function approveVerification(caseId: string): Promise<{ error?: string; issues?: import("zod").ZodIssue[]; success?: boolean }> {
  await requireAdmin();
  const parsed = ApproveVerificationSchema.safeParse({ caseId });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  const vc = await prisma.verificationCase.findUnique({
    where: { id: parsed.data.caseId },
    select: { id: true, profileId: true },
  });
  if (!vc) return { error: "Caso não encontrado." };

  await prisma.$transaction([
    prisma.verificationCase.update({
      where: { id: parsed.data.caseId },
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

export async function rejectVerification(caseId: string, note?: string): Promise<{ error?: string; issues?: import("zod").ZodIssue[]; success?: boolean }> {
  await requireAdmin();
  const parsed = RejectVerificationSchema.safeParse({ caseId, note: note ?? null });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  const vc = await prisma.verificationCase.findUnique({
    where: { id: parsed.data.caseId },
    select: { id: true, profileId: true },
  });
  if (!vc) return { error: "Caso não encontrado." };

  await prisma.$transaction([
    prisma.verificationCase.update({
      where: { id: parsed.data.caseId },
      data: { status: "REJEITADO", documentNote: parsed.data.note ?? null },
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
  const parsed = AdminToggleVerificationSchema.safeParse({ profileId });
  if (!parsed.success) return;
  const profile = await prisma.profile.findUnique({ where: { id: parsed.data.profileId }, select: { isVerified: true } });
  if (!profile) return;
  await prisma.profile.update({ where: { id: parsed.data.profileId }, data: { isVerified: !profile.isVerified } });
  revalidatePath("/admin/perfis");
}

export async function adminSetPlan(profileId: string, plan: string): Promise<void> {
  await requireAdmin();
  const parsed = AdminSetPlanSchema.safeParse({ profileId, plan });
  if (!parsed.success) return;
  await prisma.profile.update({
    where: { id: parsed.data.profileId },
    data: { planTier: parsed.data.plan },
  });
  revalidatePath("/admin/perfis");
}
