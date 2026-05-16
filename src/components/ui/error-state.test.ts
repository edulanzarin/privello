// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ErrorState } from "./error-state";

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

describe("ErrorState — render + variantes + a11y", () => {
    it("variant=\"page\" aplica role=alert", () => {
        render(
            createElement(ErrorState, {
                title: "Erro",
                onRetry: () => { },
                variant: "page",
            }),
        );
        const root = mountNode!.querySelector("[role]");
        expect(root!.getAttribute("role")).toBe("alert");
    });

    it("variant=\"inline\" aplica role=status", () => {
        render(
            createElement(ErrorState, {
                title: "Erro inline",
                onRetry: () => { },
                variant: "inline",
            }),
        );
        const root = mountNode!.querySelector("[role]");
        expect(root!.getAttribute("role")).toBe("status");
    });

    it("default sem variant é page", () => {
        render(
            createElement(ErrorState, {
                title: "x",
                onRetry: () => { },
            }),
        );
        expect(
            mountNode!.querySelector("[role=\"alert\"]"),
        ).not.toBeNull();
    });

    it("botão Tentar novamente dispara onRetry", () => {
        const onRetry = vi.fn();
        render(
            createElement(ErrorState, {
                title: "x",
                onRetry,
            }),
        );
        const btn = Array.from(
            mountNode!.querySelectorAll<HTMLButtonElement>("button"),
        ).find((b) => b.textContent?.includes("Tentar"));
        expect(btn).toBeDefined();
        act(() => {
            btn!.click();
        });
        expect(onRetry).toHaveBeenCalled();
    });

    it("homeHref renderiza link com href correto", () => {
        render(
            createElement(ErrorState, {
                title: "x",
                onRetry: () => { },
                homeHref: "/",
            }),
        );
        const link = mountNode!.querySelector<HTMLAnchorElement>("a");
        expect(link).not.toBeNull();
        expect(link!.getAttribute("href")).toBe("/");
        expect(link!.textContent).toContain("Voltar");
    });

    it("digest aparece quando variant=\"page\"", () => {
        render(
            createElement(ErrorState, {
                title: "x",
                onRetry: () => { },
                variant: "page",
                digest: "abc123",
            }),
        );
        expect(mountNode!.textContent).toContain("abc123");
    });

    it("digest é ocultado quando variant=\"inline\"", () => {
        render(
            createElement(ErrorState, {
                title: "x",
                onRetry: () => { },
                variant: "inline",
                digest: "secret-digest",
            }),
        );
        expect(mountNode!.textContent).not.toContain("secret-digest");
    });
});
