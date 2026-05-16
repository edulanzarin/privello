// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EmptyState } from "./empty-state";

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

describe("EmptyState — render + cta", () => {
    it("renderiza com props mínimas (apenas title)", () => {
        render(createElement(EmptyState, { title: "Lista vazia" }));
        expect(mountNode!.textContent).toContain("Lista vazia");
        expect(mountNode!.querySelector("a")).toBeNull();
        expect(mountNode!.querySelector("button")).toBeNull();
    });

    it("renderiza description e icon quando informados", () => {
        render(
            createElement(EmptyState, {
                title: "Sem itens",
                description: "Volte mais tarde.",
                icon: createElement("span", { "data-testid": "ico" }, "★"),
            }),
        );
        expect(mountNode!.textContent).toContain("Sem itens");
        expect(mountNode!.textContent).toContain("Volte mais tarde.");
        expect(mountNode!.querySelector("[data-testid=\"ico\"]")).not.toBeNull();
    });

    it("action.href renderiza <a> com href", () => {
        render(
            createElement(EmptyState, {
                title: "x",
                action: { label: "Explorar", href: "/buscar" },
            }),
        );
        const link = mountNode!.querySelector<HTMLAnchorElement>("a");
        expect(link).not.toBeNull();
        expect(link!.getAttribute("href")).toBe("/buscar");
        expect(link!.textContent).toContain("Explorar");
    });

    it("action.onClick (sem href) renderiza <button> que dispara handler", () => {
        const onClick = vi.fn();
        render(
            createElement(EmptyState, {
                title: "x",
                action: { label: "Limpar filtros", onClick },
            }),
        );
        const btn = mountNode!.querySelector<HTMLButtonElement>("button");
        expect(btn).not.toBeNull();
        expect(btn!.textContent).toContain("Limpar filtros");
        act(() => {
            btn!.click();
        });
        expect(onClick).toHaveBeenCalled();
    });

    it("action.href + action.onClick: prefere <Link>; onClick é handler complementar", () => {
        const onClick = vi.fn();
        render(
            createElement(EmptyState, {
                title: "x",
                action: { label: "Ir", href: "/x", onClick },
            }),
        );
        const link = mountNode!.querySelector<HTMLAnchorElement>("a");
        expect(link).not.toBeNull();
        expect(mountNode!.querySelector("button")).toBeNull();
        act(() => {
            link!.click();
        });
        expect(onClick).toHaveBeenCalled();
    });
});
