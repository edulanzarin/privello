// src/lib/ui/status.pbt.ts
//
// Property 2 — `statusToBadgeVariant` é função total no domínio de status conhecidos.
//
// Definição (ver `.kiro/specs/redesign-macos-system/design.md > Correctness
// Properties > Property 2` e `requirements.md > Requirement 3`):
//
//   1. Totalidade: para todo `s` no domínio canônico mapeado, o retorno é um
//      `StatusBadgeVariant` válido (um dos 7 literais permitidos).
//   2. Equivalência: pares aliasados produzem a mesma variante. Em particular
//      `NOVO ≡ OPEN` (ambos → `"info"`) e `REVISAO ≡ IN_PROGRESS` (ambos →
//      `"warning"`).
//   3. Fallback determinístico: para toda string arbitrária fora do domínio
//      conhecido, o retorno é `"muted"` (Requirement 3.10).
//   4. Pureza/idempotência: a função é determinística — chamadas repetidas com
//      o mesmo input retornam o mesmo output.
//
// Função pura sobre `string`, sem rede, sem banco, sem clock. Default global
// `numRuns: 100` herdado de `vitest.setup.ts`.

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import {
    statusToBadgeVariant,
    type StatusBadgeVariant,
} from "@/lib/ui/status";

// ─────────────────────────────────────────────────────────────────────────────
// Domínio conhecido (espelha o mapa canônico em `status.ts`)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Conjunto fechado de variantes válidas. Mantido como tupla `as const` para
 * que a checagem de pertinência seja exaustiva no nível do tipo.
 */
const VALID_VARIANTS = [
    "info",
    "warning",
    "success",
    "muted",
    "danger",
    "premium",
    "coral",
] as const satisfies ReadonlyArray<StatusBadgeVariant>;

/**
 * Strings do domínio conhecido (todas as chaves do mapa canônico). Listadas
 * explicitamente em vez de importadas do módulo: garante que o teste falha
 * se o domínio mudar sem atualização da spec.
 */
const KNOWN_DOMAIN_STATUSES = [
    "NOVO",
    "OPEN",
    "REVISAO",
    "IN_PROGRESS",
    "pending",
    "APROVADO",
    "verificado",
    "REJEITADO",
    "CLOSED",
    "cancelled",
    "BANIDO",
    "SUSPENSO",
    "PREMIUM",
    "DESTAQUE",
    "ESSENCIAL",
] as const;

const KNOWN_DOMAIN_SET: ReadonlySet<string> = new Set(KNOWN_DOMAIN_STATUSES);

// ─────────────────────────────────────────────────────────────────────────────
// Geradores
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera qualquer status do domínio conhecido. `constantFrom` é o gerador certo
 * aqui — domínio finito, distribuição uniforme.
 */
const knownStatus = fc.constantFrom(...KNOWN_DOMAIN_STATUSES);

/**
 * Gera strings arbitrárias garantidamente fora do domínio conhecido. Filtramos
 * via `KNOWN_DOMAIN_SET` para que nenhuma `fc.string()` colida com uma chave
 * canônica (probabilidade muito baixa, mas não zero — `"NOVO"` poderia surgir).
 */
const outOfDomainStatus = fc
    .string()
    .filter((s) => !KNOWN_DOMAIN_SET.has(s));

// ─────────────────────────────────────────────────────────────────────────────
// Property 2
// ─────────────────────────────────────────────────────────────────────────────

describe("statusToBadgeVariant / Property 2: função total no domínio conhecido", () => {
    // **Validates: Requirements 3.1, 3.7**
    test.prop([knownStatus])(
        "todo status do domínio retorna um StatusBadgeVariant válido",
        (status) => {
            const variant = statusToBadgeVariant(status);
            expect(VALID_VARIANTS).toContain(variant);
        },
    );

    // **Validates: Requirements 3.1, 3.7**
    test.prop([fc.string()])(
        "qualquer string (dentro ou fora do domínio) retorna um StatusBadgeVariant válido",
        (raw) => {
            const variant = statusToBadgeVariant(raw);
            expect(VALID_VARIANTS).toContain(variant);
        },
    );
});

describe("statusToBadgeVariant / Property 2: equivalência de aliases", () => {
    // **Validates: Requirements 3.1, 3.7**
    test("NOVO e OPEN mapeiam para a mesma variante (info)", () => {
        const novo = statusToBadgeVariant("NOVO");
        const open = statusToBadgeVariant("OPEN");
        expect(novo).toBe(open);
        expect(novo).toBe<StatusBadgeVariant>("info");
    });

    // **Validates: Requirements 3.1, 3.7**
    test("REVISAO e IN_PROGRESS mapeiam para a mesma variante (warning)", () => {
        const revisao = statusToBadgeVariant("REVISAO");
        const inProgress = statusToBadgeVariant("IN_PROGRESS");
        expect(revisao).toBe(inProgress);
        expect(revisao).toBe<StatusBadgeVariant>("warning");
    });
});

describe("statusToBadgeVariant / Property 2: fallback determinístico", () => {
    // **Validates: Requirements 3.1, 3.7**
    test.prop([outOfDomainStatus])(
        "string fora do domínio conhecido sempre retorna 'muted'",
        (raw) => {
            expect(statusToBadgeVariant(raw)).toBe<StatusBadgeVariant>("muted");
        },
    );
});

describe("statusToBadgeVariant / Property 2: pureza / idempotência", () => {
    // **Validates: Requirements 3.1, 3.7**
    test.prop([fc.string()])(
        "duas chamadas com o mesmo input retornam o mesmo output",
        (raw) => {
            expect(statusToBadgeVariant(raw)).toBe(statusToBadgeVariant(raw));
        },
    );
});
