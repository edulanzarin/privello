// @vitest-environment jsdom

/**
 * Property 9 — Tokens CSS resolvem para os valores definidos em `:root`.
 *
 * **Validates: Requirements 1.6, 4.2**
 *
 * Carrega `src/app/globals.css`, extrai apenas o bloco `:root { ... }` (para
 * evitar que jsdom tente parsear `@import "tailwindcss"`, `@theme inline`,
 * `@keyframes`, View Transitions etc.) e injeta num `<style>`. Em seguida
 * verifica, via `getComputedStyle(document.documentElement).getPropertyValue`,
 * que cada token canônico resolve para um valor não-vazio e equivalente ao
 * declarado em `:root`.
 *
 * Cobre os tokens listados no design (Property 9) — paleta primária + soft
 * surfaces + chart grid.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS_PATH = resolve(__dirname, "globals.css");

/**
 * Tokens validados por este teste. As chaves são exatamente as variáveis CSS
 * declaradas em `:root`; os valores são os declarados em `globals.css` —
 * comparados após `.trim()` em ambos os lados.
 */
const EXPECTED_TOKENS: ReadonlyArray<readonly [string, string]> = [
    // Paleta primária — pré-existente, valores travados (Requirements 1.1).
    ["--privello-cream", "#f5f5f7"],
    ["--privello-ink", "#1d1d1f"],
    ["--privello-muted", "#86868b"],
    ["--privello-line", "#d2d2d7"],
    ["--privello-coral", "#ff375f"],
    ["--privello-blue", "#0a84ff"],
    ["--privello-green", "#30d158"],
    // Surfaces soft — novos (Requirements 1.2).
    ["--privello-success-soft", "rgba(48, 209, 88, 0.1)"],
    ["--privello-warning-soft", "rgba(255, 149, 0, 0.1)"],
    ["--privello-danger-soft", "rgba(255, 59, 48, 0.1)"],
    ["--privello-info-soft", "rgba(10, 132, 255, 0.1)"],
    ["--privello-purple-soft", "rgba(88, 86, 214, 0.1)"],
    // Stroke de grid em charts — novo (Requirements 1.2).
    ["--privello-chart-grid", "rgba(0, 0, 0, 0.06)"],
];

let styleEl: HTMLStyleElement | null = null;

/**
 * Extrai o conteúdo do bloco `:root { ... }` em globals.css usando matching de
 * chaves balanceadas. Mais robusto que regex simples caso o bloco passe a
 * conter chaves aninhadas no futuro.
 */
function extractRootBlock(css: string): string {
    const startIdx = css.indexOf(":root");
    if (startIdx === -1) {
        throw new Error("Bloco :root não encontrado em globals.css");
    }
    const braceStart = css.indexOf("{", startIdx);
    if (braceStart === -1) {
        throw new Error("Abertura de bloco `{` ausente após :root em globals.css");
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
        throw new Error("Bloco :root mal-formado (chaves desbalanceadas) em globals.css");
    }
    return `:root ${css.substring(braceStart, i)}`;
}

beforeAll(() => {
    const css = readFileSync(CSS_PATH, "utf8");
    const rootBlock = extractRootBlock(css);
    styleEl = document.createElement("style");
    styleEl.textContent = rootBlock;
    document.head.appendChild(styleEl);
});

afterAll(() => {
    styleEl?.remove();
    styleEl = null;
});

describe("globals.css — Property 9 (tokens CSS resolvem do :root)", () => {
    it.each(EXPECTED_TOKENS)(
        "%s resolve para valor não-vazio em document.documentElement",
        (token) => {
            const value = getComputedStyle(document.documentElement)
                .getPropertyValue(token)
                .trim();
            expect(value).not.toBe("");
        },
    );

    it.each(EXPECTED_TOKENS)(
        "%s resolve exatamente para o valor declarado",
        (token, expected) => {
            const value = getComputedStyle(document.documentElement)
                .getPropertyValue(token)
                .trim();
            expect(value).toBe(expected);
        },
    );
});
