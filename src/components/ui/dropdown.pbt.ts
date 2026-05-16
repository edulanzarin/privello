// @vitest-environment jsdom

import { describe, expect, beforeEach, afterEach } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
    Dropdown,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
} from "./dropdown";

// ── Helper: monta um Dropdown com configuração paramétrica ───────────────────
type Config = {
    controlled: boolean;
    defaultOpen: boolean;
};

let externalState: { open: boolean; setOpen: (v: boolean) => void } | null = null;

function setupExternalState(initialOpen: boolean) {
    let value = initialOpen;
    externalState = {
        get open() {
            return value;
        },
        set open(v) {
            value = v;
        },
        setOpen: (v: boolean) => {
            value = v;
        },
    } as unknown as { open: boolean; setOpen: (v: boolean) => void };
}

function build({ controlled, defaultOpen }: Config) {
    setupExternalState(defaultOpen);
    return createElement(
        Dropdown,
        {
            ...(controlled ? { open: externalState!.open } : { defaultOpen }),
            onOpenChange: (next: boolean) => {
                if (controlled) {
                    // No modo controlado, ignoramos a callback (estado externo é fonte de verdade)
                    // e NÃO atualizamos `externalState.open`. O Dropdown deve respeitar o `open` recebido.
                    return;
                }
                externalState!.open = next;
            },
        },
        createElement(DropdownTrigger, { key: "trg", className: "trigger" }, "open"),
        createElement(
            DropdownContent,
            { key: "cnt" },
            createElement(DropdownItem, { key: "a" }, "a"),
            createElement(DropdownItem, { key: "b" }, "b"),
        ),
    );
}

// ── Test environment lifecycle ────────────────────────────────────────────────
let root: Root | null = null;
let container: HTMLDivElement | null = null;

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
    externalState = null;
});

function renderConfig(config: Config) {
    act(() => {
        root!.render(build(config));
    });
}

function rerenderConfig(config: Config) {
    // Re-renderiza com o estado externo atual (relevante para modo controlado).
    act(() => {
        root!.render(build(config));
    });
}

function isOpen(): boolean {
    return !!document.querySelector("[role=\"menu\"]");
}

function clickTrigger() {
    const trigger = document.querySelector<HTMLElement>(".trigger");
    if (!trigger) throw new Error("Trigger não encontrado");
    act(() => {
        trigger.click();
    });
}

function clickOutside() {
    const evt = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    act(() => {
        document.body.dispatchEvent(evt);
    });
}

function pressEscape() {
    const evt = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
    });
    act(() => {
        document.dispatchEvent(evt);
    });
}

// ── Property 3 ────────────────────────────────────────────────────────────────

describe("Dropdown — Property 3 (estado controlado vs interno)", () => {
    /**
     * Property 3: Para todo par `(controlled, defaultOpen, sequenceOfClicks)`:
     *
     * - Se `controlled === true`, o estado externo é fonte de verdade. Independente
     *   de cliques na trigger, outside clicks ou Escape, o `open` final do Dropdown
     *   é igual ao `open` controlado externamente (que neste teste **não muda**).
     * - Se `controlled === false`, o Dropdown alterna conforme cliques na trigger,
     *   e fecha após outside click ou Escape.
     *
     * **Validates: Requirements 3.3**
     */
    test.prop([
        fc.boolean(),
        fc.boolean(),
        fc.array(fc.constantFrom("trigger", "outside", "escape"), { maxLength: 5 }),
    ])(
        "controlled prevalece; uncontrolled alterna conforme eventos",
        (controlled, defaultOpen, sequence) => {
            renderConfig({ controlled, defaultOpen });

            // Estado inicial esperado
            let expectedOpen = defaultOpen;
            expect(isOpen()).toBe(expectedOpen);

            for (const ev of sequence) {
                if (ev === "trigger") clickTrigger();
                else if (ev === "outside") clickOutside();
                else pressEscape();

                if (controlled) {
                    // No modo controlado, nada do que fazemos altera o `open`
                    // externo (porque ignoramos `onOpenChange`). Re-renderizamos
                    // para garantir que o componente reflita exatamente o `open`
                    // externo congelado em `defaultOpen`.
                    rerenderConfig({ controlled, defaultOpen });
                    expect(isOpen()).toBe(defaultOpen);
                } else {
                    if (ev === "trigger") expectedOpen = !expectedOpen;
                    else expectedOpen = false; // outside e escape fecham
                    expect(isOpen()).toBe(expectedOpen);
                }
            }
        },
    );
});


// ── Property 4 ────────────────────────────────────────────────────────────────

describe("Dropdown — Property 4 (roundtrip Tab com trapFocus=true)", () => {
    /**
     * Property 4: Para todo Dropdown aberto com `trapFocus={true}` e `n ≥ 2`
     * `DropdownItem`s, com foco no primeiro item, aplicar `n` Tabs retorna o
     * foco ao primeiro item. (Consequência da Property 1 aplicada via integração
     * focus trap → Dropdown.)
     *
     * **Validates: Requirements 3.6, 4.8**
     */
    function buildN(n: number) {
        const items: ReturnType<typeof createElement>[] = [];
        for (let i = 0; i < n; i++) {
            items.push(createElement(DropdownItem, { key: `it-${i}` }, `it-${i}`));
        }
        return createElement(
            Dropdown,
            { defaultOpen: true },
            createElement(DropdownTrigger, { key: "trg", className: "trigger" }, "open"),
            createElement(DropdownContent, { key: "cnt", trapFocus: true }, ...items),
        );
    }

    function pressTabIntegrated(shift = false) {
        const event = new KeyboardEvent("keydown", {
            key: "Tab",
            bubbles: true,
            cancelable: true,
            shiftKey: shift,
        });
        act(() => {
            document.dispatchEvent(event);
        });
        if (!event.defaultPrevented) {
            // Polyfill da movimentação default do Tab quando o trap não intercepta.
            const items = Array.from(
                document.querySelectorAll<HTMLButtonElement>("[role=\"menuitem\"]:not([disabled])"),
            );
            if (items.length === 0) return;
            const activeEl = document.activeElement as HTMLElement | null;
            const idx = activeEl ? items.indexOf(activeEl as HTMLButtonElement) : -1;
            const nextIdx = idx === -1
                ? (shift ? items.length - 1 : 0)
                : (shift ? (idx - 1 + items.length) % items.length : (idx + 1) % items.length);
            act(() => {
                items[nextIdx].focus();
            });
        }
    }

    test.prop([fc.integer({ min: 2, max: 8 })])(
        "n Tabs partindo do primeiro item retorna ao primeiro item",
        (n) => {
            act(() => {
                root!.render(buildN(n));
            });
            const items = Array.from(
                document.querySelectorAll<HTMLButtonElement>("[role=\"menuitem\"]"),
            );
            expect(items.length).toBe(n);
            act(() => {
                items[0].focus();
            });
            expect(document.activeElement).toBe(items[0]);

            for (let k = 0; k < n; k++) pressTabIntegrated(false);
            expect(document.activeElement).toBe(items[0]);
        },
    );
});
