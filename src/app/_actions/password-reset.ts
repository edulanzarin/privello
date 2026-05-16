"use server";

/**
 * Server Actions — Recuperação de senha
 *
 * Caminho: src/app/_actions/password-reset.ts
 *
 * Cobre o fluxo de recuperação de senha por e-mail:
 *   1. `requestPasswordReset` — gera token, persiste em `VerificationToken`
 *      (identifier `reset:<email>`) e dispara e-mail de reset.
 *   2. `resetPassword` — valida token e atualiza a senha (bcrypt cost 12).
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`RequestPasswordResetSchema`, `ResetPasswordSchema`
 *   em `src/lib/validation/password-reset.schema.ts`).
 * - Token: `crypto.randomBytes(32).toString("hex")`, expira em 1 h.
 * - Anti-enumeração: `requestPasswordReset` retorna `{ success: true }` mesmo
 *   se o e-mail não existir.
 * - Token consumido (`delete`) após reset bem-sucedido ou expiração.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.7
 * - src/lib/validation/password-reset.schema.ts
 * - src/lib/email-templates.ts (`passwordResetTemplate`)
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { passwordResetTemplate } from "@/lib/email-templates";
import {
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  formDataToObject,
} from "@/lib/validation";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

/**
 * Inicia o fluxo de redefinição de senha. Sempre retorna `{ success: true }`
 * para evitar enumeração de e-mails, independentemente da existência da conta.
 *
 * @param formData - FormData com:
 *   - `email` (string, e-mail válido, lowercased + trim — `RequestPasswordResetSchema`).
 * @returns `{ success: true }` em sucesso (mesmo quando o e-mail não existe);
 *   `{ error, issues? }` apenas em falha de validação.
 *
 * Side effects (apenas se a conta existe e tem `password`):
 * - `prisma.verificationToken.deleteMany({ identifier: "reset:<email>" })`.
 * - `prisma.verificationToken.create` com expiração de 1 h.
 * - `sendEmail` com link para `${BASE_URL}/recuperar-senha/<token>`.
 *
 * @see src/lib/validation/password-reset.schema.ts (`RequestPasswordResetSchema`)
 */
export async function requestPasswordReset(
  formData: FormData,
): Promise<{ error?: string; issues?: import("zod").ZodIssue[]; success?: boolean }> {
  const parsed = RequestPasswordResetSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Retorna sucesso mesmo se o email não existir (evita enumeração)
  if (!user || !user.password) return { success: true };

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${email}` },
  });
  await prisma.verificationToken.create({
    data: { identifier: `reset:${email}`, token, expires },
  });

  const resetUrl = `${BASE_URL}/recuperar-senha/${token}`;
  await sendEmail({
    to: email,
    subject: "Redefinir senha — Privello",
    html: passwordResetTemplate(resetUrl),
  });

  return { success: true };
}

/**
 * Consome o token de reset, atualiza a senha do usuário e remove o token.
 *
 * @param formData - FormData com:
 *   - `token` (string, min 1).
 *   - `password` (string, min 8).
 *   - `confirm` (string, min 8) com refinement `password === confirm`
 *     (`ResetPasswordSchema`).
 * @returns `{ success: true }` em sucesso ou `{ error, issues? }` em falha
 *   (token inválido, expirado ou validação falha).
 *
 * Side effects:
 * - `prisma.verificationToken.delete` (após sucesso ou expiração).
 * - `prisma.user.update({ password: hash })` (bcrypt cost 12).
 *
 * @see src/lib/validation/password-reset.schema.ts (`ResetPasswordSchema`)
 */
export async function resetPassword(
  formData: FormData,
): Promise<{ error?: string; issues?: import("zod").ZodIssue[]; success?: boolean }> {
  const parsed = ResetPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { token, password } = parsed.data;

  const record = await prisma.verificationToken.findFirst({
    where: { token, identifier: { startsWith: "reset:" } },
  });

  if (!record) return { error: "Link inválido ou já utilizado." };
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { error: "Link expirado. Solicite um novo." };
  }

  const email = record.identifier.replace("reset:", "");
  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({ where: { email }, data: { password: hashed } });
  await prisma.verificationToken.delete({ where: { token } });

  return { success: true };
}
