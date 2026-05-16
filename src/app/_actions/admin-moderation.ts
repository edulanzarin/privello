"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { warningTemplate, suspensionTemplate, unsuspensionTemplate } from "@/lib/email-templates";
import { SUSPENSION_THRESHOLD, SITE_URL } from "@/lib/constants";
import {
  GiveWarningSchema,
  SuspendProfileSchema,
  UnsuspendProfileSchema,
  DeleteAdminMediaSchema,
  ToggleMediaVisibilitySchema,
} from "@/lib/validation";

const APP_URL = process.env.NEXTAUTH_URL ?? SITE_URL;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") redirect("/");
  return session.user.id;
}

export async function giveWarning(profileId: string, reason: string): Promise<{ error?: string; issues?: import("zod").ZodIssue[]; suspended?: boolean }> {
  const adminId = await requireAdmin();

  const parsed = GiveWarningSchema.safeParse({ profileId, reason });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { profileId: pid, reason: trimmedReason } = parsed.data;

  const profile = await prisma.profile.findUnique({
    where: { id: pid },
    include: { user: { select: { email: true, name: true } }, warnings: { select: { id: true } } },
  });
  if (!profile) return { error: "Perfil não encontrado." };
  if (profile.isSuspended) return { error: "Perfil já está suspenso." };

  await prisma.warning.create({
    data: { profileId: pid, adminId, reason: trimmedReason },
  });

  const warningCount = profile.warnings.length + 1;
  let suspended = false;

  if (warningCount >= SUSPENSION_THRESHOLD) {
    await prisma.profile.update({
      where: { id: pid },
      data: { isSuspended: true, suspendedAt: new Date(), suspensionNote: `Suspenso automaticamente após ${warningCount} advertências.` },
    });
    suspended = true;

    if (profile.user.email) {
      await sendEmail({
        to: profile.user.email,
        subject: "Sua conta no Privello foi suspensa",
        html: suspensionTemplate(
          profile.displayName,
          `Suspenso automaticamente após ${warningCount} advertências.`,
          `${APP_URL}/painel`,
        ),
      });
    }
  } else if (profile.user.email) {
    await sendEmail({
      to: profile.user.email,
      subject: `Advertência recebida — Privello (${warningCount}/${SUSPENSION_THRESHOLD})`,
      html: warningTemplate(profile.displayName, trimmedReason, warningCount, `${APP_URL}/painel`),
    });
  }

  revalidatePath("/admin/perfis");
  revalidatePath(`/p/${profile.slug}`);
  return { suspended };
}

export async function suspendProfile(profileId: string, note: string): Promise<{ error?: string; issues?: import("zod").ZodIssue[] }> {
  await requireAdmin();

  const parsed = SuspendProfileSchema.safeParse({ profileId, note });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { profileId: pid, note: trimmedNote } = parsed.data;

  const profile = await prisma.profile.findUnique({
    where: { id: pid },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!profile) return { error: "Perfil não encontrado." };

  await prisma.profile.update({
    where: { id: pid },
    data: { isSuspended: true, suspendedAt: new Date(), suspensionNote: trimmedNote || null },
  });

  if (profile.user.email) {
    await sendEmail({
      to: profile.user.email,
      subject: "Sua conta no Privello foi suspensa",
      html: suspensionTemplate(profile.displayName, trimmedNote || null, `${APP_URL}/painel`),
    });
  }

  revalidatePath("/admin/perfis");
  revalidatePath(`/p/${profile.slug}`);
  return {};
}

export async function unsuspendProfile(profileId: string): Promise<{ error?: string; issues?: import("zod").ZodIssue[] }> {
  await requireAdmin();

  const parsed = UnsuspendProfileSchema.safeParse({ profileId });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { profileId: pid } = parsed.data;

  const profile = await prisma.profile.findUnique({
    where: { id: pid },
    include: { user: { select: { email: true } } },
  });
  if (!profile) return { error: "Perfil não encontrado." };

  await prisma.profile.update({
    where: { id: pid },
    data: { isSuspended: false, suspendedAt: null, suspensionNote: null },
  });

  if (profile.user.email) {
    await sendEmail({
      to: profile.user.email,
      subject: "Sua conta no Privello foi reativada",
      html: unsuspensionTemplate(profile.displayName, `${APP_URL}/painel`),
    });
  }

  revalidatePath("/admin/perfis");
  revalidatePath(`/p/${profile.slug}`);
  return {};
}

export async function deleteAdminMedia(mediaId: string): Promise<{ error?: string; issues?: import("zod").ZodIssue[] }> {
  await requireAdmin();

  const parsed = DeleteAdminMediaSchema.safeParse({ mediaId });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { mediaId: mid } = parsed.data;

  const media = await prisma.media.findUnique({
    where: { id: mid },
    include: { profile: { select: { slug: true } } },
  });
  if (!media) return { error: "Mídia não encontrada." };

  await prisma.media.delete({ where: { id: mid } });

  revalidatePath("/admin/midias");
  revalidatePath(`/p/${media.profile.slug}`);
  return {};
}

export async function toggleMediaVisibility(mediaId: string): Promise<{ error?: string; issues?: import("zod").ZodIssue[] }> {
  await requireAdmin();

  const parsed = ToggleMediaVisibilitySchema.safeParse({ mediaId });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { mediaId: mid } = parsed.data;

  const media = await prisma.media.findUnique({
    where: { id: mid },
    include: { profile: { select: { slug: true } } },
  });
  if (!media) return { error: "Mídia não encontrada." };

  await prisma.media.update({
    where: { id: mid },
    data: { isPublic: !media.isPublic },
  });

  revalidatePath("/admin/midias");
  revalidatePath(`/p/${media.profile.slug}`);
  return {};
}
