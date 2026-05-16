/**
 * Property 2 — cobertura mínima de loading/error nas rotas elegíveis.
 *
 * **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 2.5, 3.3**
 *
 * Para toda rota `r` em `inventario-rotas.md` com `loading === "criar"` ou
 * `loading === "existente"`, o arquivo `<segmento>/loading.tsx` existe E importa
 * `LoadingSkeleton`. Mesma invariante para `error.tsx` consumindo `ErrorState`.
 *
 * Implementação paramétrica via `it.each` — não há aleatoriedade.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..");
const INVENTORY_PATH = resolve(
    REPO_ROOT,
    ".kiro",
    "specs",
    "fase-5-ux",
    "inventario-rotas.md",
);

type Row = {
    routePath: string;
    category: string;
    loading: string;
    error: string;
};

function parseInventory(): Row[] {
    const md = readFileSync(INVENTORY_PATH, "utf8");
    const lines = md.split(/\r?\n/);
    const rows: Row[] = [];
    for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("|")) continue;
        if (line.startsWith("| caminho") || line.startsWith("|---")) continue;
        if (!line.includes("page.tsx") && !line.includes("route.ts")) continue;
        const cols = line
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());
        if (cols.length < 5) continue;
        const cleanPath = cols[0].replace(/`/g, "").trim();
        if (!cleanPath.startsWith("src/app/")) continue;
        rows.push({
            routePath: cleanPath,
            category: cols[1].replace(/`/g, "").trim(),
            loading: cols[2].replace(/`/g, "").trim(),
            error: cols[3].replace(/`/g, "").trim(),
        });
    }
    return rows;
}

function deriveSiblingPath(routePath: string, fileName: string): string {
    const dir = dirname(routePath);
    return join(dir, fileName).replace(/\\/g, "/");
}

const rows = parseInventory();
const loadingTargets = rows.filter(
    (r) => r.loading === "criar" || r.loading === "existente",
);
const errorTargets = rows.filter(
    (r) => r.error === "criar" || r.error === "existente",
);

describe("inventario — Property 2 (cobertura de loading/error)", () => {
    it("inventário foi parseado corretamente (47 pages + 25 routes)", () => {
        const pages = rows.filter((r) => r.routePath.endsWith("page.tsx"));
        const routes = rows.filter((r) => r.routePath.endsWith("route.ts"));
        expect(pages.length).toBe(47);
        expect(routes.length).toBe(25);
    });

    describe("loading.tsx — cada rota elegível tem arquivo + LoadingSkeleton", () => {
        it.each(loadingTargets.map((r) => [r.routePath, r] as const))(
            "%s — existe loading.tsx que usa LoadingSkeleton",
            (_p, row) => {
                const target = deriveSiblingPath(row.routePath, "loading.tsx");
                const abs = join(REPO_ROOT, target);
                expect(
                    existsSync(abs),
                    `loading.tsx ausente em ${target}`,
                ).toBe(true);
                const content = readFileSync(abs, "utf8");
                expect(
                    content.includes("LoadingSkeleton"),
                    `${target} não importa/usa LoadingSkeleton`,
                ).toBe(true);
            },
        );
    });

    describe("error.tsx — cada rota elegível tem arquivo + ErrorState", () => {
        it.each(errorTargets.map((r) => [r.routePath, r] as const))(
            "%s — existe error.tsx que usa ErrorState",
            (_p, row) => {
                const target = deriveSiblingPath(row.routePath, "error.tsx");
                const abs = join(REPO_ROOT, target);
                expect(
                    existsSync(abs),
                    `error.tsx ausente em ${target}`,
                ).toBe(true);
                const content = readFileSync(abs, "utf8");
                expect(
                    content.includes("ErrorState"),
                    `${target} não importa/usa ErrorState`,
                ).toBe(true);
            },
        );
    });
});
