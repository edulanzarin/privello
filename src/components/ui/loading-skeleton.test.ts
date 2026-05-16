// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
    LoadingSkeleton,
    type LoadingSkeletonVariant,
} from "./loading-skeleton";

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

const VARIANTS: LoadingSkeletonVariant[] = [
    "card",
    "list",
    "detail",
    "form",
    "gallery",
    "text-block",
];

const TESTID_PREFIX: Record<LoadingSkeletonVariant, string> = {
    card: "skeleton-card-",
    list: "skeleton-list-",
    detail: "skeleton-detail-",
    form: "skeleton-form-",
    gallery: "skeleton-gallery-",
    "text-block": "skeleton-text-",
};

describe("LoadingSkeleton — variantes e a11y", () => {
    for (const variant of VARIANTS) {
        it(`variant="${variant}" — container tem aria-busy=true e aria-label default`, () => {
            render(createElement(LoadingSkeleton, { variant }));
            const container =
                mountNode!.querySelector<HTMLElement>("[data-variant]");
            expect(container).not.toBeNull();
            expect(container!.getAttribute("aria-busy")).toBe("true");
            expect(container!.getAttribute("aria-label")).toBe("Carregando…");
            expect(container!.getAttribute("role")).toBe("status");
            expect(container!.getAttribute("data-variant")).toBe(variant);
        });

        it(`variant="${variant}" — count controla número de itens`, () => {
            render(createElement(LoadingSkeleton, { variant, count: 2 }));
            const items = mountNode!.querySelectorAll(
                `[data-testid^="${TESTID_PREFIX[variant]}"]`,
            );
            expect(items.length).toBe(2);
        });
    }

    it("aceita aria-label custom", () => {
        render(
            createElement(LoadingSkeleton, {
                variant: "card",
                ariaLabel: "Carregando perfis",
            }),
        );
        const container = mountNode!.querySelector<HTMLElement>("[data-variant]");
        expect(container!.getAttribute("aria-label")).toBe("Carregando perfis");
    });

    it("className é mesclado no container raiz", () => {
        render(
            createElement(LoadingSkeleton, {
                variant: "list",
                className: "custom-marker",
            }),
        );
        const container = mountNode!.querySelector<HTMLElement>("[data-variant]");
        expect(container!.className).toContain("custom-marker");
    });
});
