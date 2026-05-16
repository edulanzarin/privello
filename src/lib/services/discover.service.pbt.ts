// src/lib/services/discover.service.pbt.ts
//
// Property 1 — paridade entre ORDER BY (SQL) e sort em memória
// (cf. design.md > Correctness Properties).
//
// O oráculo é `queries.ts > sortProfileCards` + `finalizeDiscoverOrder` —
// o algoritmo de sorting/grouping que esta fase está migrando para o
// service. Como o agrupamento por `planTier` permanece em JS (Prisma não
// suporta `ORDER BY` por enum sem `$queryRaw`/schema change — ver
// `metricas-baseline.md > §5 Decisões > Sort relevance`), a paridade é
// testada nas helpers internas, não nas queries Prisma.
//
// Equivalência: para todo conjunto S de cards e todo `sort`, a sequência
// de `id` retornada por `discover.service.__test_internal__.
// finalizeDiscoverOrderInner(S, sort)` é exatamente igual à sequência
// retornada por `queries.ts.finalizeDiscoverOrder(S, sort)`.
//
// _Validates: Requirement 4.2 — paridade de resultado validada por teste._

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import {
    finalizeDiscoverOrder as oracleFinalizeDiscoverOrder,
    sortProfileCards as oracleSortProfileCards,
    type ProfileCardPayload,
    type ProfileSort,
} from "@/lib/queries";
import { __test_internal__ } from "./discover.service";

const { finalizeDiscoverOrderInner, sortProfileCardsInner } =
    __test_internal__;

// ─── Geradores ────────────────────────────────────────────────────────────

const arbPlanTier = fc.constantFrom("PREMIUM", "DESTAQUE", "ESSENCIAL" as const);
const arbSort = fc.constantFrom<ProfileSort>(
    "relevance",
    "price_asc",
    "price_desc",
    "rating",
);

// Gera um "shape mínimo" suficiente para `sortProfileCards` /
// `finalizeDiscoverOrder` rodarem. Os campos extras de
// `ProfileCardPayload` (city, district, media…) não afetam a ordenação,
// mas precisam estar presentes no tipo. Usamos `as unknown as` para
// projetar o shape mínimo no tipo ProfileCardPayload — é um cast seguro
// no contexto de teste pois os campos não-tocados nunca são lidos pelas
// funções sob teste.
const arbCard = fc.record({
    id: fc.string({ minLength: 1, maxLength: 16 }).filter((s) => /^[A-Za-z0-9_-]+$/.test(s)),
    priceHour: fc.integer({ min: 0, max: 100_000 }),
    ratingAvg: fc.float({ min: 0, max: 5, noNaN: true }),
    ratingCount: fc.integer({ min: 0, max: 1000 }),
    planTier: arbPlanTier,
    // featuredUntil: 50% chance de boost ativo (data futura), 30% de boost
    // expirado (passado), 20% null. Faz a partição boosted/rest variar
    // entre execuções.
    featuredUntil: fc.option(
        fc.oneof(
            fc.date({ min: new Date("2025-01-01"), max: new Date("2030-01-01") }),
            fc.date({ min: new Date("2050-01-01"), max: new Date("2099-01-01") }),
        ),
        { nil: null, freq: 5 },
    ),
});

// Conjunto único por id para evitar ambiguidade na comparação de ordem
// (sort estável em JS preserva a ordem original entre elementos iguais;
// o oráculo e o novo service usam o mesmo `[...arr].sort(...)` então
// concordam, mas IDs duplicadas confundem `JSON.stringify(ids)`).
const arbCardSet = fc.uniqueArray(arbCard, {
    minLength: 0,
    maxLength: 50,
    selector: (c) => c.id,
});

// ─── Property 1 ────────────────────────────────────────────────────────────

describe("discover.service / Property 1 — paridade SQL ↔ memória", () => {
    test.prop([arbCardSet, arbSort])(
        "finalizeDiscoverOrderInner === oracleFinalizeDiscoverOrder em ordem de id",
        (cards, sort) => {
            // Cast para ProfileCardPayload — campos não-tocados nunca lidos.
            const setCast = cards as unknown as ProfileCardPayload[];
            const expected = oracleFinalizeDiscoverOrder(setCast, sort);
            const actual = finalizeDiscoverOrderInner(setCast, sort);

            const expectedIds = expected.map((p) => p.id);
            const actualIds = actual.map((p) => p.id);
            expect(JSON.stringify(actualIds)).toBe(JSON.stringify(expectedIds));
        },
    );

    test.prop([arbCardSet, arbSort])(
        "sortProfileCardsInner === oracleSortProfileCards em ordem de id",
        (cards, sort) => {
            const setCast = cards as unknown as ProfileCardPayload[];
            const expected = oracleSortProfileCards(setCast, sort);
            const actual = sortProfileCardsInner(setCast, sort);

            const expectedIds = expected.map((p) => p.id);
            const actualIds = actual.map((p) => p.id);
            expect(JSON.stringify(actualIds)).toBe(JSON.stringify(expectedIds));
        },
    );
});
