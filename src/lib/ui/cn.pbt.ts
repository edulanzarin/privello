// src/lib/ui/cn.pbt.ts
//
// Property 5 — Build de className em Badge/Tabs/KPICard é determinístico.
//
// Definição (ver `.kiro/specs/redesign-macos-system/design.md > Correctness
// Properties > Property 5` e `requirements.md > Requirement 16`):
//
//   16.1 (determinismo / pureza): WHEN `cn` é invocado N vezes (N ≥ 2) com a
//        mesma sequência de argumentos para um Badge, Tabs ou KPICard, retorna
//        exatamente a mesma string em todas as N chamadas.
//
//   16.2 (idempotência semântica): cn(x) e cn(x, x) produzem strings
//        semanticamente equivalentes — o conjunto final de classes Tailwind
//        aplicadas é o mesmo (twMerge dedupa conflitos e tokens idênticos).
//
// Modelagem do input space:
//   Badge, Tabs e KPICard chamam `cn` no padrão:
//
//     cn("classes-base", variantStyles[variant], className)
//
//   Geramos triplas (base, variant, extra?) onde cada peça é uma string de
//   tokens Tailwind realistas — mistura de classes que se conflitam dentro do
//   mesmo grupo utilitário (p-*, px-*, bg-*, text-*, rounded-*, border-*,
//   text-{size}) com classes não-conflitantes (tabular-nums, inline-flex,
//   items-center). Esse mix garante que `twMerge` é exercitado de fato — caso
//   contrário a propriedade colapsaria em "concat de strings é determinístico".
//
// Função pura sobre strings, sem rede, sem banco, sem clock. Default global
// `numRuns: 100` herdado de `vitest.setup.ts`.

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Tokens canônicos (cobrem grupos de conflito reais usados por
// Badge / Tabs / KPICard / variantes do design system)
// ─────────────────────────────────────────────────────────────────────────────

const CLASS_TOKENS = [
    // padding (conflito intra-grupo: p / px / py)
    "p-1",
    "p-2",
    "p-3",
    "p-4",
    "px-2",
    "px-3",
    "px-4",
    "py-1",
    "py-2",
    "py-2.5",
    "py-[2px]",

    // background (conflito)
    "bg-coral",
    "bg-foreground",
    "bg-success-soft",
    "bg-warning-soft",
    "bg-info-soft",
    "bg-purple-soft",
    "bg-line/20",
    "bg-black/[0.04]",

    // cor de texto (conflito)
    "text-white",
    "text-foreground",
    "text-muted",
    "text-blue",
    "text-coral",
    "text-success",
    "text-warning",
    "text-danger",
    "text-accent-purple",

    // tamanho de texto (conflito)
    "text-2xs",
    "text-xs",
    "text-sm",
    "text-base",
    "text-2xl",

    // peso da fonte (conflito)
    "font-medium",
    "font-semibold",
    "font-bold",

    // border-radius (conflito)
    "rounded",
    "rounded-full",
    "rounded-2xl",

    // borders (conflito)
    "border",
    "border-line",
    "border-warning/40",
    "border-success/30",

    // utilitários sem grupo de conflito
    "tabular-nums",
    "tracking-tight",
    "tracking-wider",
    "uppercase",
    "inline-flex",
    "items-center",
    "gap-1",
    "gap-2",
] as const;

const classTokenArb = fc.constantFrom(...CLASS_TOKENS);

/**
 * Gera uma string de tokens Tailwind separados por espaço (vazia permitida).
 *
 * `minLength`/`maxLength` mantidos pequenos para que cada execução seja barata
 * e para que conflitos dentro de um mesmo grupo sejam frequentes — `numRuns:
 * 100` cobre amplamente o espaço.
 */
const classString = (min: number, max: number) =>
    fc
        .array(classTokenArb, { minLength: min, maxLength: max })
        .map((arr) => arr.join(" "));

/**
 * Triplas que espelham a forma canônica
 * `cn("base", variantStyles[variant], className?)` usada por Badge, Tabs e
 * KPICard. `extra` é opcional via `fc.option` (None ⇒ undefined) — `cn` aceita
 * `ClassValue` falsy e ignora.
 */
const variantBuildArgs = fc.tuple(
    classString(1, 6), // base classes
    classString(1, 4), // variant classes
    fc.option(classString(0, 4), { nil: undefined }), // className opcional
);

/**
 * Normaliza uma string de classes para comparação por conjunto:
 * separa por whitespace, descarta vazios, ordena e rejunta. Captura
 * "semanticamente equivalente" — mesmo conjunto final de classes,
 * independentemente de ordem.
 */
function tokenSet(s: string): string {
    return s.split(/\s+/).filter(Boolean).slice().sort().join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 5
// ─────────────────────────────────────────────────────────────────────────────

describe("cn / Property 5: determinismo do build de className", () => {
    /**
     * **Validates: Requirements 16.1**
     *
     * N chamadas consecutivas de `cn` com a mesma sequência de argumentos
     * retornam exatamente a mesma string. N = 5 cobre N ≥ 2 do requirement.
     */
    test.prop([variantBuildArgs])(
        "N=5 chamadas com a mesma sequência de args retornam strings idênticas",
        ([base, variant, extra]) => {
            const calls = Array.from({ length: 5 }, () => cn(base, variant, extra));
            const first = calls[0];
            for (const c of calls) {
                expect(c).toBe(first);
            }
        },
    );
});

describe("cn / Property 5: idempotência semântica", () => {
    /**
     * **Validates: Requirements 16.2**
     *
     * `cn(...args)` e `cn(...args, ...args)` produzem o mesmo conjunto final
     * de classes Tailwind. twMerge é responsável por dedupar conflitos e
     * tokens idênticos; este teste é o canário de que essa contratação é
     * preservada nos call-sites de variant builders.
     */
    test.prop([variantBuildArgs])(
        "cn(args) e cn(args, args) têm o mesmo conjunto final de tokens",
        ([base, variant, extra]) => {
            const single = cn(base, variant, extra);
            const doubled = cn(base, variant, extra, base, variant, extra);
            expect(tokenSet(doubled)).toBe(tokenSet(single));
        },
    );
});
