// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useEffect, useRef, useState, createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useFocusTrap } from "./use-focus-trap";

type HelperProps = {
    initialActive: boolean;
    autoFocus?: "first" | "data-autofocus" | false;
    items: { id: string; "data-autofocus"?: boolean; disabled?: boolean }[];
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
    useFocusTrap(ref, active, { autoFocus: props.autoFocus ?? "first" });
    return createElement(
        "div",
        { ref, "data-testid": "trap-container" },
        ...props.items.map((it) =>
            createElement("button", {
                key: it.id,
                "data-testid": it.id,
                "data-autofocus": it["data-autofocus"] ? "true" : undefined,
                disabled: it.disabled,
                type: "button",
            }, it.id),
        ),
    );
}

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
}

describe("useFocusTrap", () => {
    it("foca o primeiro elemento focável ao ativar", () => {
        render({
            initialActive: true,
            items: [{ id: "btn-a" }, { id: "btn-b" }, { id: "btn-c" }],
        });
        expect(document.activeElement?.getAttribute("data-testid")).toBe("btn-a");
    });

    it("respeita data-autofocus quando presente", () => {
        render({
            initialActive: true,
            autoFocus: "data-autofocus",
            items: [
                { id: "btn-a" },
                { id: "btn-b", "data-autofocus": true },
                { id: "btn-c" },
            ],
        });
        expect(document.activeElement?.getAttribute("data-testid")).toBe("btn-b");
    });

    it("Tab no último elemento volta para o primeiro (cíclico)", () => {
        render({
            initialActive: true,
            items: [{ id: "btn-a" }, { id: "btn-b" }, { id: "btn-c" }],
        });
        // foco está em btn-a; mover manualmente para o último.
        const last = document.querySelector<HTMLButtonElement>("[data-testid=\"btn-c\"]")!;
        act(() => {
            last.focus();
        });
        pressTab(false);
        expect(document.activeElement?.getAttribute("data-testid")).toBe("btn-a");
    });

    it("Shift+Tab no primeiro vai para o último", () => {
        render({
            initialActive: true,
            items: [{ id: "btn-a" }, { id: "btn-b" }, { id: "btn-c" }],
        });
        // foco no primeiro
        const first = document.querySelector<HTMLButtonElement>("[data-testid=\"btn-a\"]")!;
        act(() => {
            first.focus();
        });
        pressTab(true);
        expect(document.activeElement?.getAttribute("data-testid")).toBe("btn-c");
    });

    it("ao desativar, foco volta ao elemento anterior", () => {
        // botão externo ao container
        const external = document.createElement("button");
        external.setAttribute("data-testid", "external");
        external.textContent = "external";
        document.body.appendChild(external);
        external.focus();
        expect(document.activeElement).toBe(external);

        render({
            initialActive: false,
            items: [{ id: "btn-a" }, { id: "btn-b" }],
        });

        // ativar
        act(() => {
            setActiveExternal?.(true);
        });
        expect(document.activeElement?.getAttribute("data-testid")).toBe("btn-a");

        // desativar
        act(() => {
            setActiveExternal?.(false);
        });
        expect(document.activeElement).toBe(external);

        external.remove();
    });

    it("filtra elementos disabled da lista de focáveis", () => {
        render({
            initialActive: true,
            items: [
                { id: "btn-a", disabled: true },
                { id: "btn-b" },
                { id: "btn-c" },
            ],
        });
        // primeiro focável deve ser btn-b
        expect(document.activeElement?.getAttribute("data-testid")).toBe("btn-b");
    });
});
