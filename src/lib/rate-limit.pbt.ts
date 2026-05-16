// src/lib/rate-limit.pbt.ts
//
// Property-based tests for `src/lib/rate-limit.ts`.
//
// Validates the three Correctness Properties enunciadas em
// `.kiro/specs/fase-1-seguranca/design.md > Correctness Properties`:
//
//   - Property 1: limit dentro da janela
//       Para toda chave `k` e config `{ windowSec, limit }`, as primeiras
//       `limit` chamadas em `rateLimit` retornam `allowed: true` e a
//       `(limit + 1)`-ésima retorna `allowed: false` com
//       `retryAfter` em `[0, windowSec]`.
//
//   - Property 2: independência entre chaves
//       Para todo par `k1 ≠ k2`, exaurir `k1` não afeta `k2`.
//
//   - Property 3: reset após `windowSec`
//       Avançar `(windowSec + 1) * 1000` ms libera a próxima chamada.
//
// Time é controlado via `vi.useFakeTimers()` (determinismo). O store
// `InMemoryRateLimiterStore` desliga seu cleanup interval automaticamente
// quando `process.env.NODE_ENV === "test"` (Vitest seta isso por padrão), o
// que evita vazamento de handles e conflito com fake timers.
//
// Este arquivo cumpre o task 9.1 de `tasks.md` desta fase.

import { describe, expect, beforeEach, afterEach, vi } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { rateLimit, InMemoryRateLimiterStore } from "@/lib/rate-limit";

describe("rate-limit / Property 1: limit dentro da janela", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    // **Validates: Requirements 5.1, 5.2** (Property 1)
    test.prop([
        fc.string({ minLength: 1, maxLength: 32 }),
        fc.integer({ min: 1, max: 60 }),
        fc.integer({ min: 1, max: 100 }),
    ])(
        "first `limit` calls are allowed; the (limit+1)-th is denied",
        async (key, windowSec, limit) => {
            const store = new InMemoryRateLimiterStore();
            try {
                for (let i = 1; i <= limit; i++) {
                    const r = await rateLimit(
                        { scope: "ip", key, windowSec, limit },
                        store,
                    );
                    expect(r.allowed).toBe(true);
                }

                const denied = await rateLimit(
                    { scope: "ip", key, windowSec, limit },
                    store,
                );
                expect(denied.allowed).toBe(false);
                expect(denied.retryAfter).toBeGreaterThanOrEqual(0);
                expect(denied.retryAfter).toBeLessThanOrEqual(windowSec);
            } finally {
                store.dispose();
            }
        },
    );
});

describe("rate-limit / Property 2: independência entre chaves", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    // **Validates: Requirements 5.1** (Property 2)
    test.prop([
        fc.string({ minLength: 1, maxLength: 16 }),
        fc.string({ minLength: 1, maxLength: 16 }),
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 1, max: 50 }),
    ])(
        "exhausting key k1 does not affect k2",
        async (k1, k2, windowSec, limit) => {
            // Pré-condição da propriedade: chaves distintas.
            if (k1 === k2) return;

            const store = new InMemoryRateLimiterStore();
            try {
                for (let i = 1; i <= limit + 1; i++) {
                    await rateLimit(
                        { scope: "ip", key: k1, windowSec, limit },
                        store,
                    );
                }

                const r = await rateLimit(
                    { scope: "ip", key: k2, windowSec, limit },
                    store,
                );
                expect(r.allowed).toBe(true);
            } finally {
                store.dispose();
            }
        },
    );
});

describe("rate-limit / Property 3: reset após janela", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    // **Validates: Requirements 5.1** (Property 3)
    test.prop([
        fc.string({ minLength: 1, maxLength: 16 }),
        fc.integer({ min: 1, max: 60 }),
        fc.integer({ min: 1, max: 30 }),
    ])(
        "after window resets, the next call is allowed again",
        async (key, windowSec, limit) => {
            const store = new InMemoryRateLimiterStore();
            try {
                for (let i = 1; i <= limit + 1; i++) {
                    await rateLimit(
                        { scope: "ip", key, windowSec, limit },
                        store,
                    );
                }

                vi.advanceTimersByTime((windowSec + 1) * 1000);

                const r = await rateLimit(
                    { scope: "ip", key, windowSec, limit },
                    store,
                );
                expect(r.allowed).toBe(true);
            } finally {
                store.dispose();
            }
        },
    );
});
