// src/lib/r2-hostname.pbt.ts
//
// Property 5 — Extração de hostname para `images.remotePatterns`.
//
// Definição (ver `.kiro/specs/migracao-infra-producao/design.md > Correctness
// Properties > Property 5`): para toda string `raw`,
//
//   1. SE `raw` é uma URL HTTPS bem-formada (parseável por `new URL(raw)` com
//      `protocol === "https:"`) ENTÃO `extractR2Hostname(raw)` retorna
//      exatamente o `hostname` canônico extraído pela API `URL` (lowercase,
//      sem porta, sem path).
//   2. SE `raw` é vazia, `undefined`, ou não parseável como URL HTTPS
//      ENTÃO `extractR2Hostname(raw)` retorna `null`.
//   3. Em ambos os casos, o resultado (quando string) NÃO contém o caractere
//      `"*"` — nenhuma entrada curinga em `images.remotePatterns` é ativada
//      por esta extração (Requirement 7.4).
//
// Cobertura cruzada: este arquivo é a única fonte mecânica de cobertura para
// os Requirements 7.1, 7.2, 7.3 e 7.4 da spec `migracao-infra-producao`. Sem
// rede, sem banco, sem clock — função pura sobre `string | undefined`.
//
// Default global `numRuns: 100` herdado de `vitest.setup.ts`.

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { extractR2Hostname } from "@/lib/r2-hostname";

// ─────────────────────────────────────────────────────────────────────────────
// Geradores
// ─────────────────────────────────────────────────────────────────────────────

/**
 * URLs HTTPS bem-formadas — `validSchemes: ["https"]` restringe o gerador
 * nativo `fc.webUrl` ao subset que satisfaz `protocol === "https:"`. Mais
 * sólido que filtrar por `startsWith("https://")` porque garante que
 * `new URL(raw)` aceita o input.
 */
const httpsUrl = fc.webUrl({ validSchemes: ["https"] });

/**
 * Inputs inválidos: vazio, undefined, ou string arbitrária. Strings que
 * acidentalmente parseiam como URL HTTPS são filtradas para preservar a
 * pré-condição da Property 5.2 (raras, mas possíveis com `fc.string`).
 */
const invalidRaw = fc
    .oneof(fc.constant(""), fc.constant(undefined), fc.string())
    .filter((raw) => {
        if (raw === undefined || raw === "") return true;
        try {
            const u = new URL(raw);
            return u.protocol !== "https:";
        } catch {
            return true;
        }
    });

// ─────────────────────────────────────────────────────────────────────────────
// Property 5
// ─────────────────────────────────────────────────────────────────────────────

describe("r2-hostname / Property 5: extração de hostname para images.remotePatterns", () => {
    // **Validates: Requirements 7.1, 7.2, 7.3, 7.4** (Property 5 — caso válido)
    test.prop([httpsUrl])(
        "URL HTTPS válida → hostname extraído via `URL`, lowercase, sem `*`",
        (raw) => {
            const result = extractR2Hostname(raw);
            const expected = new URL(raw).hostname.toLowerCase();
            expect(result).toBe(expected);
            // Sanity: a extração não pode introduzir curinga (Requirement 7.4).
            expect(result).not.toContain("*");
        },
    );

    // **Validates: Requirements 7.1, 7.2, 7.3, 7.4** (Property 5 — caso inválido)
    test.prop([invalidRaw])(
        "input vazio/undefined/não-URL HTTPS → `null`",
        (raw) => {
            expect(extractR2Hostname(raw)).toBeNull();
        },
    );

    // **Validates: Requirements 7.1, 7.2, 7.3, 7.4** (Property 5 — invariante global)
    test.prop([fc.oneof(httpsUrl, invalidRaw)])(
        "resultado nunca contém `*` (sem curinga em qualquer caminho)",
        (raw) => {
            const result = extractR2Hostname(raw);
            if (typeof result === "string") {
                expect(result).not.toContain("*");
            } else {
                expect(result).toBeNull();
            }
        },
    );
});
