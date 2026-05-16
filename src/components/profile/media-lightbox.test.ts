// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MediaLightbox } from "./media-lightbox";

/**
 * Smoke test determinístico para `<MediaLightbox>` (Tarefa 9.4).
 *
 * Forma escolhida: render via Testing Library (createRoot) + verificação de
 * efeito observável no DOM (presença/ausência do role="dialog" e do filho).
 * Como `useMediaQuery` consome `window.matchMedia`, mockamos para retornar
 * `matches: true` (mobile) ou `matches: false` (desktop) e afirmamos que o
 * Modal interno renderiza com `position` correto através do efeito CSS
 * (mobile: `items-stretch justify-stretch`; desktop: `items-center justify-center`).
 *
 * Forma alternativa: `vi.mock("@/lib/hooks/use-media-query")` para retornar
 * boolean direto. Mantemos a forma com `matchMedia` mockado para validar a
 * cadeia completa (mais próximo do uso real).
 */

let root: Root | null = null;
let mountNode: HTMLDivElement | null = null;

function mockMatchMedia(matches: boolean) {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches,
            media: query,
            onchange: null,
            addEventListener: () => { },
            removeEventListener: () => { },
            addListener: () => { },
            removeListener: () => { },
            dispatchEvent: () => true,
        })),
    });
}

function renderLightbox(open: boolean, child: React.ReactNode) {
    act(() => {
        root!.render(
            // eslint-disable-next-line react/no-children-prop -- types do MediaLightbox exigem children como prop nomeada; createElement com 3 args nao casa
            createElement(MediaLightbox, {
                open,
                onClose: () => { },
                children: child,
            }),
        );
    });
}

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

describe("MediaLightbox — comportamento responsivo", () => {
    it("não renderiza nada quando open=false", () => {
        mockMatchMedia(true);
        renderLightbox(false, createElement("div", { "data-testid": "child" }, "filho"));
        expect(document.querySelector("[role=\"dialog\"]")).toBeNull();
        expect(document.querySelector("[data-testid=\"child\"]")).toBeNull();
    });

    it("mobile (matchMedia.matches=true): aplica position=fullscreen no Modal interno", () => {
        mockMatchMedia(true);
        renderLightbox(true, createElement("div", { "data-testid": "child" }, "filho"));
        const dialog = document.querySelector<HTMLDivElement>("[role=\"dialog\"]");
        expect(dialog).not.toBeNull();
        // position="fullscreen" maps to "items-stretch justify-stretch" no Modal primitivo.
        expect(dialog!.className).toContain("items-stretch");
        expect(dialog!.className).toContain("justify-stretch");
    });

    it("desktop (matchMedia.matches=false): aplica position=center no Modal interno", () => {
        mockMatchMedia(false);
        renderLightbox(true, createElement("div", { "data-testid": "child" }, "filho"));
        const dialog = document.querySelector<HTMLDivElement>("[role=\"dialog\"]");
        expect(dialog).not.toBeNull();
        // position="center" maps to "items-center justify-center" no Modal primitivo.
        expect(dialog!.className).toContain("items-center");
        expect(dialog!.className).toContain("justify-center");
    });

    it("aplica touch-none no container do conteúdo (gestos)", () => {
        mockMatchMedia(true);
        renderLightbox(true, createElement("div", { "data-testid": "child" }, "filho"));
        const child = document.querySelector("[data-testid=\"child\"]");
        expect(child).not.toBeNull();
        // touch-none é aplicado no `<div ref={contentRef} className={cn("relative z-10", className)}>` do Modal.
        const parent = child?.parentElement;
        expect(parent?.className).toContain("touch-none");
    });

    it("preserva role=dialog e aria-modal do Modal interno (ARIA)", () => {
        mockMatchMedia(false);
        renderLightbox(true, createElement("div", null, "filho"));
        const dialog = document.querySelector("[role=\"dialog\"]");
        expect(dialog).not.toBeNull();
        expect(dialog!.getAttribute("aria-modal")).toBe("true");
    });
});
