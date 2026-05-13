"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { passwordResetTemplate } from "@/lib/email-templates";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

export async function requestPasswordReset(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get("email") as string ?? "").trim().toLowerCase();
  if (!email) return { error: "Email obrigatório." };

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

export async function resetPassword(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const token = (formData.get("token") as string ?? "").trim();
  const password = (formData.get("password") as string ?? "");
  const confirm = (formData.get("confirm") as string ?? "");

  if (!token) return { error: "Token inválido." };
  if (password.length < 8) return { error: "Senha deve ter ao menos 8 caracteres." };
  if (password !== confirm) return { error: "Senhas não conferem." };

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
