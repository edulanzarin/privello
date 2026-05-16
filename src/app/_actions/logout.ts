"use server";

/**
 * Server Actions — Logout
 *
 * Caminho: src/app/_actions/logout.ts
 *
 * Cobre apenas o encerramento da sessão NextAuth e redirecionamento para a
 * tela de login. Não recebe input nem aplica validação.
 *
 * Convenções:
 * - Server action Next.js 16 (`"use server"` no topo).
 * - Sem input — `signOut` é o único side effect.
 * - Redireciona para `/entrar` ao final.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.5 (sem schema Zod)
 * - src/lib/auth.ts (`signOut`)
 */

import { signOut } from "@/lib/auth";

/**
 * Encerra a sessão NextAuth e redireciona para `/entrar`.
 *
 * @returns Não retorna (redireciona via NextAuth).
 *
 * Side effects:
 * - Limpa cookies de sessão.
 * - Redirect para `/entrar`.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/entrar" });
}
