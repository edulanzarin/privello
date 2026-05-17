"use client";

import { useEffect } from "react";

/**
 * Trava o scroll do body quando ativo e sinaliza presença de modal via
 * `data-modal-open` no `<body>`.
 *
 * Usado por modais, lightboxes, story viewers.
 *
 * Side effects:
 *  - `document.body.style.overflow = "hidden"` enquanto travado.
 *  - `document.body.dataset.modalOpen = "true"` enquanto travado.
 *
 * Consumidores que reagem ao `data-modal-open`:
 *  - `BottomNav` (`src/components/layout/bottom-nav.tsx`) — esconde a pill
 *    flutuante para não ficar sobre o modal fullscreen (story viewer,
 *    lightbox de mídia, etc.).
 *
 * Nota: usamos contador de instâncias para suportar modais aninhados —
 * só removemos a flag quando a última instância desmontar.
 */
let lockCount = 0;

export function useScrollLock(locked: boolean) {
    useEffect(() => {
        if (!locked) return;

        const body = document.body;
        const originalOverflow = body.style.overflow;

        if (lockCount === 0) {
            body.style.overflow = "hidden";
            body.dataset.modalOpen = "true";
        }
        lockCount += 1;

        return () => {
            lockCount -= 1;
            if (lockCount === 0) {
                body.style.overflow = originalOverflow;
                delete body.dataset.modalOpen;
            }
        };
    }, [locked]);
}
