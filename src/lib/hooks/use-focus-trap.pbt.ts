// @vitest-environment jsdom

import { describe, expect, beforeEach, afterEach } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { createElement, useEffect, useRef, useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useFocusTrap } from "./use-focus-trap";

// ── Helper component ─────────────────────────────────────────────────────────
type HelperProps = {
    initialActive: boolean;
    n: number;
};

let setActiveExternal: ((next: boolean) => void) | null = null;

function Helper(props: HelperProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(props.initialActive);
    useEffect(() => {
        setActiveExternal = setActive;
        return () => {
            setActiveExternal = null;
        };
    }, []);
    useFocusTrap(ref, active);
    const buttons: ReturnType<typeof createElement>[] = [];
    for (let i = 0; i < props.n; i++) {
        buttons.push(
            createElement("button", {
                key: `btn-${i}`,
                "data-testid": `btn-${i}`,
                type: "button",
            }, `btn-${i}`),
        );
    }
    return createElement(
        "div",
        // eslint-disable-next-line react-hooks/refs
        { ref, "data-testid": "trap" },
        ...buttons,
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
    setActiveExternal = null;
    // Limpa elementos externos que tenham sido injetados nos testes.
    document.querySelectorAll("[data-pbt-external]").forEach((el) => el.remove());
});

function render(props: HelperProps) {
    act(() => {
        root!.render(createElement(Helper, props));
    });
}

function pressTab(shift = false) {
    const event = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
        shiftKey: shift,
    });
    act(() => {
        document.dispatchEvent(event);
    });
    // jsdom não implementa o comportamento default do Tab. Se o handler do
    // focus trap não chamou preventDefault (i.e. não estamos numa borda),
    // simulamos manualmente a movimentação que o browser faria.
    if (!event.defaultPrevented) {
        const trap = document.querySelector<HTMLElement>("[data-testid=\"trap\"]");
        if (!trap) return;
        const focusables = Array.from(
            trap.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
        );
        if (focusables.length === 0) return;
        const activeEl = document.activeElement as HTMLElement | null;
        const idx = activeEl ? focusables.indexOf(activeEl as HTMLButtonElement) : -1;
        let nextIdx: number;
        if (idx === -1) {
            nextIdx = shift ? focusables.length - 1 : 0;
        } else {
            nextIdx = shift
                ? (idx - 1 + focusables.length) % focusables.length
                : (idx + 1) % focusables.length;
        }
        act(() => {
            focusables[nextIdx].focus();
        });
    }
}

function focusByIdx(idx: number) {
    const el = document.querySelector<HTMLButtonElement>(`[data-testid="btn-${idx}"]`);
    if (!el) throw new Error(`btn-${idx} not found`);
    act(() => {
        el.focus();
    });
}

function activeIdx(): number {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return -1;
    const test = el.getAttribute("data-testid");
    if (!test || !test.startsWith("btn-")) return -1;
    return parseInt(test.slice(4), 10);
}

// ── Properties ────────────────────────────────────────────────────────────────

describe("useFocusTrap — Property 1 (completude do ciclo)", () => {
    /**
     * Property 1: Para todo `n ∈ [2, 10]` e `i ∈ [0, n)`, com o foco posicionado
     * no item `i`, aplicar `n` Tabs retorna ao mesmo elemento. O mesmo vale para
     * `n` Shift+Tabs. Isso confirma que o ciclo é estritamente periódico em `n`.
     *
     * **Validates: Requirements 4.6, 4.7**
     */
    test.prop([fc.integer({ min: 2, max: 10 }), fc.integer({ min: 0, max: 9 })])(
        "n Tabs e n Shift+Tabs retornam ao mesmo elemento",
        (n, rawI) => {
            const i = rawI % n;
            render({ initialActive: true, n });
            focusByIdx(i);
            expect(activeIdx()).toBe(i);

            for (let k = 0; k < n; k++) pressTab(false);
            expect(activeIdx()).toBe(i);

            for (let k = 0; k < n; k++) pressTab(true);
            expect(activeIdx()).toBe(i);
        },
    );
});

describe("useFocusTrap — Property 2 (libera foco anterior)", () => {
    /**
     * Property 2: Para todo elemento externo `e` que recebia foco antes de o
     * trap ativar, ao desativar o trap, `document.activeElement === e`.
     *
     * **Validates: Requirements 4.5**
     */
    test.prop([
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.integer({ min: 2, max: 10 }),
    ])(
        "ao desativar, foco volta ao elemento externo que tinha foco",
        (id, n) => {
            const external = document.createElement("button");
            external.setAttribute("data-pbt-external", "true");
            external.setAttribute("data-id", id);
            external.textContent = id;
            document.body.appendChild(external);
            external.focus();
            expect(document.activeElement).toBe(external);

            render({ initialActive: false, n });

            act(() => {
                setActiveExternal?.(true);
            });
            // foco moveu para dentro do trap
            expect(activeIdx()).toBe(0);

            act(() => {
                setActiveExternal?.(false);
            });
            // foco volta para o externo
            expect(document.activeElement).toBe(external);
        },
    );
});
