"use client";

import { useEffect } from "react";

/**
 * Executa callback ao pressionar Escape.
 * Usado por modais, lightboxes, overlays.
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.preventDefault();
                onEscape();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onEscape, enabled]);
}
