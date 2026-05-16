"use server";

/**
 * src/lib/services/subscription.service.ts
 *
 * Service layer para a entidade `Subscription` (assinaturas Premium pagas via Mercado Pago).
 *
 * Cobertura:
 * - Verificação rápida de status (`isSubscriber`) para gates de feature.
 * - Lookup da assinatura ativa (`getActiveSubscription`) para detalhes (expiresAt, tier).
 *
 * Convenções:
 * - Server Action (`"use server"`) para que `isSubscriber` possa ser chamado de Client Components.
 * - "Ativa" significa `status: "ACTIVE"` E `expiresAt > now`. Status `EXPIRED`/`CANCELLED`/`PAST_DUE` retornam `false`.
 * - Pré-auditoria: parte dessa lógica vivia em `src/lib/queries.ts`. Migrada na fase-3-backend.
 *
 * Cf. webhook do Mercado Pago em `src/app/api/mp/webhook/route.ts` para fluxo de criação/renovação.
 */

import { prisma } from "@/lib/prisma";

/**
 * Verifica se o usuário tem uma assinatura ativa (não expirada).
 *
 * @returns `true` se há registro com `status: "ACTIVE"` E `expiresAt > now`; `false` caso contrário.
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
