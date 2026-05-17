// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Card, CardDescription, CardHeader, CardTitle, type CardProps } from "./card";

let root: Root | null = null;
let mountNode: HTMLDivElement | null = null;

beforeEach(() => {
    mountNode = document.createElement("div");
    document.body.appendChild(mountNode);
    root = createRoot(mountNode);
});

afterEach(() => {
    act(() => {
        root?.unmount();
    });
    mountNode?.remove();
    mountNode = null;
    root = null;
});

function render(node: React.ReactNode) {
    act(() => {
        root!.render(node as React.ReactElement);
    });
}

function getCard(): HTMLDivElement {
    // Card é o primeiro div renderizado dentro do mountNode.
    const el = mountNode!.firstElementChild as HTMLDivElement | null;
    expect(el).not.toBeNull();
    return el!;
}

describe("Card — render padrão e variantes legadas", () => {
    it("sem props usa variant=\"default\" (glass) + padding=\"md\"", () => {
        render(createElement(Card, null, "conteudo"));
        const el = getCard();
        expect(el.className).toContain("glass-card");
        expect(el.className).toContain("rounded-2xl");
        expect(el.className).toContain("p-5"); // padding md
        expect(el.textContent).toContain("conteudo");
    });

    it("variant=\"glass\" aplica glass-card", () => {
        render(createElement(Card, { variant: "glass" } as CardProps, "x"));
        expect(getCard().className).toContain("glass-card");
    });

    it("variant=\"solid\" aplica bg-white + hairline", () => {
        render(createElement(Card, { variant: "solid" } as CardProps, "x"));
        const cls = getCard().className;
        expect(cls).toContain("bg-white");
        expect(cls).toContain("border");
        expect(cls).toContain("border-black/[0.06]");
        expect(cls).toContain("rounded-2xl");
    });

    it("variant=\"dark\" aplica bg-sidebar + text-white", () => {
        render(createElement(Card, { variant: "dark" } as CardProps, "x"));
        const cls = getCard().className;
        expect(cls).toContain("bg-sidebar");
        expect(cls).toContain("text-white");
        expect(cls).toContain("shadow-lg");
    });
});

describe("Card — novas variantes subtle (Fase A / Task 3.3)", () => {
    it("variant=\"success-subtle\" usa bg-success-soft + border-success/30", () => {
        render(
            createElement(
                Card,
                { variant: "success-subtle" } as CardProps,
                "ok",
            ),
        );
        const cls = getCard().className;
        expect(cls).toContain("bg-success-soft");
        expect(cls).toContain("border");
        expect(cls).toContain("border-success/30");
        expect(cls).toContain("rounded-2xl");
    });

    it("variant=\"warning-subtle\" usa bg-warning-soft + border-warning/30", () => {
        render(
            createElement(
                Card,
                { variant: "warning-subtle" } as CardProps,
                "atencao",
            ),
        );
        const cls = getCard().className;
        expect(cls).toContain("bg-warning-soft");
        expect(cls).toContain("border");
        expect(cls).toContain("border-warning/30");
        expect(cls).toContain("rounded-2xl");
    });

    it("variant=\"danger-subtle\" usa bg-danger-soft + border-danger/30", () => {
        render(
            createElement(
                Card,
                { variant: "danger-subtle" } as CardProps,
                "erro",
            ),
        );
        const cls = getCard().className;
        expect(cls).toContain("bg-danger-soft");
        expect(cls).toContain("border");
        expect(cls).toContain("border-danger/30");
        expect(cls).toContain("rounded-2xl");
    });

    it("variantes subtle não vazam classes de glass/dark/solid", () => {
        const subtle: Array<CardProps["variant"]> = [
            "success-subtle",
            "warning-subtle",
            "danger-subtle",
        ];
        for (const variant of subtle) {
            render(createElement(Card, { variant } as CardProps, "x"));
            const cls = getCard().className;
            expect(cls).not.toContain("glass-card");
            expect(cls).not.toContain("bg-white");
            expect(cls).not.toContain("bg-sidebar");
        }
    });
});

describe("Card — padding", () => {
    it("padding=\"none\" não aplica utilitário p-*", () => {
        render(
            createElement(Card, { padding: "none" } as CardProps, "x"),
        );
        const cls = getCard().className;
        expect(cls).not.toMatch(/\bp-\d/);
    });

    it("padding=\"sm\" aplica p-4", () => {
        render(createElement(Card, { padding: "sm" } as CardProps, "x"));
        expect(getCard().className).toContain("p-4");
    });

    it("padding=\"md\" aplica p-5", () => {
        render(createElement(Card, { padding: "md" } as CardProps, "x"));
        expect(getCard().className).toContain("p-5");
    });

    it("padding=\"lg\" aplica p-6", () => {
        render(createElement(Card, { padding: "lg" } as CardProps, "x"));
        expect(getCard().className).toContain("p-6");
    });
});

describe("Card — className custom + props HTML", () => {
    it("className custom é mesclado", () => {
        render(
            createElement(
                Card,
                { className: "marker-custom" } as CardProps,
                "x",
            ),
        );
        expect(getCard().className).toContain("marker-custom");
    });

    it("propaga atributos HTML (data-*, aria-*)", () => {
        render(
            createElement(
                Card,
                { "data-testid": "kpi", role: "group" } as CardProps,
                "x",
            ),
        );
        const el = getCard();
        expect(el.getAttribute("data-testid")).toBe("kpi");
        expect(el.getAttribute("role")).toBe("group");
    });
});

describe("Card sub-componentes", () => {
    it("CardHeader renderiza filhos com classe base mb-3", () => {
        render(createElement(CardHeader, null, "header"));
        const header = mountNode!.querySelector("div");
        expect(header).not.toBeNull();
        expect(header!.className).toContain("mb-3");
        expect(header!.textContent).toBe("header");
    });

    it("CardTitle renderiza <h3> com tipografia base", () => {
        render(createElement(CardTitle, null, "Titulo"));
        const h3 = mountNode!.querySelector("h3");
        expect(h3).not.toBeNull();
        expect(h3!.className).toContain("text-lg");
        expect(h3!.className).toContain("font-semibold");
        expect(h3!.textContent).toBe("Titulo");
    });

    it("CardDescription renderiza <p> com text-muted", () => {
        render(createElement(CardDescription, null, "desc"));
        const p = mountNode!.querySelector("p");
        expect(p).not.toBeNull();
        expect(p!.className).toContain("text-muted");
        expect(p!.textContent).toBe("desc");
    });

    it("subcomponentes mesclam className custom", () => {
        render(createElement(CardHeader, { className: "extra" }, "h"));
        expect(mountNode!.querySelector("div")!.className).toContain("extra");
    });
});
