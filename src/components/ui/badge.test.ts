// @vitest-environment jsdom

/**
 * Badge — testes de variant/classes (Design System v2 / Tahoe Sensual).
 *
 * Cada entrada de `VARIANT_CLASSES` lista as classes específicas da
 * variante (sem incluir as classes-base comuns). Snapshot mantém a
 * expectativa sincronizada com `variantStyles` em `badge.tsx`.
 */

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

const VARIANT_CLASSES: Record<Variant, readonly string[]> = {
    default: ["bg-line/40", "text-ink"],
    rose: ["bg-rose-soft", "text-rose"],
    coral: ["bg-rose-soft", "text-rose"], // alias legado de rose
    success: ["bg-success-soft", "text-success"],
    warning: ["bg-warning-soft", "text-warning"],
    muted: ["bg-line/40", "text-ink-dim"],
    dark: ["bg-ink", "text-white"],
    info: ["bg-info-soft", "text-info"],
    danger: ["bg-danger-soft", "text-danger"],
    premium: ["bg-plum-soft", "text-plum"],
    boost: ["bg-peach-soft", "text-peach"],
    verified: ["bg-cream/40", "text-plum", "border", "border-cream/60"],
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
        render(createElement(Badge, { variant: "rose" }, "Premium"));
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

describe("Badge — coral é alias de rose (backwards-compat)", () => {
    it("coral e rose produzem classes idênticas (ordenadas)", () => {
        const collect = (variant: "coral" | "rose") => {
            const local = document.createElement("div");
            document.body.appendChild(local);
            const localRoot = createRoot(local);
            act(() => {
                localRoot.render(
                    createElement(Badge, { variant }, "x") as React.ReactElement,
                );
            });
            const classes = Array.from(
                local.querySelector<HTMLSpanElement>("span")!.classList,
            ).sort();
            act(() => {
                localRoot.unmount();
            });
            local.remove();
            return classes;
        };
        expect(collect("coral")).toEqual(collect("rose"));
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
