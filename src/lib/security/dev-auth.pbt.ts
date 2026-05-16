// src/lib/security/dev-auth.pbt.ts
//
// Property-based tests for `src/lib/security/dev-auth.ts`.
//
// Validates Properties 7 and 8 enunciadas em
// `.kiro/specs/fase-1-seguranca/design.md > Correctness Properties`:
//
//   - Property 7: Dev auth produz 404 em produção sem credencial.
//                 Para todo request sem `Authorization: Bearer
//                 <DEV_ENDPOINT_TOKEN>` válido e sem sessão admin/moderator,
//                 com `NODE_ENV === "production"`, `requireAdminOrToken`
//                 retorna `{ ok: false, status: 404 }`.
//
//   - Property 8: Dev auth produz 401 em dev sem credencial, com
//                 `DEV_AUTH_UNAUTHORIZED_MESSAGE` não-vazia.
//
// Mock de `@/lib/auth`:
//   `dev-auth.ts` importa `auth` de `@/lib/auth`, que carrega NextAuth +
//   PrismaAdapter em runtime e tem um guard de produção (`AUTH_URL must be
//   defined in production`) que lança em load-time. Para isolar essas
//   propriedades do bootstrap real do NextAuth, mockamos o módulo via
//   `vi.mock`, que o Vitest hoists antes dos `import` deste arquivo. O mock
//   retorna `auth: () => null` (sem sessão), que é exatamente o cenário das
//   Properties 7/8 (sem credencial).
//
// Geradores `fc.string()` existem apenas para que fast-check execute a
// propriedade `numRuns` vezes; o input em si não muda o cenário (request
// sem credenciais). O importante é exercitar as duas ramificações de
// `NODE_ENV` (production → 404, dev → 401).
//
// Este arquivo cumpre o task 9.4 de `tasks.md` desta fase.

import { describe, expect, beforeEach, afterEach, vi } from "vitest";
import { test, fc } from "@fast-check/vitest";

vi.mock("@/lib/auth", () => ({
    auth: vi.fn(async () => null),
}));

import {
    requireAdminOrToken,
    DEV_AUTH_UNAUTHORIZED_MESSAGE,
} from "@/lib/security/dev-auth";

describe("dev-auth / Property 7: 404 em produção sem credencial", () => {
    beforeEach(() => {
        vi.stubEnv("NODE_ENV", "production");
        delete process.env.DEV_ENDPOINT_TOKEN;
    });
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    // **Validates: Requirements 1.2, 1.3** (Property 7)
    test.prop([fc.string()])(
        "request without credentials → 404 in production",
        async () => {
            const req = new Request("http://example.com/api/dev/anything");
            const r = await requireAdminOrToken(req);
            expect(r.ok).toBe(false);
            if (!r.ok) expect(r.status).toBe(404);
        },
    );
});

describe("dev-auth / Property 8: 401 em dev com mensagem não-vazia", () => {
    beforeEach(() => {
        vi.stubEnv("NODE_ENV", "development");
        delete process.env.DEV_ENDPOINT_TOKEN;
    });
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    // **Validates: Requirements 1.4** (Property 8)
    test.prop([fc.string()])(
        "request without credentials → 401 in dev",
        async () => {
            const req = new Request("http://example.com/api/dev/anything");
            const r = await requireAdminOrToken(req);
            expect(r.ok).toBe(false);
            if (!r.ok) expect(r.status).toBe(401);
        },
    );

    // **Validates: Requirements 1.4** (Property 8)
    test("DEV_AUTH_UNAUTHORIZED_MESSAGE is non-empty", () => {
        expect(DEV_AUTH_UNAUTHORIZED_MESSAGE.length).toBeGreaterThan(0);
    });
});
