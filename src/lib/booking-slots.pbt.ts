// src/lib/booking-slots.pbt.ts
//
// Properties 5 e 6 do `design.md > Correctness Properties` para
// `src/lib/booking-slots.ts`. As funções relevantes são:
//
//   • `generateHalfHourStarts(window, stepMin)` em src/lib/booking-slots.ts:21-27
//   • `filterStartsForDuration(starts, durationMinutes, window)` em :30-38
//
// O módulo NÃO tem par parse/serialize (registrado em
// `.kiro/specs/fase-2-testes/testing-conventions.md > §5.5`); cobertura via
// invariantes estruturais.
//
// ────────────────────────────────────────────────────────────────────────────
// Property 5 — Monotonicidade dos starts
// ────────────────────────────────────────────────────────────────────────────
// Para toda janela com `startMin < endMin` e `stepMin ≥ 1`, a sequência
// `generateHalfHourStarts(window, stepMin)` é estritamente crescente em
// minute-value e cada entrada está exatamente `stepMin` minutos depois da
// anterior. A invariante `end > start` por slot do `design.md` é satisfeita
// trivialmente porque a função entrega apenas o início — o término é função
// derivada de `start + duration` no consumidor (testado em Property 6).
//
// Geradores:
//   • startMin ∈ [0, 1439] (timeToMinutes clampa para 0–1439)
//   • len     ∈ [1, 1440]   → endMin = min(1440, startMin+len)
//   • stepMin ∈ [1, 60]     (cobre valores realistas; SLOT_STEP_MIN=30 é o caso típico)
//
// ────────────────────────────────────────────────────────────────────────────
// Property 6 — Completude do filtro por duração
// ────────────────────────────────────────────────────────────────────────────
// Para toda combinação válida `(janela, duração, stepMin)`,
// `filterStartsForDuration(starts, dur, window)` mantém EXATAMENTE os
// starts cujo `start + dur ≤ endMin`. Reconstruímos o conjunto esperado por
// list comprehension e comparamos por igualdade estrutural.
//
// Geradores:
//   • startMin ∈ [0, 1380]
//   • len     ∈ [30, 480]   (janelas realistas; sempre >= stepMin de teste)
//   • dur     ∈ [15, 240]   (cobre durações curtas e longas, > e < janela)
//   • stepMin ∈ [1, 60]
//
// Default global `numRuns: 100` vem de `vitest.setup.ts`; nenhuma seed fixa
// (registrar seed em comentário caso surja contraexemplo, conforme
// `testing-conventions.md > §3`).

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { filterStartsForDuration, generateHalfHourStarts } from "@/lib/booking-slots";
import { timeToMinutes } from "@/lib/time-utils";

describe("booking-slots / generateHalfHourStarts — Property 5 (monotonicidade)", () => {
    test.prop([
        fc.integer({ min: 0, max: 1439 }),
        fc.integer({ min: 1, max: 1440 }),
        fc.integer({ min: 1, max: 60 }),
    ])(
        "sequência é estritamente crescente com passo constante igual a stepMin",
        (startMin, len, stepMin) => {
            const endMin = Math.min(1440, startMin + len);
            // Janela degenerada (start === end) seria pulada pelo consumidor;
            // o gerador acima garante endMin > startMin (len ≥ 1).
            if (endMin <= startMin) return;

            const starts = generateHalfHourStarts({ startMin, endMin }, stepMin);

            // Pelo menos um início, já que endMin > startMin e stepMin ≥ 1.
            expect(starts.length).toBeGreaterThan(0);

            // Primeiro início alinhado com startMin.
            expect(timeToMinutes(starts[0]!)).toBe(startMin);

            // Cada par consecutivo difere exatamente em stepMin minutos.
            for (let i = 1; i < starts.length; i++) {
                const prev = timeToMinutes(starts[i - 1]!);
                const curr = timeToMinutes(starts[i]!);
                expect(curr - prev).toBe(stepMin);
            }
        },
    );
});

describe("booking-slots / filterStartsForDuration — Property 6 (completude)", () => {
    test.prop([
        fc.integer({ min: 0, max: 1380 }),
        fc.integer({ min: 30, max: 480 }),
        fc.integer({ min: 15, max: 240 }),
        fc.integer({ min: 1, max: 60 }),
    ])(
        "mantém exatamente os slots cujo start + duration ≤ endMin",
        (startMin, len, dur, stepMin) => {
            const endMin = Math.min(1440, startMin + len);
            if (endMin <= startMin) return;

            const window = { startMin, endMin };
            const starts = generateHalfHourStarts(window, stepMin);

            const filtered = filterStartsForDuration(starts, dur, window);
            const expected = starts.filter((s) => timeToMinutes(s) + dur <= endMin);

            expect(filtered).toEqual(expected);
        },
    );
});
