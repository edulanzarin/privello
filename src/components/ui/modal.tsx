"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { useEscapeKey } from "@/lib/hooks/use-escape-key";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    /** Classe extra no container do conteúdo */
    className?: string;
    /** Se true, não fecha ao clicar no backdrop */
    persistent?: boolean;
    /** Posição do conteúdo */
    position?: "center" | "bottom" | "fullscreen";
};

/**
 * Modal genérico com backdrop, Escape key, scroll lock e focus trap integrado.
 * Substitui as 3+ implementações duplicadas (lightbox, story viewer, comments panel).
 *
 * API pública preservada: `open`, `onClose`, `children`, `className`, `persistent`, `position`.
 * Focus trap ativo automaticamente enquanto `open === true`.
 */
export function Modal({
    open,
    onClose,
    children,
    className,
    persistent = false,
    position = "center",
}: ModalProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useScrollLock(open);
    useEscapeKey(onClose, open);
    useFocusTrap(contentRef, open);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (persistent) return;
            if (e.target === e.currentTarget) onClose();
        },
        [onClose, persistent],
    );

    if (!open) return null;

    const positionClasses = {
        center: "items-center justify-center",
        bottom: "items-end justify-center",
        fullscreen: "items-stretch justify-stretch",
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            className={cn(
                "fixed inset-0 z-50 flex",
                positionClasses[position],
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Content */}
            <div ref={contentRef} className={cn("relative z-10", className)}>
                {children}
            </div>
        </div>
    );
}
