"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { emailVerificationTemplate } from "@/lib/email-templates";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

export async function sendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, verified: true },
  });
  if (!user || user.verified) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await prisma.verificationToken.deleteMany({
    where: { identifier: `verify:${user.email}` },
  });
  await prisma.verificationToken.create({
    data: { identifier: `verify:${user.email}`, token, expires },
  });

  const verifyUrl = `${BASE_URL}/verificar-email/${token}`;
  await sendEmail({
    to: user.email,
    subject: "Confirme seu email — Privello",
    html: emailVerificationTemplate(verifyUrl, user.name),
  });
}

export async function resendVerificationEmail(userId: string): Promise<{ error?: string; success?: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, verified: true },
  });
  if (!user) return { error: "Usuário não encontrado." };
  if (user.verified) return { error: "E-mail já verificado." };

  await sendVerificationEmail(userId);
  return { success: true };
}

export async function verifyEmailToken(
  token: string,
): Promise<{ error?: string; success?: boolean }> {
  if (!token) return { error: "Token inválido." };

  const record = await prisma.verificationToken.findFirst({
    where: { token, identifier: { startsWith: "verify:" } },
  });

  if (!record) return { error: "Link inválido ou já utilizado." };
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { error: "Link expirado." };
  }

  const email = record.identifier.replace("verify:", "");
  await prisma.user.update({ where: { email }, data: { verified: true } });
  await prisma.verificationToken.delete({ where: { token } });

  return { success: true };
}
