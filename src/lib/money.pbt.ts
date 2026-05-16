// src/lib/money.pbt.ts
//
// Property 1 (adaptada) — invariantes mais fracos sobre `formatBrl`.
//
// O design.md > Correctness Properties > Property 1 previa um round-trip
// `brlToCents(centsToBRL(c)) === c`. Esse par NÃO existe em `src/lib/money.ts`
// (único export é `formatBrl(value: number): string`), portanto a propriedade
// original é **não declarável** com a API atual — ver
// `.kiro/specs/fase-2-testes/testing-conventions.md > §5.1`.
//
// Em vez de pular o módulo, declaramos um invariante mais fraco que preserva
// o espírito da Property 1 (fidelidade da formatação BRL) sem exigir uma
// função inversa: para todo inteiro não-negativo `value`, `formatBrl(value)`
// (a) começa com o símbolo "R$" e (b) preserva todos os dígitos de `value`,
// ignorando separadores de milhar (`.`) e o NBSP que `Intl.NumberFormat`
// insere entre o símbolo e o número na locale "pt-BR".
//
// Limite superior 100_000 é arbitrário (≪ MAX_SAFE_INTEGER) — escolhido para
// cobrir a faixa realista de preços/valores em centavos exibidos pelo app
// (ver `PLAN_PRICES` em `src/lib/constants.ts`) sem inflar tempo de execução.
//
// Default global `numRuns: 100` vem de `vitest.setup.ts`; nenhuma seed fixa
// aqui (registrar seed em comentário caso um contraexemplo precise virar
// regression test inline, conforme `testing-conventions.md > §3`).

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { formatBrl } from "@/lib/money";

describe("money / formatBrl — Property 1 (adaptada)", () => {
    test.prop([fc.integer({ min: 0, max: 100_000 })])(
        "começa com 'R$' e preserva os dígitos de value (ignorando separadores)",
        (value) => {
            const out = formatBrl(value);

            // (a) prefixo do símbolo BRL
            expect(out).toMatch(/^R\$/);

            // (b) todos os dígitos de `value` aparecem na saída na ordem
            // original, ignorando NBSP/espaço e separador de milhar (`.`).
            const digits = out.replace(/\D/g, "");
            expect(digits).toContain(String(value));
        },
    );
});
