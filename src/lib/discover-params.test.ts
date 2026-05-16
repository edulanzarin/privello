import { describe, it, expect } from "vitest";
import {
    buildDiscoverHref,
    buildDiscoverHrefFromCity,
    parseDiscoverSearchParams,
} from "@/lib/discover-params";

describe("parseDiscoverSearchParams", () => {
    describe("caso típico", () => {
        it("extrai filtros, sort e view de uma URLSearchParams completa", () => {
            const raw = {
                pmin: "1000",
                pmax: "5000",
                amin: "21",
                amax: "35",
                genero: "garotos",
                verified: "1",
                local: "1",
                domicilio: "1",
                q: "  helena  ",
                bairro: "  jardins  ",
                ordem: "price_asc",
                view: "list",
            };

            const { filters, sort, view } = parseDiscoverSearchParams(raw);

            expect(filters).toEqual({
                gender: "garotos",
                priceMin: 1000,
                priceMax: 5000,
                ageMin: 21,
                ageMax: 35,
                verifiedOnly: true,
                hasOwnPlace: true,
                homeVisit: true,
                search: "helena",
            });
            expect(sort).toBe("price_asc");
            expect(view).toBe("list");
        });

        it("aceita arrays de string (Next pode entregar `string | string[]`) usando a primeira ocorrência", () => {
            const raw = {
                pmin: ["1000", "9999"],
                ordem: ["rating", "price_desc"],
                view: ["list", "grid"],
            };

            const { filters, sort, view } = parseDiscoverSearchParams(raw);

            expect(filters.priceMin).toBe(1000);
            expect(sort).toBe("rating");
            expect(view).toBe("list");
        });
    });

    describe("bordas", () => {
        it("entrada vazia produz filtros vazios, sort 'relevance' e view 'grid'", () => {
            const { filters, sort, view } = parseDiscoverSearchParams({});

            expect(filters).toEqual({
                gender: undefined,
                priceMin: undefined,
                priceMax: undefined,
                ageMin: undefined,
                ageMax: undefined,
                verifiedOnly: false,
                hasOwnPlace: false,
                homeVisit: false,
                search: undefined,
            });
            expect(sort).toBe("relevance");
            expect(view).toBe("grid");
        });

        it("genero inválido cai em undefined", () => {
            const { filters } = parseDiscoverSearchParams({ genero: "outro" });
            expect(filters.gender).toBeUndefined();
        });

        it("ordem inválida cai em 'relevance'", () => {
            expect(parseDiscoverSearchParams({ ordem: "lixo" }).sort).toBe("relevance");
        });

        it("view diferente de 'list' cai em 'grid'", () => {
            expect(parseDiscoverSearchParams({ view: "tabela" }).view).toBe("grid");
        });

        it("flags só ativam quando o valor é exatamente '1'", () => {
            const { filters } = parseDiscoverSearchParams({
                verified: "true",
                local: "yes",
                domicilio: "0",
            });
            expect(filters.verifiedOnly).toBe(false);
            expect(filters.hasOwnPlace).toBe(false);
            expect(filters.homeVisit).toBe(false);
        });

        it("search/bairro vazios após trim viram undefined (não string vazia)", () => {
            const { filters } = parseDiscoverSearchParams({ q: "   ", bairro: "   " });
            expect(filters.search).toBeUndefined();
        });

        it("valores numéricos malformados produzem NaN (contrato atual: não validado)", () => {
            const { filters } = parseDiscoverSearchParams({ pmin: "abc", amin: "xyz" });
            // Documenta o comportamento real: Number("abc") === NaN.
            expect(Number.isNaN(filters.priceMin)).toBe(true);
            expect(Number.isNaN(filters.ageMin)).toBe(true);
        });
    });
});

describe("buildDiscoverHref", () => {
    it("monta href sem query quando não há params", () => {
        expect(buildDiscoverHref("blumenau-sc", {})).toBe("/descobrir/blumenau-sc");
    });

    it("adiciona/atualiza chaves a partir do current", () => {
        const current = new URLSearchParams("ordem=rating&view=list");
        const href = buildDiscoverHref("blumenau-sc", { view: "grid", verified: "1" }, current);
        expect(href.startsWith("/descobrir/blumenau-sc?")).toBe(true);
        const out = new URLSearchParams(href.split("?")[1]);
        expect(out.get("ordem")).toBe("rating");
        expect(out.get("view")).toBe("grid");
        expect(out.get("verified")).toBe("1");
    });

    it("remove chave quando o valor é null, undefined ou string vazia", () => {
        const current = new URLSearchParams("verified=1&local=1&domicilio=1");
        const href = buildDiscoverHref(
            "blumenau-sc",
            { verified: null, local: undefined, domicilio: "" },
            current,
        );
        expect(href).toBe("/descobrir/blumenau-sc");
    });

    it("aceita chaves repetidas no current preservando uma única instância (URLSearchParams.set)", () => {
        const current = new URLSearchParams("genero=garotos&genero=casais");
        // current.toString() preserva ambas; quando passamos { genero: "garotos" } um set substitui ambas por uma.
        const href = buildDiscoverHref("blumenau-sc", { genero: "garotos" }, current);
        const out = new URLSearchParams(href.split("?")[1] ?? "");
        expect(out.getAll("genero")).toEqual(["garotos"]);
    });
});

describe("buildDiscoverHrefFromCity", () => {
    it("retorna apenas o path quando não há filtros", () => {
        expect(buildDiscoverHrefFromCity("sao-paulo-sp")).toBe("/descobrir/sao-paulo-sp");
    });

    it("anexa querystring quando há filtros", () => {
        const href = buildDiscoverHrefFromCity("sao-paulo-sp", { ordem: "rating", verified: "1" });
        expect(href.startsWith("/descobrir/sao-paulo-sp?")).toBe(true);
        const qs = new URLSearchParams(href.split("?")[1]);
        expect(qs.get("ordem")).toBe("rating");
        expect(qs.get("verified")).toBe("1");
    });
});
