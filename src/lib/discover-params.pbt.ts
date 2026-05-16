// src/lib/discover-params.pbt.ts
//
// Property 2 (adaptada) — round-trip via construção de URL.
//
// O design.md > Correctness Properties > Property 2 previa um par estrito
// `parseDiscoverParams ↔ serializeDiscoverParams`. Esse par NÃO existe na
// API atual: `parseDiscoverSearchParams` aceita `Record<string, string |
// string[] | undefined>` e devolve `{ filters, sort, view }`, enquanto
// `buildDiscoverHrefFromCity` aceita `Record<string, string>` e devolve uma
// URL string — tipos de entrada/saída assimétricos. Ver
// `.kiro/specs/fase-2-testes/testing-conventions.md > §5.2`.
//
// Em vez de pular, declaramos a Property 2 sobre o caminho realmente
// existente: construir uma URL via `buildDiscoverHrefFromCity`, extrair a
// query string, recompor o `Record<string, string>` via
// `Object.fromEntries(URLSearchParams)` e parsear de volta com
// `parseDiscoverSearchParams`. A propriedade afirma que o `{filters, sort,
// view}` resultante é estruturalmente equivalente ao que o gerador
// produziu, com a equivalência detalhada abaixo.
//
// FORMA EXATA DA EQUIVALÊNCIA (chave a chave do input gerado):
//
//   pmin/pmax/amin/amax  → input é string de inteiro; saída é Number(input).
//                          Quando ausente no input, saída é `undefined`.
//   verified/local/domicilio
//                        → input "1" → boolean `true`. Qualquer outro valor
//                          (incluindo ausência) → boolean `false`. Por isso
//                          o gerador só emite "1" ou omite; valores alheios
//                          a esse contrato pertencem aos `*.test.ts`.
//   genero               → "garotos" | "casais" → preservado em `gender`.
//                          Ausência → `gender` undefined.
//   q                    → input já trimado e não vazio (constraint do
//                          gerador) → preservado idêntico em `search`.
//                          Ausência → `search` undefined.
//   bairro               → idem `q` (constraint do gerador), mas o módulo
//                          NÃO expõe `bairro` em `filters`; este valor passa
//                          pelo round-trip de URL mas não é projetado em
//                          `filters` — verificamos sua presença na query
//                          de saída separadamente.
//   ordem                → "price_asc" | "price_desc" | "rating" → preservado
//                          em `sort`. Ausência → `sort = "relevance"`.
//   view                 → "list" → "list". "grid" ou ausência → "grid".
//
// Default global `numRuns: 100` vem de `vitest.setup.ts`. Sem seed fixa.

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { buildDiscoverHrefFromCity, parseDiscoverSearchParams } from "@/lib/discover-params";

/**
 * Forma canônica gerada pelo arbitrary. Cada campo é opcional; quando
 * ausente, simplesmente não vai para o `Record<string, string>` de input.
 */
type DiscoverInput = {
    pmin?: number;
    pmax?: number;
    amin?: number;
    amax?: number;
    verified?: true;
    local?: true;
    domicilio?: true;
    genero?: "garotos" | "casais";
    q?: string;
    bairro?: string;
    ordem?: "price_asc" | "price_desc" | "rating";
    view?: "grid" | "list";
};

/**
 * String não-vazia, sem leading/trailing whitespace e sem caracteres de
 * controle. Mantém o round-trip simples: `parseDiscoverSearchParams` faz
 * `.trim()` em `q` e `bairro`, então não geramos espaços nas pontas.
 */
const trimmedNonEmptyString = fc
    .string({ minLength: 1, maxLength: 32 })
    .map((s) => s.replace(/[\s\u0000-\u001f\u007f]/g, "x"))
    .filter((s) => s.length > 0 && s === s.trim());

const citySlug = fc
    .stringMatching(/^[a-z]{2,12}-[a-z]{2}$/);

const discoverInputArb: fc.Arbitrary<DiscoverInput> = fc.record(
    {
        pmin: fc.integer({ min: 0, max: 99_999_900 }),
        pmax: fc.integer({ min: 0, max: 99_999_900 }),
        amin: fc.integer({ min: 18, max: 99 }),
        amax: fc.integer({ min: 18, max: 99 }),
        verified: fc.constant(true as const),
        local: fc.constant(true as const),
        domicilio: fc.constant(true as const),
        genero: fc.constantFrom("garotos" as const, "casais" as const),
        q: trimmedNonEmptyString,
        bairro: trimmedNonEmptyString,
        ordem: fc.constantFrom("price_asc" as const, "price_desc" as const, "rating" as const),
        view: fc.constantFrom("grid" as const, "list" as const),
    },
    { requiredKeys: [] },
);

/** Converte o objeto gerado para o `Record<string, string>` aceito por buildDiscoverHrefFromCity. */
function toQueryRecord(input: DiscoverInput): Record<string, string> {
    const r: Record<string, string> = {};
    if (input.pmin !== undefined) r.pmin = String(input.pmin);
    if (input.pmax !== undefined) r.pmax = String(input.pmax);
    if (input.amin !== undefined) r.amin = String(input.amin);
    if (input.amax !== undefined) r.amax = String(input.amax);
    if (input.verified) r.verified = "1";
    if (input.local) r.local = "1";
    if (input.domicilio) r.domicilio = "1";
    if (input.genero) r.genero = input.genero;
    if (input.q !== undefined) r.q = input.q;
    if (input.bairro !== undefined) r.bairro = input.bairro;
    if (input.ordem) r.ordem = input.ordem;
    if (input.view) r.view = input.view;
    return r;
}

describe("discover-params / round-trip via buildDiscoverHrefFromCity → parseDiscoverSearchParams", () => {
    test.prop([citySlug, discoverInputArb])(
        "filters/sort/view recompostos batem com o input gerado",
        (slug, input) => {
            const queryRecord = toQueryRecord(input);
            const href = buildDiscoverHrefFromCity(slug, queryRecord);

            // O path sempre começa com o slug (sanity check do builder).
            expect(href.startsWith(`/descobrir/${slug}`)).toBe(true);

            // Extrai a query string e a re-hidrata como Record<string,string>.
            const qs = new URLSearchParams(href.split("?")[1] ?? "");
            const raw: Record<string, string> = Object.fromEntries(qs);

            const { filters, sort, view } = parseDiscoverSearchParams(raw);

            // Numéricos: number ↔ string round-trip.
            expect(filters.priceMin).toBe(input.pmin);
            expect(filters.priceMax).toBe(input.pmax);
            expect(filters.ageMin).toBe(input.amin);
            expect(filters.ageMax).toBe(input.amax);

            // Flags booleanas: "1" → true; ausência → false.
            expect(filters.verifiedOnly).toBe(input.verified === true);
            expect(filters.hasOwnPlace).toBe(input.local === true);
            expect(filters.homeVisit).toBe(input.domicilio === true);

            // Enums.
            expect(filters.gender).toBe(input.genero);
            expect(sort).toBe(input.ordem ?? "relevance");
            expect(view).toBe(input.view === "list" ? "list" : "grid");

            // Strings trimadas: gerador já produz string trimada e não-vazia,
            // então o trim do parser é idempotente.
            expect(filters.search).toBe(input.q);

            // `bairro` não é projetado em `filters`, mas deve sobreviver no
            // round-trip de URL.
            if (input.bairro !== undefined) {
                expect(qs.get("bairro")).toBe(input.bairro);
            } else {
                expect(qs.has("bairro")).toBe(false);
            }
        },
    );
});
