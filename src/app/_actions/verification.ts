"use server";

/**
 * Server Actions — Verificação de identidade
 *
 * Caminho: src/app/_actions/verification.ts
 *
 * Cobre o ciclo de verificação de identidade do acompanhante:
 * - Provider: `submitVerificationCase`, `getVerificationStatus`.
 * - Admin/Moderator: `approveVerification`, `rejectVerification`,
 *   `adminToggleVerification`, `adminSetPlan`.
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`SubmitVerificationCaseSchema`,
 *   `ApproveVerificationSchema`, `RejectVerificationSchema`,
 *   `AdminToggleVerificationSchema`, `AdminSetPlanSchema` em
 *   `src/lib/validation/verification.schema.ts`).
 * - Autenticação requerida via `auth()`. Admin actions exigem
 *   `role ∈ {ADMIN, MODERATOR}` (gating por `requireAdmin`).
 * - `submitVerificationCase` é upsert: substitui um caso `NOVO` pendente do
 *   mesmo perfil em vez de empilhar novos.
 * - Revalidação de cache via `revalidatePath` em `/conta/verificacao`,
 *   `/admin/verificacoes`, `/admin/moderacao`, `/admin/perfis`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.13
 * - src/lib/validation/verification.schema.ts
 */

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

/**
 * Cria ou atualiza o caso de verificação pendente do perfil logado. Se houver
 * um caso `NOVO`, é substituído (upsert manual) com novo `waitingSince`.
 *
 * @param formData - FormData com:
 *   - `documentFrontUrl` (URL, required).
 *   - `documentBackUrl` (URL, required).
 *   - `selfieUrl` (URL, required).
 *   - `videoUrl?` (URL, nullable).
 *   - `documentType?` (`"RG" | "CNH" | "PASSAPORTE"`, default `RG`).
 * @returns `{ success: true }` em sucesso ou `{ error, issues? }` em falha.
 *
 * Side effects:
 * - `prisma.verificationCase.create` ou `update` (caso existente `NOVO`).
 * - `revalidatePath("/conta/verificacao")`.
 *
 * @see src/lib/validation/verification.schema.ts (`SubmitVerificationCaseSchema`)
 */
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

/**
 * Retorna o caso de verificação mais recente do perfil logado (somente
 * `status` e `createdAt`).
 *
 * @returns `{ status, createdAt } | null`.
 */
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

/**
 * Aprova um caso de verificação e marca o `Profile.isVerified = true`.
 *
 * @param caseId - cuid do `VerificationCase` (`ApproveVerificationSchema`).
 * @returns `{ success: true }` em sucesso ou `{ error, issues? }` em falha.
 *
 * Side effects:
 * - `prisma.$transaction`:
 *   - `VerificationCase.update({ status: "APROVADO" })`.
 *   - `Profile.update({ isVerified: true })`.
 * - `revalidatePath("/admin/moderacao")` e `("/admin/verificacoes")`.
 *
 * @see src/lib/validation/verification.schema.ts (`ApproveVerificationSchema`)
 */
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

/**
 * Rejeita um caso de verificação, registra a nota opcional e força
 * `Profile.isVerified = false`.
 *
 * @param caseId - cuid do `VerificationCase`.
 * @param note - Nota opcional do moderador (trim, ≤1000 chars, nullable —
 *   `RejectVerificationSchema`).
 * @returns `{ success: true }` em sucesso ou `{ error, issues? }` em falha.
 *
 * Side effects:
 * - `prisma.$transaction`:
 *   - `VerificationCase.update({ status: "REJEITADO", documentNote })`.
 *   - `Profile.update({ isVerified: false })`.
 * - `revalidatePath("/admin/moderacao")` e `("/admin/verificacoes")`.
 *
 * @see src/lib/validation/verification.schema.ts (`RejectVerificationSchema`)
 */
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

/**
 * Inverte o flag `isVerified` de um perfil (admin override).
 *
 * @param profileId - cuid do `Profile` (`AdminToggleVerificationSchema`).
 * @returns `void` (silencioso em validation fail / perfil ausente).
 *
 * Side effects:
 * - `prisma.profile.update({ isVerified: !current })`.
 * - `revalidatePath("/admin/perfis")`.
 *
 * @see src/lib/validation/verification.schema.ts (`AdminToggleVerificationSchema`)
 */
export async function adminToggleVerification(profileId: string): Promise<void> {
  await requireAdmin();
  const parsed = AdminToggleVerificationSchema.safeParse({ profileId });
  if (!parsed.success) return;
  const profile = await prisma.profile.findUnique({ where: { id: parsed.data.profileId }, select: { isVerified: true } });
  if (!profile) return;
  await prisma.profile.update({ where: { id: parsed.data.profileId }, data: { isVerified: !profile.isVerified } });
  revalidatePath("/admin/perfis");
}

/**
 * Define manualmente o `planTier` de um perfil (admin override).
 *
 * @param profileId - cuid do `Profile`.
 * @param plan - `"ESSENCIAL" | "DESTAQUE" | "PREMIUM"` (`AdminSetPlanSchema`).
 * @returns `void` (silencioso em validation fail).
 *
 * Side effects:
 * - `prisma.profile.update({ planTier })`.
 * - `revalidatePath("/admin/perfis")`.
 *
 * @see src/lib/validation/verification.schema.ts (`AdminSetPlanSchema`)
 */
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
