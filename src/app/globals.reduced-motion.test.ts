// @vitest-environment jsdom

/**
 * Property 4 — `prefers-reduced-motion: reduce` neutraliza animações.
 *
 * **Validates: Requirements 14.1, 14.2**
 *
 * Estratégia híbrida (jsdom 26 não avalia `@media (prefers-reduced-motion)`,
 * mesmo com `matchMedia` mockado — o CSSOM aplica `@media` baseado em
 * viewport/features estáticas, não em queries arbitrárias):
 *
 * 1. **Comportamental**: extrai o conteúdo interno do bloco
 *    `@media (prefers-reduced-motion: reduce) { ... }` em `globals.css` e
 *    injeta as regras incondicionalmente num `<style>`. Em seguida, mocka
 *    `window.matchMedia("(prefers-reduced-motion: reduce)")` retornando
 *    `matches=true` (para consumidores JS) e verifica via
 *    `getComputedStyle(el)` que elementos com `.animate-fade-in` e
 *    `.animate-scale-in` recebem `animation-duration` neutralizado pela
 *    regra universal (`*, *::before, *::after`).
 *
 * 2. **Source-level**: como jsdom não suporta os pseudo-elementos
 *    `::view-transition-old(*)`, `::view-transition-new(*)` e
 *    `::view-transition-group(*)`, valida-se diretamente no texto do CSS
 *    que o bloco `@media` contém a regra com `animation-duration: 0s` para
 *    esses pseudo-elementos (Requirement 14.2).
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS_PATH = resolve(__dirname, "globals.css");

/**
 * Extrai o conteúdo entre as chaves balanceadas que se iniciam após `startIdx`.
 * Retorna o conteúdo interno (sem as chaves de abertura/fechamento) e os
 * offsets do bloco no input original.
 */
function extractBlock(
    css: string,
    startIdx: number,
): { content: string; braceStart: number; braceEnd: number } {
    const braceStart = css.indexOf("{", startIdx);
    if (braceStart === -1) {
        throw new Error("Abertura de bloco `{` ausente em globals.css");
    }
    let depth = 1;
    let i = braceStart + 1;
    while (i < css.length && depth > 0) {
        const ch = css[i];
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        i++;
    }
    if (depth !== 0) {
        throw new Error("Bloco mal-formado (chaves desbalanceadas) em globals.css");
    }
    // i aponta uma posição APÓS a `}` final; conteúdo interno é (braceStart+1, i-1).
    return { content: css.substring(braceStart + 1, i - 1), braceStart, braceEnd: i };
}

/**
 * Extrai o conteúdo interno do bloco `@media (prefers-reduced-motion: reduce)`.
 */
function extractReducedMotionInner(css: string): string {
    const idx = css.indexOf("@media (prefers-reduced-motion: reduce)");
    if (idx === -1) {
        throw new Error(
            "Bloco @media (prefers-reduced-motion: reduce) não encontrado em globals.css",
        );
    }
    return extractBlock(css, idx).content;
}

/**
 * Mocka `window.matchMedia` para reportar `matches=true` apenas para a query
 * `(prefers-reduced-motion: reduce)` — outras queries retornam `false`.
 */
function mockMatchMediaReduce(matches: boolean): void {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: vi.fn((query: string) => ({
            matches: query.includes("prefers-reduced-motion: reduce") ? matches : false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

let styleEl: HTMLStyleElement | null = null;
let cssSource = "";

beforeAll(() => {
    cssSource = readFileSync(CSS_PATH, "utf8");
    mockMatchMediaReduce(true);

    // Injeta as regras INTERNAS do bloco `@media (prefers-reduced-motion: reduce)`
    // diretamente (sem o wrapper @media) para que o cascaded value reflita o
    // estado "reduced-motion ativo" — jsdom não avalia a media query nativamente.
    const inner = extractReducedMotionInner(cssSource);
    styleEl = document.createElement("style");
    styleEl.textContent = inner;
    document.head.appendChild(styleEl);
});

afterAll(() => {
    styleEl?.remove();
    styleEl = null;
});

describe("globals.css — Property 4 (prefers-reduced-motion neutraliza animações)", () => {
    it("matchMedia reporta prefers-reduced-motion: reduce com matches=true", () => {
        expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
    });

    it.each(["animate-fade-in", "animate-scale-in"])(
        "elemento com classe `.%s` tem animation-duration neutralizado (≤ 0.01ms ou 0s)",
        (className) => {
            const el = document.createElement("div");
            el.classList.add(className);
            document.body.appendChild(el);
            try {
                const value = getComputedStyle(el).animationDuration.trim();
                // Aceita "0.01ms" (declarado) e "0s" (algumas versões do jsdom
                // podem normalizar). Ambos satisfazem Requirement 14.1.
                expect(["0.01ms", "0s"]).toContain(value);
            } finally {
                el.remove();
            }
        },
    );

    it("bloco @media zera animation-duration via seletor universal `*, *::before, *::after`", () => {
        const inner = extractReducedMotionInner(cssSource);
        // Confirma a presença da regra universal e da declaração esperada.
        expect(inner).toMatch(/\*\s*,\s*\*::before\s*,\s*\*::after\s*\{/);
        expect(inner).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
        expect(inner).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    });

    it("bloco @media zera animation-duration em ::view-transition-old(*) e ::view-transition-new(*)", () => {
        // jsdom não suporta os pseudo-elementos ::view-transition-* — validamos
        // direto no texto fonte (Requirement 14.2).
        const inner = extractReducedMotionInner(cssSource);

        // Localiza o início da regra que cobre os pseudo-elementos de view-transition
        // e verifica que a declaração `animation-duration: 0s` aparece dentro dela.
        const vtSelectorMatch = inner.match(
            /::view-transition-old\(\*\)\s*,\s*::view-transition-new\(\*\)[\s\S]*?\{/,
        );
        expect(vtSelectorMatch).not.toBeNull();
        const vtIdx = inner.indexOf(vtSelectorMatch![0]);
        expect(vtIdx).toBeGreaterThanOrEqual(0);

        const vtBlock = extractBlock(inner, vtIdx);
        expect(vtBlock.content).toMatch(/animation-duration:\s*0s\s*!important/);
        expect(vtBlock.content).toMatch(/animation-delay:\s*0s\s*!important/);
    });
});
