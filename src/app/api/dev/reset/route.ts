/**
 * Route Handler — Utilitário dev de reset destrutivo do banco.
 *
 * Endpoint: `GET /api/dev/reset`
 *
 * Apaga em ordem segura (respeitando FKs) todos os dados transacionais e
 * perfis/usuários **não-admin**. Mantém `User.role === "ADMIN"` e tudo a que
 * eles estão obrigatoriamente atrelados via cascade.
 *
 * **Não deve ser exposto em produção** — `requireAdminOrToken` retorna 404
 * quando `NODE_ENV === "production"` sem o admin token correto.
 *
 * Convenções:
 * - Autenticação: `requireAdminOrToken` — sessão admin **ou** token via header
 *   (`X-Dev-Token` ou `Authorization: Bearer`). Em produção sem token correto,
 *   responde 404 para esconder a existência do endpoint.
 * - Rate limit: n/a (gateado pela auth).
 * - Validação Zod: n/a (sem body/query do usuário).
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.2 (`/api/dev/reset`).
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
 * Apaga (em uma `$transaction`) todos os dados transacionais, mídias, perfis,
 * sessões e usuários não-admin.
 *
 * Body/query: nenhum (auth via sessão admin ou header).
 *
 * @returns
 *   - 200: `{ ok: true, message: string }`.
 *   - 401: token inválido em ambiente dev.
 *   - 404: ambiente de produção sem token válido (oculto por design).
 *
 * Side effects (todos via `$transaction`):
 * - DB: `deleteMany` em ordem de dependência: `WhatsAppClick`,
 *   `FinancialRecord`, `Review`, `Favorite`, `StoryLike`, `StoryView`,
 *   `Story`, `MediaLike`, `MediaComment`, `Media`, `VerificationCase`,
 *   `AvailabilityRule`, `ProfileDurationOption`, `Profile`, `Account`,
 *   `Session`, e `User { role: { not: "ADMIN" } }`.
 *
 * @see .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.2
 * @see src/lib/security/dev-auth.ts
 */
export async function GET(req: Request) {
  const result = await requireAdminOrToken(req);
  if (!result.ok) {
    const body =
      result.status === 404
        ? { error: "Not Found" }
        : { error: DEV_AUTH_UNAUTHORIZED_MESSAGE };
    return NextResponse.json(body, { status: result.status });
  }

  // Delete in dependency order to avoid FK violations
  await prisma.$transaction([
    prisma.whatsAppClick.deleteMany(),
    prisma.financialRecord.deleteMany(),
    prisma.review.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.storyLike.deleteMany(),
    prisma.storyView.deleteMany(),
    prisma.story.deleteMany(),
    prisma.mediaLike.deleteMany(),
    prisma.mediaComment.deleteMany(),
    prisma.media.deleteMany(),
    prisma.verificationCase.deleteMany(),
    prisma.availabilityRule.deleteMany(),
    prisma.profileDurationOption.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } }),
  ]);

  return NextResponse.json({ ok: true, message: "Todos os perfis e usuários (não-admin) foram apagados." });
}
