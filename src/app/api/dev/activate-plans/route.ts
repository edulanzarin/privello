/**
 * Route Handler — Utilitário dev para ativar planos em massa.
 *
 * Endpoint: `GET /api/dev/activate-plans`
 *
 * Ativa um plano de 30 dias para todos os perfis sem `planExpiresAt`. Útil em
 * dev/staging para semear o banco; **não deve ser exposto em produção** —
 * `requireAdminOrToken` retorna 404 quando `NODE_ENV === "production"` (a não
 * ser que o admin token correto seja apresentado).
 *
 * Convenções:
 * - Autenticação: `requireAdminOrToken` — sessão admin **ou** token via header
 *   (`X-Dev-Token` ou `Authorization: Bearer`). Em produção sem token correto,
 *   responde 404 para esconder a existência do endpoint.
 * - Rate limit: n/a (gateado pela auth).
 * - Validação Zod: n/a (sem body/query do usuário).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.2 (`/api/dev/activate-plans`).
 * - src/lib/security/dev-auth.ts — `requireAdminOrToken` e
 *   `DEV_AUTH_UNAUTHORIZED_MESSAGE`.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEV_AUTH_UNAUTHORIZED_MESSAGE,
  requireAdminOrToken,
} from "@/lib/security/dev-auth";

/**
 * Ativa plano de 30 dias para todos os perfis sem `planExpiresAt`.
 *
 * Body/query: nenhum (auth via sessão admin ou header).
 *
 * @returns
 *   - 200: `{ updated: number, planExpiresAt: Date, note: string }`.
 *   - 401: token inválido em ambiente dev.
 *   - 404: ambiente de produção sem token válido (oculto por design).
 *
 * Side effects:
 * - DB: `Profile.updateMany` em perfis sem plano ativo, definindo
 *   `planExpiresAt`, `isOnline = true` e `isVerified = false` (a verificação
 *   real continua passando pela aprovação manual do admin).
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.2
 * @see src/lib/security/dev-auth.ts
 */
export async function GET(req: Request) {
  const auth = await requireAdminOrToken(req);
  if (!auth.ok) {
    const body =
      auth.status === 404
        ? { error: "Not Found" }
        : { error: DEV_AUTH_UNAUTHORIZED_MESSAGE };
    return NextResponse.json(body, { status: auth.status });
  }

  const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.profile.updateMany({
    where: { planExpiresAt: null },
    data: { planExpiresAt, isOnline: true, isVerified: false },
  });

  return NextResponse.json({ updated: result.count, planExpiresAt, note: "isVerified reset to false — use admin panel to approve real verifications" });
}
