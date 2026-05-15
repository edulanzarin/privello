"use client";

import { useEffect } from "react";

/**
 * Trava o scroll do body quando ativo.
 * Usado por modais, lightboxes, story viewers.
 */
export function useScrollLock(locked: boolean) {
    useEffect(() => {
        if (!locked) return;

        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = original;
        };
    }, [locked]);
}
