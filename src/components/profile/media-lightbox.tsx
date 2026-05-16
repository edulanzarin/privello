"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

export interface MediaLightboxProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    /** Classe extra encaminhada ao Modal (após `touch-none`). */
    className?: string;
    /** Se true, não fecha ao clicar no backdrop. */
    persistent?: boolean;
}

/**
 * Wrapper sobre `<Modal>` que aplica `position` responsivo:
 * - mobile (≤ 640px): `fullscreen`
 * - desktop (> 640px): `center`
 *
 * Aplica `touch-action: none` no overlay raiz (Tailwind `touch-none`) para
 * impedir pinch-to-zoom acidental do navegador no overlay (gesto declarado
 * em `mockups-diff.md > §Gestos`).
 *
 * Reutiliza Modal+focus trap+scroll lock entregues por fase-4 — sem duplicação.
 *
 * Cf. `.kiro/specs/fase-6-mobile-cross-browser/design.md > Components and Interfaces > 7`.
 */
export function MediaLightbox({
    open,
    onClose,
    children,
    className,
    persistent,
}: MediaLightboxProps) {
    // Decisão de breakpoint coordenada com `<MediaLightbox>` Wave 9 e
    // demais consumidores `bottom_sheet_em_mobile` da Wave 6.
    const isMobile = useMediaQuery("(max-width: 640px)");
    return (
        <Modal
            open={open}
            onClose={onClose}
            position={isMobile ? "fullscreen" : "center"}
            persistent={persistent}
            className={cn("touch-none", className)}
        >
            {children}
        </Modal>
    );
}
