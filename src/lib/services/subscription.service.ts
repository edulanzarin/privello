"use server";

import { prisma } from "@/lib/prisma";

/**
 * Verifica se o usuário tem uma assinatura ativa (não expirada).
 */
export async function isSubscriber(userId: string): Promise<boolean> {
    const now = new Date();
    const sub = await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", expiresAt: { gt: now } },
    });
    return !!sub;
}

/**
 * Busca a assinatura ativa do usuário.
 */
export async function getActiveSubscription(userId: string) {
    const now = new Date();
    return prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", expiresAt: { gt: now } },
    });
}
