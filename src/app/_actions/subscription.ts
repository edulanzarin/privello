"use server";

/**
 * Server Actions — Assinatura do cliente
 *
 * Caminho: src/app/_actions/subscription.ts
 *
 * Cobre a criação de uma assinatura `ACTIVE` para o usuário cliente atual,
 * cancelando qualquer assinatura ativa anterior. A duração padrão vem de
 * `SUBSCRIPTION_DURATION_MS` em `src/lib/constants.ts`.
 *
 * Convenções:
 * - Server action Next.js 16 (`"use server"` no topo).
 * - Sem input externo (não recebe FormData). Ver `endpoints-zod.md §2.10`.
 * - Autenticação requerida via `auth()`; só `role === "CLIENT"` autorizado.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.10 (sem schema Zod)
 * - src/lib/constants.ts (`SUBSCRIPTION_DURATION_MS`)
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_DURATION_MS } from "@/lib/constants";

/**
 * Ativa uma assinatura para o usuário cliente atual. Cancela qualquer
 * assinatura `ACTIVE` anterior antes de criar a nova (idempotente em relação
 * ao estado vigente).
 *
 * @returns `{ ok: true }` em sucesso, `{ error }` quando não há sessão ou o
 *   papel não é `CLIENT`.
 *
 * Side effects:
 * - `prisma.subscription.updateMany({ status: "CANCELLED" })` para assinaturas
 *   `ACTIVE` anteriores do mesmo usuário.
 * - `prisma.subscription.create` com `expiresAt = now + SUBSCRIPTION_DURATION_MS`.
 */
export async function createSubscriptionAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autorizado." };
  if (session.user.role !== "CLIENT") return { error: "Apenas clientes podem assinar." };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SUBSCRIPTION_DURATION_MS);

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
