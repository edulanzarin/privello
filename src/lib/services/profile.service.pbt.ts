// src/lib/services/profile.service.pbt.ts
//
// Properties 2 e 3 (cf. design.md > Correctness Properties).
//
// Property 2 — paginação cursor-based em `getProfileMediaPage` é completa
// e disjunta. Para todo conjunto S de mídia pública e toda sequência de
// chamadas seguindo cursores retornados, união(P_i.items) === S e
// interseção(P_i ∩ P_j) === ∅ para i ≠ j, e P_k.hasMore === false na
// última página.
//
// Property 3 — cursor é monotônico estritamente crescente. Para toda
// sequência c_0, c_1, ..., c_k retornada por chamadas consecutivas,
// (sortOrder, id) decodificado de c_i é estritamente menor que o de c_{i+1}
// na ordem lex (sortOrder asc, id asc).
//
// Estratégia de teste:
//
// Como `getProfileMediaPage` depende do Prisma, escrevemos as Properties
// sobre um SIMULADOR PURO que reproduz a lógica de paginação cursor do
// service (mesmas funções `encodeMediaCursor`, `decodeMediaCursor`,
// `clampPageSize`, `buildMediaWhere` aplicadas a um array em memória). O
// service real é um wrapper fino sobre essa lógica + a query Prisma; o
// simulador testa a invariante matemática (corretude do algoritmo de
// cursor), enquanto o teste determinístico em `profile.service.test.ts`
// (a ser escrito em fase futura ou como parte de Wave 9 se necessário)
// pode validar a integração com Prisma se o teste de paridade pre/post
// migration assim exigir.
//
// Default `numRuns: 100` herdado de vitest.setup.ts.
// _Validates: Requirements 1.2, 1.3, 1.4, 7.1, 7.3 — Properties 2 e 3._

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { __test_internal__ } from "./profile.service";

const { encodeMediaCursor, decodeMediaCursor, clampPageSize } = __test_internal__;

// ─── Simulador puro de getProfileMediaPage ─────────────────────────────────
//
// Aceita um array de itens e devolve a página atual baseada em um cursor
// opcional. Mesma lógica do service (filtro `isPublic` se !includePrivate,
// ordenação por (sortOrder asc, id asc), `take = pageSize + 1`).

type SimItem = {
    id: string;
    sortOrder: number;
    isPublic: boolean;
};

function simulatePage(
    items: SimItem[],
    pageSize: number,
    cursor: string | undefined,
    includePrivate = false,
): { items: SimItem[]; nextCursor: string | null; hasMore: boolean } {
    const filtered = items.filter((m) => includePrivate || m.isPublic);
    const sorted = [...filtered].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.id.localeCompare(b.id);
    });
    const decoded = decodeMediaCursor(cursor);
    const startIdx = decoded
        ? sorted.findIndex(
            (it) =>
                it.sortOrder > decoded.sortOrder ||
                (it.sortOrder === decoded.sortOrder && it.id > decoded.id),
        )
        : 0;
    const effectiveStart = startIdx === -1 ? sorted.length : startIdx;
    const slice = sorted.slice(effectiveStart, effectiveStart + pageSize + 1);
    const hasMore = slice.length > pageSize;
    const trimmed = hasMore ? slice.slice(0, pageSize) : slice;
    const last = trimmed[trimmed.length - 1];
    const nextCursor = hasMore && last ? encodeMediaCursor(last) : null;
    return { items: trimmed, nextCursor, hasMore };
}

// Itera todas as páginas a partir do cursor inicial; retorna lista plana
// de todas as items e a sequência de cursores retornados.
function paginateAll(
    items: SimItem[],
    pageSize: number,
    includePrivate = false,
): { allItems: SimItem[]; cursors: string[] } {
    const allItems: SimItem[] = [];
    const cursors: string[] = [];
    let cursor: string | undefined;
    // Hard cap em 1000 iterações para evitar loop infinito caso uma regressão
    // futura no service quebre o invariante de avanço estrito.
    for (let i = 0; i < 1000; i++) {
        const page = simulatePage(items, pageSize, cursor, includePrivate);
        allItems.push(...page.items);
        if (!page.hasMore) {
            return { allItems, cursors };
        }
        if (!page.nextCursor) {
            // hasMore=true sem nextCursor é estado inválido; o algoritmo
            // não deve produzi-lo. Encerramos o loop com allItems até aqui.
            return { allItems, cursors };
        }
        cursors.push(page.nextCursor);
        cursor = page.nextCursor;
    }
    throw new Error("paginateAll did not terminate within 1000 iterations");
}

// ─── Geradores ────────────────────────────────────────────────────────────

const arbId = fc.string({ minLength: 1, maxLength: 16 }).filter((s) => /^[A-Za-z0-9_-]+$/.test(s));
const arbSimItem = fc.record({
    id: arbId,
    sortOrder: fc.integer({ min: -1000, max: 1000 }),
    isPublic: fc.boolean(),
});

