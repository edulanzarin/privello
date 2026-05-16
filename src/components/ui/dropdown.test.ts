// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
    Dropdown,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
} from "./dropdown";

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

function clickTrigger() {
    const trigger = document.querySelector<HTMLButtonElement>(
        "[aria-haspopup=\"menu\"]",
    );
    expect(trigger).not.toBeNull();
    act(() => {
        trigger!.click();
    });
}

function pressEscape() {
    act(() => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
        );
    });
}

function pressArrow(key: "ArrowDown" | "ArrowUp") {
    act(() => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
        );
    });
}

function makeBasicDropdown(props: {
    onOpenChange?: (open: boolean) => void;
    onItemClick?: () => void;
    open?: boolean;
    defaultOpen?: boolean;
} = {}) {
    return createElement(
        Dropdown,
        {
            open: props.open,
            defaultOpen: props.defaultOpen,
            onOpenChange: props.onOpenChange,
        },
        createElement(DropdownTrigger, null, "Open"),
        createElement(
            DropdownContent,
            null,
            createElement(DropdownItem, { onClick: props.onItemClick }, "Item A"),
            createElement(DropdownItem, null, "Item B"),
            createElement(DropdownItem, { variant: "danger" as const }, "Delete"),
            createElement(DropdownItem, { disabled: true }, "Disabled"),
        ),
    );
}

describe("Dropdown — ARIA", () => {
    it("trigger tem aria-haspopup=\"menu\" e aria-expanded reflete estado", () => {
        const onOpenChange = vi.fn();
        render(makeBasicDropdown({ onOpenChange }));

        const trigger = document.querySelector<HTMLButtonElement>(
            "[aria-haspopup=\"menu\"]",
        );
        expect(trigger).not.toBeNull();
        expect(trigger!.getAttribute("aria-expanded")).toBe("false");

        clickTrigger();
        expect(trigger!.getAttribute("aria-expanded")).toBe("true");
        expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("content renderiza com role=\"menu\" quando aberto", () => {
        render(makeBasicDropdown({ defaultOpen: true }));
        expect(document.querySelector("[role=\"menu\"]")).not.toBeNull();
    });

    it("items renderizam com role=\"menuitem\"", () => {
        render(makeBasicDropdown({ defaultOpen: true }));
        const items = document.querySelectorAll("[role=\"menuitem\"]");
        expect(items.length).toBe(4);
    });
});

describe("Dropdown — fechamento", () => {
    it("Escape fecha o Dropdown", () => {
        const onOpenChange = vi.fn();
        render(makeBasicDropdown({ defaultOpen: true, onOpenChange }));
        pressEscape();
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(document.querySelector("[role=\"menu\"]")).toBeNull();
    });

    it("outside click fecha o Dropdown", () => {
        const onOpenChange = vi.fn();
        render(makeBasicDropdown({ defaultOpen: true, onOpenChange }));
        // Clicar em outro elemento fora do trigger e do content
        const outside = document.createElement("button");
        document.body.appendChild(outside);
        act(() => {
            outside.dispatchEvent(
                new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
            );
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
        outside.remove();
    });
});

describe("Dropdown — keyboard nav", () => {
    it("ArrowDown/ArrowUp move foco entre items habilitados", () => {
        render(makeBasicDropdown({ defaultOpen: true }));
        const items = document.querySelectorAll<HTMLButtonElement>(
            "[role=\"menuitem\"]:not([disabled])",
        );
        expect(items.length).toBe(3);

        // foco inicial no primeiro (focus trap)
        expect(document.activeElement).toBe(items[0]);

        pressArrow("ArrowDown");
        expect(document.activeElement).toBe(items[1]);

        pressArrow("ArrowDown");
        expect(document.activeElement).toBe(items[2]);

        pressArrow("ArrowDown"); // cíclico
        expect(document.activeElement).toBe(items[0]);

        pressArrow("ArrowUp");
        expect(document.activeElement).toBe(items[2]);
    });
});

describe("Dropdown — variantes de item", () => {
    it("variant=\"danger\" aplica text-danger", () => {
        render(makeBasicDropdown({ defaultOpen: true }));
        const items = document.querySelectorAll<HTMLButtonElement>(
            "[role=\"menuitem\"]",
        );
        const danger = items[2]; // 3º é "Delete" (variant danger)
        expect(danger.className).toContain("text-danger");
    });

    it("disabled não dispara onClick", () => {
        const onClick = vi.fn();
        render(
            createElement(
                Dropdown,
                { defaultOpen: true },
                createElement(DropdownTrigger, null, "Open"),
                createElement(
                    DropdownContent,
                    null,
                    createElement(DropdownItem, { disabled: true, onClick }, "X"),
                ),
            ),
        );
        const item = document.querySelector<HTMLButtonElement>("[role=\"menuitem\"]")!;
        act(() => {
            item.click();
        });
        expect(onClick).not.toHaveBeenCalled();
    });

    it("Enter em item ativo dispara onClick (via click nativo)", () => {
        const onClick = vi.fn();
        render(makeBasicDropdown({ defaultOpen: true, onItemClick: onClick }));
        const items = document.querySelectorAll<HTMLButtonElement>(
            "[role=\"menuitem\"]:not([disabled])",
        );
        // O elemento <button> reage a Enter via click nativo do navegador.
        // Em jsdom, simulamos o click direto após focar.
        act(() => {
            items[0].focus();
            items[0].click();
        });
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe("Dropdown — estado controlado vs interno", () => {
    it("estado controlado (open=true) prevalece sobre clicks no trigger", () => {
        const onOpenChange = vi.fn();
        render(makeBasicDropdown({ open: true, onOpenChange }));

        // dropdown está aberto pelo controlled prop
        expect(document.querySelector("[role=\"menu\"]")).not.toBeNull();

        // clicar no trigger emite onOpenChange(false), mas o estado externo permanece true
        clickTrigger();
        expect(onOpenChange).toHaveBeenCalledWith(false);
        // como NÃO atualizamos o prop "open", o dropdown continua aberto
        expect(document.querySelector("[role=\"menu\"]")).not.toBeNull();
    });

    it("estado interno (defaultOpen) alterna conforme cliques no trigger", () => {
        render(makeBasicDropdown({ defaultOpen: false }));
        expect(document.querySelector("[role=\"menu\"]")).toBeNull();

        clickTrigger();
        expect(document.querySelector("[role=\"menu\"]")).not.toBeNull();

        clickTrigger();
        expect(document.querySelector("[role=\"menu\"]")).toBeNull();
    });
});

describe("Dropdown — alinhamento", () => {
    it("align=\"start\" aplica left-0", () => {
        render(
            createElement(
                Dropdown,
                { defaultOpen: true },
                createElement(DropdownTrigger, null, "Open"),
                createElement(
                    DropdownContent,
                    { align: "start" as const },
                    createElement(DropdownItem, null, "X"),
                ),
            ),
        );
        const menu = document.querySelector<HTMLElement>("[role=\"menu\"]")!;
        expect(menu.className).toContain("left-0");
    });

    it("align=\"end\" aplica right-0", () => {
        render(
            createElement(
                Dropdown,
                { defaultOpen: true },
                createElement(DropdownTrigger, null, "Open"),
                createElement(
                    DropdownContent,
                    { align: "end" as const },
                    createElement(DropdownItem, null, "X"),
                ),
            ),
        );
        const menu = document.querySelector<HTMLElement>("[role=\"menu\"]")!;
        expect(menu.className).toContain("right-0");
    });
});
