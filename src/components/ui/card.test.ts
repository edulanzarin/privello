// @vitest-environment jsdom

/**
 * Card — testes (Design System v2 / Tahoe Sensual)
 *
 * Steering: `.kiro/steering/design-system.md` §3.6 (glass) + §5.3 (radius).
 *
 * Cobertura:
 *  - Variantes v2: `glass` (default), `solid`, `dark`, `success-subtle`,
 *    `warning-subtle`, `danger-subtle`. Variant `default` é alias de `glass`.
 *  - Radius `rounded-2xl` (24px) em todas as variantes (Tahoe generoso).
 *  - Padding `none`/`sm`/`md`/`lg` mapeados para classes p-*.
 *  - Props HTML pass-through (className, data-*, aria-*).
 *  - Sub-componentes (`CardHeader`, `CardTitle`, `CardDescription`).
 */

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
    const el = mountNode!.firstElementChild as HTMLDivElement | null;
    expect(el).not.toBeNull();
    return el!;
}

describe("Card v2 — variantes base", () => {
    it("sem props usa variant=\"default\" (glass) + padding=\"md\"", () => {
        render(createElement(Card, null, "conteudo"));
        const el = getCard();
        expect(el.className).toContain("glass-panel");
        expect(el.className).toContain("rounded-2xl");
        expect(el.className).toContain("p-5");
        expect(el.textContent).toContain("conteudo");
    });

    it("variant=\"glass\" aplica glass-panel + rounded-2xl", () => {
        render(createElement(Card, { variant: "glass" } as CardProps, "x"));
        const cls = getCard().className;
        expect(cls).toContain("glass-panel");
        expect(cls).toContain("rounded-2xl");
    });

    it("variant=\"solid\" aplica bg-surface + hairline border-line", () => {
        render(createElement(Card, { variant: "solid" } as CardProps, "x"));
        const cls = getCard().className;
        expect(cls).toContain("bg-surface");
        expect(cls).toContain("border-line");
        expect(cls).toContain("rounded-2xl");
    });

    it("variant=\"dark\" aplica bg-ink + text-white", () => {
        render(createElement(Card, { variant: "dark" } as CardProps, "x"));
        const cls = getCard().className;
        expect(cls).toContain("bg-ink");
        expect(cls).toContain("text-white");
        expect(cls).toContain("rounded-2xl");
    });
});

describe("Card v2 — variantes subtle", () => {
    it("variant=\"success-subtle\" usa bg-success-soft + border-success/30", () => {
        render(createElement(Card, { variant: "success-subtle" } as CardProps, "ok"));
        const cls = getCard().className;
        expect(cls).toContain("bg-success-soft");
        expect(cls).toContain("border-success/30");
        expect(cls).toContain("rounded-2xl");
    });

    it("variant=\"warning-subtle\" usa bg-warning-soft + border-warning/30", () => {
        render(createElement(Card, { variant: "warning-subtle" } as CardProps, "atencao"));
        const cls = getCard().className;
        expect(cls).toContain("bg-warning-soft");
        expect(cls).toContain("border-warning/30");
        expect(cls).toContain("rounded-2xl");
    });

    it("variant=\"danger-subtle\" usa bg-danger-soft + border-danger/30", () => {
        render(createElement(Card, { variant: "danger-subtle" } as CardProps, "erro"));
        const cls = getCard().className;
        expect(cls).toContain("bg-danger-soft");
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
            expect(cls).not.toContain("glass-panel");
            expect(cls).not.toContain("bg-surface");
            expect(cls).not.toContain("bg-ink");
        }
    });
});

describe("Card v2 — padding", () => {
    it("padding=\"none\" não aplica p-*", () => {
        render(createElement(Card, { padding: "none" } as CardProps, "x"));
        expect(getCard().className).not.toMatch(/\bp-\d/);
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

describe("Card v2 — className custom + props HTML", () => {
    it("className custom é mesclado", () => {
        render(createElement(Card, { className: "marker-custom" } as CardProps, "x"));
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

describe("Card v2 — sub-componentes", () => {
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
        expect(h3!.className).toContain("text-ink");
        expect(h3!.textContent).toBe("Titulo");
    });

    it("CardDescription renderiza <p> com text-ink-dim", () => {
        render(createElement(CardDescription, null, "desc"));
        const p = mountNode!.querySelector("p");
        expect(p).not.toBeNull();
        expect(p!.className).toContain("text-ink-dim");
        expect(p!.textContent).toBe("desc");
    });

    it("subcomponentes mesclam className custom", () => {
        render(createElement(CardHeader, { className: "extra" }, "h"));
        expect(mountNode!.querySelector("div")!.className).toContain("extra");
    });
});
