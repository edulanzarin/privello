"use client";

import { useSyncExternalStore } from "react";

/**
 * Hook utilitário para reagir a media queries.
 *
 * Implementação SSR-safe via `useSyncExternalStore`:
 * - server snapshot retorna `false` (default desktop) — evita hydration mismatch
 *   em mobile, pois o cliente re-lê o valor real e re-renderiza após hydration.
 * - subscribe ouve `change` em `window.matchMedia(query)`.
 *
 * Uso típico (Wave Bottom-sheet desta fase):
 *   const isMobile = useMediaQuery("(max-width: 640px)");
 *   <Modal position={isMobile ? "bottom" : "center"}>...</Modal>
 *
 * Spec: `.kiro/specs/fase-6-mobile-cross-browser/design.md > Components and Interfaces > 4`.
 */
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (callback) => {
            if (typeof window === "undefined") return () => { };
            const mql = window.matchMedia(query);
            mql.addEventListener("change", callback);
            return () => mql.removeEventListener("change", callback);
        },
        () => {
            if (typeof window === "undefined") return false;
            return window.matchMedia(query).matches;
        },
        () => false,
    );
}
