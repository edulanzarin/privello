// src/lib/security/cron-auth.pbt.ts
//
// Property-based tests for `src/lib/security/cron-auth.ts`.
//
// Validates Properties 5 and 6 enunciadas em
// `.kiro/specs/fase-1-seguranca/design.md > Correctness Properties`:
//
//   - Property 5: Cron auth aceita exatamente os três caminhos durante a
//                 janela de transição (Authorization Bearer, X-Cron-Secret,
//                 ?secret= deprecated). Cada caminho retorna o `source`
//                 correspondente quando `now <= transitionEndsAt`.
//
//   - Property 6: Cron auth rejeita query string após `transitionEndsAt`
//                 quando esta é a única fonte do segredo; o caminho
//                 Authorization continua válido após a janela.
//
// O segredo esperado é exposto via `process.env.CRON_SECRET`, que é lido em
// runtime pelo `verifyCronSecret`. Em cada `beforeEach` setamos um valor
// determinístico e em `afterEach` removemos para evitar vazamento entre
// testes. Os geradores `fc.string()` existem para fazer fast-check rodar a
// propriedade `numRuns` vezes — o input em si não é o foco; o foco é o
// caminho de credencial sendo exercitado.
//
// Este arquivo cumpre o task 9.3 de `tasks.md` desta fase.

import { describe, expect, beforeEach, afterEach } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { verifyCronSecret } from "@/lib/security/cron-auth";

const SECRET = "super-secret-test-value-for-pbt";

describe("cron-auth / Property 5: três caminhos durante a janela", () => {
    beforeEach(() => {
        process.env.CRON_SECRET = SECRET;
    });
    afterEach(() => {
        delete process.env.CRON_SECRET;
    });

    const futureDate = new Date("2099-01-01T00:00:00Z");

    // **Validates: Requirements 2.2, 2.3, 2.4, 2.5** (Property 5)
    test.prop([fc.string()])(
        "Authorization: Bearer <secret> → ok with source=header-authorization",
        () => {
            const req = new Request("http://example.com/api/cron/test", {
                headers: { authorization: `Bearer ${SECRET}` },
            });
            const r = verifyCronSecret(req, { transitionEndsAt: futureDate });
            expect(r.ok).toBe(true);
            if (r.ok) expect(r.source).toBe("header-authorization");
        },
    );

    // **Validates: Requirements 2.2, 2.3, 2.4, 2.5** (Property 5)
    test.prop([fc.string()])(
        "X-Cron-Secret: <secret> → ok with source=header-x-cron-secret",
        () => {
            const req = new Request("http://example.com/api/cron/test", {
                headers: { "x-cron-secret": SECRET },
            });
            const r = verifyCronSecret(req, { transitionEndsAt: futureDate });
            expect(r.ok).toBe(true);
            if (r.ok) expect(r.source).toBe("header-x-cron-secret");
        },
    );

    // **Validates: Requirements 2.2, 2.3, 2.4, 2.5** (Property 5)
    test.prop([fc.string()])(
        "?secret=<secret> within window → ok with source=query-secret-deprecated",
        () => {
            const req = new Request(
                `http://example.com/api/cron/test?secret=${encodeURIComponent(SECRET)}`,
            );
            const r = verifyCronSecret(req, { transitionEndsAt: futureDate });
            expect(r.ok).toBe(true);
            if (r.ok) expect(r.source).toBe("query-secret-deprecated");
        },
    );
});

describe("cron-auth / Property 6: rejeição após transitionEndsAt", () => {
    beforeEach(() => {
        process.env.CRON_SECRET = SECRET;
    });
    afterEach(() => {
        delete process.env.CRON_SECRET;
    });

    const past = new Date("2020-01-01T00:00:00Z");

    // **Validates: Requirements 2.4** (Property 6)
    test.prop([fc.string()])(
        "query-only request rejected after transition window",
        () => {
            const req = new Request(
                `http://example.com/api/cron/test?secret=${encodeURIComponent(SECRET)}`,
            );
            const r = verifyCronSecret(req, {
                transitionEndsAt: past,
                now: new Date(past.getTime() + 1),
            });
            expect(r.ok).toBe(false);
        },
    );

    // **Validates: Requirements 2.4** (Property 6)
    test.prop([fc.string()])(
        "header-authorization still works after window",
        () => {
            const req = new Request("http://example.com/api/cron/test", {
                headers: { authorization: `Bearer ${SECRET}` },
            });
            const r = verifyCronSecret(req, {
                transitionEndsAt: past,
                now: new Date(past.getTime() + 1),
            });
            expect(r.ok).toBe(true);
        },
    );
});