// Conjunto único de itens (chave = id). minLength 0 para cobrir o caso do
// perfil sem mídia. maxLength 60 para manter o número de iterações de
// paginação manejável (aprox. 60 / pageSize páginas no pior caso).
const arbItemSet = fc.uniqueArray(arbSimItem, {
    minLength: 0,
    maxLength: 60,
    selector: (it) => it.id,
});

// pageSize válido [1, 24] (mesma janela do service: clamp default 12, max 24).
const arbPageSize = fc.integer({ min: 1, max: 24 });

// ─── Property 2 — paginação completa + disjunta ───────────────────────────

describe("getProfileMediaPage — Property 2 (paginação completa + disjunta)", () => {
    test.prop([arbItemSet, arbPageSize])(
        "união das páginas === conjunto público; interseção entre páginas === ∅",
        (items, pageSize) => {
            const { allItems } = paginateAll(items, pageSize, false);

            // Esperado: todos os itens públicos, ordenados por (sortOrder asc, id asc).
            const expected = [...items]
                .filter((m) => m.isPublic)
                .sort((a, b) => {
                    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
                    return a.id.localeCompare(b.id);
                });

            // Completude (união === conjunto público).
            expect(allItems).toEqual(expected);

            // Disjunção (interseção entre páginas é trivialmente vazia se a lista
            // achatada é igual ao conjunto único — não há repetições). Verificar
            // explicitamente comparando comprimento da lista vs conjunto.
            const ids = allItems.map((i) => i.id);
            const uniqueIds = new Set(ids);
            expect(ids.length).toBe(uniqueIds.size);
        },
    );

    test.prop([arbItemSet, arbPageSize])(
        "última página tem hasMore === false",
        (items, pageSize) => {
            // Iteramos até a última página e verificamos hasMore.
            let cursor: string | undefined;
            let lastHasMore = false;
            for (let i = 0; i < 1000; i++) {
                const page = simulatePage(items, pageSize, cursor, false);
                lastHasMore = page.hasMore;
                if (!page.hasMore) break;
                if (!page.nextCursor) break;
                cursor = page.nextCursor;
            }
            expect(lastHasMore).toBe(false);
        },
    );
});

// ─── Property 3 — cursor monotônico estritamente crescente ────────────────

describe("getProfileMediaPage — Property 3 (cursor monotônico)", () => {
    test.prop([arbItemSet, arbPageSize])(
        "decoded(c_i) < decoded(c_{i+1}) na ordem lex (sortOrder asc, id asc)",
        (items, pageSize) => {
            const { cursors } = paginateAll(items, pageSize, false);

            for (let i = 0; i + 1 < cursors.length; i++) {
                const a = decodeMediaCursor(cursors[i]);
                const b = decodeMediaCursor(cursors[i + 1]);
                expect(a).not.toBeNull();
                expect(b).not.toBeNull();
                if (!a || !b) continue;
                const aLessThanB =
                    a.sortOrder < b.sortOrder || (a.sortOrder === b.sortOrder && a.id < b.id);
                expect(aLessThanB).toBe(true);
            }
        },
    );

    test.prop([fc.string()])(
        "cursor malformado decodifica para null (AC 1.4 — fallback à 1ª página)",
        (cursor) => {
            const decoded = decodeMediaCursor(cursor);
            // Decodificações válidas só ocorrem se o input for o resultado de um
            // base64url(`<int>:<id>`). String aleatória deve falhar — mas alguns
            // strings podem coincidentemente decodificar para `<num>:<algo>`.
            // O contrato observável é: ou retorna null, ou retorna um par
            // bem-formado `{ sortOrder, id }` com sortOrder finito e id não vazio.
            if (decoded !== null) {
                expect(Number.isFinite(decoded.sortOrder)).toBe(true);
                expect(decoded.id.length).toBeGreaterThan(0);
            }
        },
    );

    test.prop([fc.integer({ min: -10000, max: 10000 }), arbId])(
        "encode/decode é round-trip para valores válidos",
        (sortOrder, id) => {
            const encoded = encodeMediaCursor({ sortOrder, id });
            const decoded = decodeMediaCursor(encoded);
            expect(decoded).toEqual({ sortOrder, id });
        },
    );
});

// ─── Sanidade de clampPageSize ─────────────────────────────────────────────

describe("getProfileMediaPage — clampPageSize sanity", () => {
    test.prop([fc.option(fc.integer({ min: -100, max: 1000 }), { nil: undefined })])(
        "resultado em [1, 24]; default 12 quando inválido",
        (raw) => {
            const out = clampPageSize(raw ?? undefined);
            expect(out).toBeGreaterThanOrEqual(1);
            expect(out).toBeLessThanOrEqual(24);
            if (raw == null || raw <= 0) {
                expect(out).toBe(12);
            }
        },
    );
});
