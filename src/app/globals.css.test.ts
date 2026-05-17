// @vitest-environment jsdom

/**
 * globals.css — tokens resolvem do `:root` (v2 / Tahoe Sensual)
 *
 * Carrega `src/app/globals.css`, extrai o bloco `:root { ... }` e injeta num
 * `<style>` (jsdom não parseia `@import "tailwindcss"` nem `@theme inline`).
 * Verifica via `getComputedStyle(document.documentElement).getPropertyValue`
 * que cada token canônico resolve para o valor declarado.
 *
 * Cobre:
 *  - Tokens v2 canônicos (`--ink`, `--rose`, `--peach`, `--plum`, `--cream`,
 *    semânticos, soft surfaces).
 *  - Aliases legados (`--privello-coral`, `--privello-cream`, etc.) que
 *    apontam para os tokens v2 — garante que componentes pré-v2 que ainda
 *    consomem `bg-coral`, `bg-background` etc. continuam funcionando.
 *
 * Steering: `.kiro/steering/design-system.md` §3.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS_PATH = resolve(__dirname, "globals.css");

/** Tokens v2 canônicos. */
const V2_CANONICAL_TOKENS: ReadonlyArray<readonly [string, string]> = [
    // Cor — base
    ["--ink", "#1a1517"],
    ["--ink-dim", "#6b5d63"],
    ["--ink-faint", "#a89ba2"],
    ["--line", "rgba(26, 21, 23, 0.08)"],
    ["--surface-solid", "#fdfcfb"],

    // Cor — accent
    ["--rose", "#e85a7a"],
    ["--peach", "#f4a275"],
    ["--plum", "#9c4474"],
    ["--cream", "#f1d9c0"],

    // Cor — semântica
    ["--success", "#4d9b6e"],
    ["--warning", "#d4905c"],
    ["--danger", "#c94545"],
    ["--info", "#5b8db8"],
    ["--whatsapp", "#25d366"],

    // Cor — surfaces soft
    ["--rose-soft", "rgba(232, 90, 122, 0.10)"],
    ["--peach-soft", "rgba(244, 162, 117, 0.12)"],
    ["--plum-soft", "rgba(156, 68, 116, 0.10)"],
    ["--success-soft", "rgba(77, 155, 110, 0.10)"],
    ["--warning-soft", "rgba(212, 144, 92, 0.12)"],
    ["--danger-soft", "rgba(201, 69, 69, 0.10)"],
    ["--info-soft", "rgba(91, 141, 184, 0.10)"],
];

/**
 * Aliases legados — devem resolver para o MESMO valor dos tokens v2 que
 * apontam. Garante backwards-compat dos componentes pré-v2.
 *
 * O par é `[alias, target_v2]`. Comparamos `getPropertyValue(alias)` com
 * `getPropertyValue(target)` — ambos resolvidos pelo CSSOM.
 */
const LEGACY_ALIASES: ReadonlyArray<readonly [string, string]> = [
    ["--privello-cream", "--bg-base"],
    ["--privello-ink", "--ink"],
    ["--privello-muted", "--ink-dim"],
    ["--privello-line", "--line"],
    ["--privello-coral", "--rose"],
    ["--privello-blue", "--info"],
    ["--privello-green", "--success"],
    ["--privello-warning", "--warning"],
    ["--privello-danger", "--danger"],
    ["--privello-accent-purple", "--plum"],
    ["--privello-whatsapp", "--whatsapp"],
    ["--privello-sidebar", "--ink"],
    ["--privello-success-soft", "--success-soft"],
    ["--privello-warning-soft", "--warning-soft"],
    ["--privello-danger-soft", "--danger-soft"],
    ["--privello-info-soft", "--info-soft"],
    ["--privello-purple-soft", "--plum-soft"],
];

let styleEl: HTMLStyleElement | null = null;

/**
 * Extrai o conteúdo do bloco `:root { ... }` em globals.css usando matching de
 * chaves balanceadas (robusto a chaves aninhadas).
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

function read(token: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

describe("globals.css v2 — tokens canônicos resolvem do :root", () => {
    it.each(V2_CANONICAL_TOKENS)(
        "%s resolve para valor não-vazio",
        (token) => {
            expect(read(token)).not.toBe("");
        },
    );

    it.each(V2_CANONICAL_TOKENS)(
        "%s resolve exatamente para o valor declarado",
        (token, expected) => {
            expect(read(token)).toBe(expected);
        },
    );
});

describe("globals.css v2 — aliases legados apontam para tokens v2", () => {
    /**
     * jsdom NÃO resolve `var()` em `getPropertyValue` — retorna literal
     * `"var(--rose)"` em vez de `"#e85a7a"`. Em browser real funciona, em
     * jsdom não. Pra validar o contrato "alias aponta pro token v2",
     * parseamos o CSS source direto e verificamos a declaração textual
     * `--privello-coral: var(--rose);`.
     */
    let cssSource: string;

    beforeAll(() => {
        cssSource = readFileSync(CSS_PATH, "utf8");
    });

    it.each(LEGACY_ALIASES)(
        "%s é declarado como var(%s)",
        (alias, target) => {
            // Aceita whitespace e ponto-e-vírgula opcionais. Ex.:
            // `--privello-coral: var(--rose);` ou `--privello-coral:var(--rose)`
            const declaration = new RegExp(
                `${alias.replace(/-/g, "\\-")}\\s*:\\s*var\\(\\s*${target.replace(/-/g, "\\-")}\\s*\\)\\s*;`,
            );
            expect(cssSource).toMatch(declaration);
        },
    );
});
