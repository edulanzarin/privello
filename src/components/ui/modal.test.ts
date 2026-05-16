// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Modal } from "./modal";

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

const ce = createElement as unknown as (
    type: any,
    props?: any,
    ...children: any[]
) => React.ReactElement;

function pressTab(shift = false) {
    act(() => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Tab",
                bubbles: true,
                cancelable: true,
                shiftKey: shift,
            }),
        );
    });
}

describe("Modal — focus trap integrado (smoke)", () => {
    it("ao abrir Modal, foco vai para o primeiro elemento focável do container", () => {
        const onClose = vi.fn();
        render(
            ce(Modal,
                { open: true, onClose },
                createElement(
                    "div",
                    null,
                    createElement("button", { "data-testid": "first" }, "first"),
                    createElement("button", { "data-testid": "middle" }, "middle"),
                    createElement("button", { "data-testid": "last" }, "last"),
                ),
            ),
        );
        expect(document.activeElement?.getAttribute("data-testid")).toBe("first");
    });

    it("Tab cíclico: foco não escapa do container", () => {
        const onClose = vi.fn();
        render(
            ce(Modal,
                { open: true, onClose },
                createElement(
                    "div",
                    null,
                    createElement("button", { "data-testid": "first" }, "first"),
                    createElement("button", { "data-testid": "last" }, "last"),
                ),
            ),
        );
        const last = document.querySelector<HTMLButtonElement>(
            "[data-testid=\"last\"]",
        )!;
        act(() => {
            last.focus();
        });
        expect(document.activeElement).toBe(last);
        pressTab(false);
        // Cíclico → volta ao primeiro
        expect(document.activeElement?.getAttribute("data-testid")).toBe("first");
    });

    it("Escape dispara onClose", () => {
        const onClose = vi.fn();
        render(
            ce(Modal,
                { open: true, onClose },
                createElement("button", null, "ok"),
            ),
        );
        act(() => {
            document.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Escape",
                    bubbles: true,
                    cancelable: true,
                }),
            );
        });
        expect(onClose).toHaveBeenCalled();
    });

    it("não renderiza quando open=false", () => {
        const onClose = vi.fn();
        render(
            ce(Modal,
                { open: false, onClose },
                createElement("button", null, "ok"),
            ),
        );
        expect(document.querySelector("[role=\"dialog\"]")).toBeNull();
    });

    it("API pública preservada: persistent não fecha por backdrop click", () => {
        const onClose = vi.fn();
        render(
            ce(Modal,
                { open: true, onClose, persistent: true },
                createElement("div", { "data-testid": "content" }, "x"),
            ),
        );
        const dialog = document.querySelector<HTMLElement>("[role=\"dialog\"]")!;
        act(() => {
            dialog.click();
        });
        expect(onClose).not.toHaveBeenCalled();
    });
});
