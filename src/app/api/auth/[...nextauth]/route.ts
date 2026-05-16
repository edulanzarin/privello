/**
 * Route Handler — NextAuth catch-all.
 *
 * Endpoint: `GET, POST /api/auth/[...nextauth]` (catch-all do NextAuth: signin,
 * signout, callback, csrf, providers, session, etc.).
 *
 * Re-exporta os handlers `GET` e `POST` produzidos por `NextAuth(authOptions)`
 * em `src/lib/auth.ts`. Não há lógica adicional aqui: o roteamento, a
 * validação de credenciais e a emissão do JWT/sessão são responsabilidade do
 * próprio NextAuth.
 *
 * Convenções:
 * - Autenticação: definida pelo NextAuth (Credentials provider hoje).
 * - Rate limit: aplicado em `signIn` via `rateLimitConfigFor("login", ip)` no
 *   callback do provider em `src/lib/auth.ts` (5 req / 15 min por IP).
 * - Validação Zod: n/a aqui (o schema de `loginAction` está em
 *   `src/lib/validation/auth.schema.ts`; este handler é o endpoint nativo do
 *   NextAuth).
 *
 * Cross-refs:
 * - src/lib/auth.ts — definição de `handlers` e `authOptions`.
 * - .kiro/specs/fase-1-seguranca/rate-limits.md §"Tabela canônica" (linha `login`).
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
