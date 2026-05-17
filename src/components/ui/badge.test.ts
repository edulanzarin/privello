// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Badge, type BadgeProps } from "./badge";

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

type Variant = NonNullable<BadgeProps["variant"]>;

/**
 * Snapshot canônico de classes por variante. Mantém a expectativa
 * sincronizada com `variantStyles` em `badge.tsx` para que regressões
 * (ex.: alteração acidental de `text-coral` → `text-rose-500`) sejam
 * detectadas pelo teste, não em revisão manual.
 *
 * Cada entrada lista as classes específicas da variante (sem incluir
 * as classes-base comuns a todas as variantes).
 */
const VARIANT_CLASSES: Record<Variant, readonly string[]> = {
    default: ["bg-black/[0.06]", "text-foreground"],
    coral: ["bg-coral/10", "text-coral"],
    success: ["bg-success/12", "text-success"],
    warning: ["bg-warning/12", "text-warning"],
    muted: ["bg-black/[0.04]", "text-muted"],
    dark: ["bg-foreground", "text-white"],
    info: ["bg-info-soft", "text-blue"],
    danger: ["bg-danger-soft", "text-danger"],
    premium: ["bg-purple-soft", "text-accent-purple"],
};

const BASE_CLASSES = [
    "inline-flex",
    "items-center",
    "gap-1",
    "rounded-full",
    "px-2",
    "py-[2px]",
    "text-xs",
    "font-semibold",
] as const;

const VARIANTS = Object.keys(VARIANT_CLASSES) as Variant[];

describe("Badge — render por variante", () => {
    it("sem prop variant aplica a variante default", () => {
        render(createElement(Badge, null, "Texto"));
        const span = mountNode!.querySelector<HTMLSpanElement>("span");
        expect(span).not.toBeNull();
        for (const cls of VARIANT_CLASSES.default) {
            expect(span!.classList.contains(cls)).toBe(true);
        }
    });

    it("renderiza children dentro do span", () => {
        render(createElement(Badge, { variant: "coral" }, "Premium"));
        const span = mountNode!.querySelector<HTMLSpanElement>("span");
        expect(span!.textContent).toBe("Premium");
    });

    it("aplica classes-base em qualquer variante", () => {
        render(createElement(Badge, { variant: "info" }, "x"));
        const span = mountNode!.querySelector<HTMLSpanElement>("span");
        for (const cls of BASE_CLASSES) {
            expect(span!.classList.contains(cls)).toBe(true);
        }
    });

    for (const variant of VARIANTS) {
        it(`variant="${variant}" aplica as classes canônicas`, () => {
            render(createElement(Badge, { variant }, variant));
            const span = mountNode!.querySelector<HTMLSpanElement>("span");
            expect(span).not.toBeNull();
            for (const cls of VARIANT_CLASSES[variant]) {
                expect(span!.classList.contains(cls)).toBe(true);
            }
        });
    }
});

describe("Badge — snapshot de classes por variante", () => {
    it("snapshot estável das classes geradas para cada variante", () => {
        const snapshot: Record<string, string[]> = {};
        for (const variant of VARIANTS) {
            // Renderiza isoladamente para evitar interferência entre testes.
            const local = document.createElement("div");
            document.body.appendChild(local);
            const localRoot = createRoot(local);
            act(() => {
                localRoot.render(
                    createElement(Badge, { variant }, variant) as React.ReactElement,
                );
            });
            const span = local.querySelector<HTMLSpanElement>("span");
            // Ordena para manter snapshot determinístico independente da
            // ordem de aplicação interna do `cn`/`twMerge`.
            snapshot[variant] = Array.from(span!.classList).sort();
            act(() => {
                localRoot.unmount();
            });
            local.remove();
        }
        expect(snapshot).toMatchInlineSnapshot(`
          {
            "coral": [
              "bg-coral/10",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-coral",
              "text-xs",
            ],
            "danger": [
              "bg-danger-soft",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-danger",
              "text-xs",
            ],
            "dark": [
              "bg-foreground",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-white",
              "text-xs",
            ],
            "default": [
              "bg-black/[0.06]",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-foreground",
              "text-xs",
            ],
            "info": [
              "bg-info-soft",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-blue",
              "text-xs",
            ],
            "muted": [
              "bg-black/[0.04]",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-muted",
              "text-xs",
            ],
            "premium": [
              "bg-purple-soft",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-accent-purple",
              "text-xs",
            ],
            "success": [
              "bg-success/12",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-success",
              "text-xs",
            ],
            "warning": [
              "bg-warning/12",
              "font-semibold",
              "gap-1",
              "inline-flex",
              "items-center",
              "px-2",
              "py-[2px]",
              "rounded-full",
              "text-warning",
              "text-xs",
            ],
          }
        `);
    });
});

describe("Badge — className custom é mesclado pelo cn/twMerge", () => {
    it("classe custom adicional permanece presente junto com as da variante", () => {
        render(
            createElement(
                Badge,
                { variant: "success", className: "ml-2" },
                "x",
            ),
        );
        const span = mountNode!.querySelector<HTMLSpanElement>("span");
        expect(span!.classList.contains("ml-2")).toBe(true);
        for (const cls of VARIANT_CLASSES.success) {
            expect(span!.classList.contains(cls)).toBe(true);
        }
    });

    it("twMerge resolve conflito de utilitário (px-4 sobrescreve px-2 base)", () => {
        render(
            createElement(
                Badge,
                { variant: "default", className: "px-4" },
                "x",
            ),
        );
        const span = mountNode!.querySelector<HTMLSpanElement>("span");
        expect(span!.classList.contains("px-4")).toBe(true);
        expect(span!.classList.contains("px-2")).toBe(false);
    });

    it("propaga atributos HTML extras (title, data-*)", () => {
        render(
            createElement(
                Badge,
                {
                    variant: "warning",
                    title: "tooltip",
                    "data-testid": "badge-x",
                } as BadgeProps,
                "x",
            ),
        );
        const span = mountNode!.querySelector<HTMLSpanElement>(
            "[data-testid=\"badge-x\"]",
        );
        expect(span).not.toBeNull();
        expect(span!.getAttribute("title")).toBe("tooltip");
    });
});
