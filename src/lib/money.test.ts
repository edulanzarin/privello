import { describe, it, expect } from "vitest";
import { formatBrl } from "@/lib/money";

const NBSP = "\u00a0";
const r = (rest: string) => `R$${NBSP}${rest}`;

describe("formatBrl", () => {
    describe("formatação típica", () => {
        it("formata zero como 'R$ 0'", () => {
            expect(formatBrl(0)).toBe(r("0"));
        });

        it("formata 1990 (centavos do plano essencial) sem fração", () => {
            expect(formatBrl(1990)).toBe(r("1.990"));
        });

        it("formata 18900 (centavos do plano premium) com separador de milhar", () => {
            expect(formatBrl(18900)).toBe(r("18.900"));
        });
    });

    describe("bordas", () => {
        it("zero é representado sem sinal negativo", () => {
            expect(formatBrl(0)).not.toMatch(/^-/);
        });

        it("valor mínimo positivo (1) ainda gera string formatada", () => {
            expect(formatBrl(1)).toBe(r("1"));
        });

        it("valores fracionários são arredondados (sem dígitos de fração)", () => {
            // maximumFractionDigits: 0 → arredondamento half-to-even / half-up depende do ICU,
            // o que importa é que nenhum dígito após a vírgula apareça.
            const out = formatBrl(1.5);
            expect(out).not.toMatch(/,/);
            expect(out).toBe(r("2"));
        });

        it("valor grande (Number.MAX_SAFE_INTEGER) é formatado sem perda visual de precisão", () => {
            const out = formatBrl(Number.MAX_SAFE_INTEGER);
            // Apenas conferimos: usa o símbolo BRL, não tem fração e não está vazio.
            expect(out.startsWith(`R$${NBSP}`)).toBe(true);
            expect(out).not.toMatch(/,/);
            expect(out.length).toBeGreaterThan(4);
        });

        it("valor negativo recebe o prefixo '-' antes do símbolo", () => {
            expect(formatBrl(-100)).toBe(`-${r("100")}`);
        });

        it("Infinity é formatado como '∞' (comportamento do Intl)", () => {
            expect(formatBrl(Infinity)).toBe(r("∞"));
        });

        it("NaN não dispara, retorna string contendo 'NaN'", () => {
            // formatBrl recebe `number`; o contrato do Intl é não lançar para NaN.
            expect(() => formatBrl(NaN)).not.toThrow();
            expect(formatBrl(NaN)).toMatch(/NaN/);
        });
    });
});
