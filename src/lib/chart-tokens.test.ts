import { describe, it, expect } from "vitest";
import {
    CHART_AREA_OPACITY,
    CHART_GRID_STROKE,
    CHART_PALETTE,
    CHART_TICK_FILL,
    CHART_TOOLTIP_STYLE,
} from "@/lib/chart-tokens";

/**
 * Tests para `chart-tokens` — task 7.2 do redesign-macos-system.
 *
 * Validates: Requirements 3.7
 *
 * Garantias verificadas:
 * 1. Cada valor de `CHART_PALETTE` é uma string no formato `var(--privello-...)`.
 * 2. As chaves de `CHART_PALETTE` correspondem ao contrato canônico documentado
 *    no `design.md` (primary, coral, blue, purple, success, warning).
 * 3. `CHART_GRID_STROKE` e `CHART_TICK_FILL` também apontam para tokens
 *    `--privello-*` (sem hex literais).
 * 4. `CHART_AREA_OPACITY` é numérico em (0, 1).
 * 5. `CHART_TOOLTIP_STYLE` tem o shape esperado pelo `<Tooltip>` do recharts e
 *    referencia tokens (`--privello-line`, `--shadow-sm`).
 * 6. O objeto é `as const` — assertions estáticas via `@ts-expect-error`
 *    garantem que mutação falha em type-check (cobre o "sem mutações" da task).
 */

const PRIVELLO_VAR_RE = /^var\(--privello-[a-z0-9-]+\)$/;
const CSS_VAR_RE = /^var\(--[a-z0-9-]+\)$/;

const EXPECTED_PALETTE_KEYS = [
    "primary",
    "coral",
    "blue",
    "purple",
    "success",
    "warning",
] as const;

describe("CHART_PALETTE", () => {
    it("expõe exatamente as 6 chaves canônicas do design system", () => {
        expect(Object.keys(CHART_PALETTE).sort()).toEqual(
            [...EXPECTED_PALETTE_KEYS].sort(),
        );
    });

    it.each(EXPECTED_PALETTE_KEYS)(
        "chave %s aponta para uma string var(--privello-...)",
        (key) => {
            const value = CHART_PALETTE[key];
            expect(typeof value).toBe("string");
            expect(value).toMatch(PRIVELLO_VAR_RE);
        },
    );

    it("não contém hex literais (#xxxxxx) nas séries", () => {
        for (const value of Object.values(CHART_PALETTE)) {
            expect(value).not.toMatch(/^#/);
        }
    });

    it("é `as const` — mutação falha em type-check", () => {
        // Garantia puramente estática: `as const` torna as propriedades
        // `readonly` em nível de tipo. As atribuições abaixo precisam falhar
        // no compilador (`@ts-expect-error`) — nunca executamos a função para
        // evitar mutar o módulo em runtime (o que `as const` por si só não
        // impede; quem garante isso aqui é a checagem TS).
        const _typeCheck = () => {
            // @ts-expect-error CHART_PALETTE é readonly (`as const`)
            CHART_PALETTE.primary = "var(--privello-mutado)";

            // @ts-expect-error chave nova também é proibida pelo tipo
            CHART_PALETTE.novaChave = "var(--privello-x)";
        };
        void _typeCheck;

        expect(typeof CHART_PALETTE.primary).toBe("string");
        expect(CHART_PALETTE.primary).toMatch(PRIVELLO_VAR_RE);
    });
});

describe("CHART_GRID_STROKE / CHART_TICK_FILL", () => {
    it("CHART_GRID_STROKE referencia o token --privello-chart-grid", () => {
        expect(CHART_GRID_STROKE).toBe("var(--privello-chart-grid)");
        expect(CHART_GRID_STROKE).toMatch(PRIVELLO_VAR_RE);
    });

    it("CHART_TICK_FILL referencia o token --privello-muted", () => {
        expect(CHART_TICK_FILL).toBe("var(--privello-muted)");
        expect(CHART_TICK_FILL).toMatch(PRIVELLO_VAR_RE);
    });
});

describe("CHART_AREA_OPACITY", () => {
    it("é um número finito em (0, 1)", () => {
        expect(typeof CHART_AREA_OPACITY).toBe("number");
        expect(Number.isFinite(CHART_AREA_OPACITY)).toBe(true);
        expect(CHART_AREA_OPACITY).toBeGreaterThan(0);
        expect(CHART_AREA_OPACITY).toBeLessThan(1);
    });
});

describe("CHART_TOOLTIP_STYLE", () => {
    it("tem o shape esperado pelo Tooltip do recharts", () => {
        expect(CHART_TOOLTIP_STYLE).toEqual(
            expect.objectContaining({
                fontSize: expect.any(Number),
                padding: expect.any(String),
                border: expect.any(String),
                borderRadius: expect.any(Number),
                background: expect.any(String),
                boxShadow: expect.any(String),
            }),
        );
    });

    it("border referencia --privello-line (sem hex literais)", () => {
        expect(CHART_TOOLTIP_STYLE.border).toContain("var(--privello-line)");
        expect(CHART_TOOLTIP_STYLE.border).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    });

    it("boxShadow é um token CSS var(--...)", () => {
        expect(CHART_TOOLTIP_STYLE.boxShadow).toMatch(CSS_VAR_RE);
    });

    it("é `as const` — mutação falha em type-check", () => {
        // Garantia puramente estática: `as const` torna o objeto readonly em
        // nível de tipo. As atribuições abaixo precisam falhar no compilador
        // (`@ts-expect-error`) — nunca executamos a função para não mutar o
        // módulo em runtime.
        const _typeCheck = () => {
            // @ts-expect-error CHART_TOOLTIP_STYLE é readonly (`as const`)
            CHART_TOOLTIP_STYLE.fontSize = 99;

            // @ts-expect-error chave nova proibida pelo tipo
            CHART_TOOLTIP_STYLE.color = "red";
        };
        void _typeCheck;

        expect(typeof CHART_TOOLTIP_STYLE).toBe("object");
        expect(CHART_TOOLTIP_STYLE).not.toBeNull();
    });
});
