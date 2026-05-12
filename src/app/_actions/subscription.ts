"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createSubscriptionAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado." };
  if (session.user.role !== "CLIENT") return { error: "Apenas clientes podem assinar." };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Cancel any existing active subscription first
  await prisma.subscription.updateMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });

  await prisma.subscription.create({
    data: { userId: session.user.id, status: "ACTIVE", expiresAt },
  });

  return { ok: true };
}
