import { describe, it, expect } from "vitest";
import { contrastRatio } from "@/lib/a11y/contrast";

/**
 * Property 3: Contraste WCAG AA mínimo nos pares de tokens primários.
 *
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
 *
 * Cobre os pares texto/fundo canônicos do design system contra os limiares
 * WCAG 2.1 AA:
 * - Texto regular ≥ 4.5:1
 * - Texto grande  ≥ 3:1 (regular ≥ 18px ou bold ≥ 14px)
 *
 * Cores fonte: `src/app/globals.css` (`:root`).
 */

// Tokens canônicos do design system (mantidos sincronizados com globals.css).
const TOKEN = {
    background: "#f5f5f7", // --privello-cream
    foreground: "#1d1d1f", // --privello-ink
    white: "#ffffff",
    coral: "#ff375f", // --privello-coral
    muted: "#86868b", // --privello-muted
} as const;

const AA_REGULAR = 4.5;
const AA_LARGE = 3;

describe("contrastRatio (WCAG 2.1)", () => {
    describe("contrato puro do algoritmo", () => {
        it("preto sobre branco bate o teto teórico de 21:1", () => {
            expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
        });

        it("a mesma cor contra si mesma resulta em 1:1 (piso teórico)", () => {
            expect(contrastRatio("#1d1d1f", "#1d1d1f")).toBeCloseTo(1, 5);
            expect(contrastRatio("#f5f5f7", "#f5f5f7")).toBeCloseTo(1, 5);
        });

        it("é simétrico: a ordem dos argumentos não altera o resultado", () => {
            const ab = contrastRatio(TOKEN.foreground, TOKEN.background);
            const ba = contrastRatio(TOKEN.background, TOKEN.foreground);
            expect(ab).toBeCloseTo(ba, 10);
        });

        it("aceita hex curto (#fff) como equivalente a #ffffff", () => {
            expect(contrastRatio("#fff", "#000")).toBeCloseTo(
                contrastRatio("#ffffff", "#000000"),
                10,
            );
        });

        it("rejeita strings que não são hex válido de 3 ou 6 dígitos", () => {
            expect(() => contrastRatio("not-a-color", "#fff")).toThrow();
            expect(() => contrastRatio("#12", "#fff")).toThrow();
            expect(() => contrastRatio("#12345", "#fff")).toThrow();
            expect(() => contrastRatio("#zzzzzz", "#fff")).toThrow();
        });
    });

    describe("pares primários WCAG AA", () => {
        it("text-foreground (#1d1d1f) sobre bg-background (#f5f5f7) ≥ 4.5:1 (AA texto regular)", () => {
            const ratio = contrastRatio(TOKEN.foreground, TOKEN.background);
            expect(ratio).toBeGreaterThanOrEqual(AA_REGULAR);
        });

        it("text-white (#ffffff) sobre bg-foreground (#1d1d1f) ≥ 4.5:1 (AA texto regular)", () => {
            const ratio = contrastRatio(TOKEN.white, TOKEN.foreground);
            expect(ratio).toBeGreaterThanOrEqual(AA_REGULAR);
        });

        it("text-coral (#ff375f) sobre bg-background (#f5f5f7) ≥ 3:1 (AA texto grande)", () => {
            const ratio = contrastRatio(TOKEN.coral, TOKEN.background);
            expect(ratio).toBeGreaterThanOrEqual(AA_LARGE);
        });

        it("text-muted (#86868b) sobre bg-background (#f5f5f7) ≥ 3:1 (AA texto grande)", () => {
            const ratio = contrastRatio(TOKEN.muted, TOKEN.background);
            expect(ratio).toBeGreaterThanOrEqual(AA_LARGE);
        });
    });
});
