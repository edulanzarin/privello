// src/lib/time-utils.pbt.ts
//
// Property 3 (adaptada) — round-trips em `time-utils`.
//
// O design.md > Correctness Properties > Property 3 previa um round-trip
// `parseTime(formatTime(d)) ≈ d` operando sobre `Date`. Esse par não existe
// no módulo: as funções existentes operam sobre `string ↔ number` (minutos
// desde meia-noite) e sobre `string ↔ {year,month}`. Ver
// `.kiro/specs/fase-2-testes/testing-conventions.md > §5.3`.
//
// Em vez de pular, declaramos a Property 3 sobre os dois pares realmente
// existentes:
//
//   1. `minutesToTime ↔ timeToMinutes` é uma identidade no domínio
//      [0, 1439]: para todo `m` nesse intervalo, `timeToMinutes(minutesToTime(m)) === m`.
//
//   2. `formatYearMonth ↔ parseMonthParam` preserva `year` e `month` para
//      todo par válido `(year ∈ [1900, 2100], month ∈ [1, 12])`. O domínio
//      é estreitado (vs. todo `number`) porque `parseMonthParam` regex
//      `^\d{4}-\d{2}$` só aceita `year` de exatamente 4 dígitos.
//
// Default global `numRuns: 100` vem de `vitest.setup.ts`. Sem seed fixa.

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import {
    formatYearMonth,
    minutesToTime,
    parseMonthParam,
    timeToMinutes,
} from "@/lib/time-utils";

describe("time-utils / minutesToTime ↔ timeToMinutes", () => {
    test.prop([fc.integer({ min: 0, max: 1439 })])(
        "timeToMinutes(minutesToTime(m)) === m",
        (m) => {
            expect(timeToMinutes(minutesToTime(m))).toBe(m);
        },
    );
});

describe("time-utils / formatYearMonth ↔ parseMonthParam", () => {
    test.prop([fc.integer({ min: 1900, max: 2100 }), fc.integer({ min: 1, max: 12 })])(
        "parseMonthParam(formatYearMonth(year, month)) preserva year e month",
        (year, month) => {
            const ym = formatYearMonth(year, month);
            const parsed = parseMonthParam(ym);
            expect(parsed.year).toBe(year);
            expect(parsed.month).toBe(month);
        },
    );
});
