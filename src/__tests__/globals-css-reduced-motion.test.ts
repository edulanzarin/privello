/**
 * Property 3 — Conformidade com `prefers-reduced-motion`.
 *
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
 *
 * Para `src/app/globals.css`:
 *  - existe `@media (prefers-reduced-motion: reduce)`;
 *  - dentro do bloco, há regra cobrindo `*, *::before, *::after` com
 *    `animation-duration` e `transition-duration`;
 *  - dentro do bloco, há regras cobrindo `::view-transition-old(*)`,
 *    `::view-transition-new(*)`, `::view-transition-group(*)`.
 *
 * Implementação paramétrica via parser textual — não há aleatoriedade.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS_PATH = resolve(__dirname, "..", "app", "globals.css");

describe("globals.css — Property 3 (prefers-reduced-motion)", () => {
    let css = "";
    let block = "";

    beforeAll(() => {
        css = readFileSync(CSS_PATH, "utf8");
        // Extrai bloco @media (prefers-reduced-motion: reduce) {...}
        const startIdx = css.indexOf("@media (prefers-reduced-motion: reduce)");
        if (startIdx === -1) return;
        // Conta chaves balanceadas a partir do `{` após o seletor
        const braceStart = css.indexOf("{", startIdx);
        if (braceStart === -1) return;
        let depth = 1;
        let i = braceStart + 1;
        while (i < css.length && depth > 0) {
            const ch = css[i];
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
            i++;
        }
        block = css.substring(braceStart, i);
    });

    it("contém @media (prefers-reduced-motion: reduce)", () => {
        expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    });

    it("bloco @media cobre `*, *::before, *::after`", () => {
        expect(block).toContain("*::before");
        expect(block).toContain("*::after");
    });

    it("bloco @media neutraliza animation-duration", () => {
        expect(block).toMatch(/animation-duration\s*:\s*0(?:\.\d+)?ms/);
    });

    it("bloco @media neutraliza transition-duration", () => {
        expect(block).toMatch(/transition-duration\s*:\s*0(?:\.\d+)?ms/);
    });

    it("bloco @media cobre `::view-transition-old(*)`", () => {
        expect(block).toContain("::view-transition-old(*)");
    });

    it("bloco @media cobre `::view-transition-new(*)`", () => {
        expect(block).toContain("::view-transition-new(*)");
    });

    it("bloco @media cobre `::view-transition-group(*)`", () => {
        expect(block).toContain("::view-transition-group(*)");
    });
});
