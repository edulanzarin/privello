"use client";

import { useEffect, type RefObject } from "react";

type UseFocusTrapOptions = {
    /**
     * Ao ativar:
     * - "first" (default): foca o primeiro elemento focável dentro do container
     * - "data-autofocus": foca o elemento marcado com `data-autofocus` (cai em "first" se ausente)
     * - false: não move foco automaticamente ao ativar
     */
    autoFocus?: "first" | "data-autofocus" | false;
};

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    "[tabindex]",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const candidates = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    return candidates.filter((el) => {
        if ((el as HTMLButtonElement | HTMLInputElement).disabled) return false;
        if (el.getAttribute("tabindex") === "-1") return false;
        if (el.getAttribute("aria-hidden") === "true") return false;
        return true;
    });
}

/**
 * Trapeia o foco dentro do container `ref` enquanto `active === true`.
 * Devolve foco ao elemento que tinha foco antes da ativação ao desativar.
 *
 * Decisão registrada em `design.md`: hook (não componente) — integra mais
 * limpo no `Modal` e no `Dropdown` sem alterar a árvore JSX.
 */
export function useFocusTrap(
    ref: RefObject<HTMLElement | null>,
    active: boolean,
    options: UseFocusTrapOptions = {},
): void {
    const { autoFocus = "first" } = options;

    useEffect(() => {
        if (!active) return;
        const container = ref.current;
        if (!container) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;

        if (autoFocus !== false) {
            let target: HTMLElement | null = null;
            if (autoFocus === "data-autofocus") {
                target = container.querySelector<HTMLElement>("[data-autofocus]");
            }
            if (!target) {
                const focusables = getFocusableElements(container);
                target = focusables[0] ?? null;
            }
            target?.focus();
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== "Tab") return;
            if (!container) return;

            const focusables = getFocusableElements(container);
            if (focusables.length === 0) {
                e.preventDefault();
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const activeEl = document.activeElement as HTMLElement | null;

            // Foco fora do container: traz para o primeiro/último.
            if (!activeEl || !container.contains(activeEl)) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
                return;
            }

            if (e.shiftKey) {
                if (activeEl === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (activeEl === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            if (previouslyFocused && typeof previouslyFocused.focus === "function") {
                previouslyFocused.focus();
            }
        };
    }, [active, autoFocus, ref]);
}
