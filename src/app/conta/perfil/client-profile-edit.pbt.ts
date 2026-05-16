// @vitest-environment jsdom

/**
 * Property 1 — bottom-sheet responsivo determinístico
 *
 * **Validates: Requirements 4.3, 4.5**
 *
 * Para todo `width ∈ [320, 1920]`, o consumidor classificado como
 * `bottom_sheet_em_mobile` (lista congelada na Tarefa 2 do `tasks.md`) resolve
 * `position` como:
 *   - `"bottom"` se `width <= 640`
 *   - `"center"` se `width > 640`
 *
 * Implementação: mockamos `window.matchMedia("(max-width: 640px)")` em função
 * do `width` gerado por `fc.integer({ min: 320, max: 1920 })`, renderizamos o
 * componente alvo (`<ClientProfileEdit>` representativo) e verificamos que o
 * `Modal` interno aplica a classe correta (`items-end` para `bottom`,
 * `items-center` para `center`) — proxy estável da prop `position` no DOM.
 *
 * Cf. `.kiro/specs/fase-6-mobile-cross-browser/design.md > Correctness Properties > Property 1`
 *  e `.kiro/specs/fase-6-mobile-cross-browser/mockups-diff.md > §Bottom-sheet decisões`.
 */

import { describe, beforeEach, afterEach, expect, vi } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ClientProfileEdit } from "./client-profile-edit";

// Mocks de Server Actions consumidas pelo componente — não exercitamos a action.
vi.mock("@/app/_actions/client-profile", () => ({
    updateClientNameAction: vi.fn(async () => ({ ok: true })),
    updateClientSlugAction: vi.fn(async () => ({ ok: true })),
}));

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function setMatchMedia(matches: boolean) {
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

beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => {
        root?.unmount();
    });
    container?.remove();
    container = null;
    root = null;
    vi.restoreAllMocks();
});

describe("Property 1 — bottom-sheet responsivo determinístico", () => {
    test.prop({ width: fc.integer({ min: 320, max: 1920 }) }, { numRuns: 50 })(
        "para todo width em [320, 1920], position correto é aplicado",
        ({ width }) => {
            // 1. matchMedia mock: matches = (width <= 640) — equivalência da media query
            //    "(max-width: 640px)".
            setMatchMedia(width <= 640);

            // 2. Render ClientProfileEdit em estado fechado, depois clicar no botão
            //    "Editar" para abrir o Modal.
            act(() => {
                root!.render(
                    createElement(ClientProfileEdit, {
                        currentName: "Teste",
                        currentSlug: "teste",
                    }),
                );
            });
            const trigger = container!.querySelector<HTMLButtonElement>("button");
            expect(trigger).not.toBeNull();
            act(() => {
                trigger!.click();
            });

            // 3. Ler a classe aplicada ao Modal e afirmar `position` correto.
            const dialog = document.querySelector<HTMLDivElement>("[role=\"dialog\"]");
            expect(dialog).not.toBeNull();

            if (width <= 640) {
                // position="bottom" → "items-end justify-center"
                expect(dialog!.className).toContain("items-end");
                expect(dialog!.className).toContain("justify-center");
            } else {
                // position="center" → "items-center justify-center"
                expect(dialog!.className).toContain("items-center");
                expect(dialog!.className).toContain("justify-center");
            }

            // 4. Limpar — fechar Modal antes da próxima iteração.
            act(() => {
                root!.unmount();
            });
            container!.remove();
            container = document.createElement("div");
            document.body.appendChild(container);
            root = createRoot(container);
        },
    );
});
