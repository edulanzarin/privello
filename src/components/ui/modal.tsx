"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { useEscapeKey } from "@/lib/hooks/use-escape-key";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

/**
 * Primitivo `Modal` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/modal.tsx
 * Steering: `.kiro/steering/design-system.md` §3.6 (glass) + §13.
 *
 * Modal genérico com backdrop, Escape key, scroll lock e focus trap
 * integrado. Substitui implementações duplicadas (lightbox, story viewer,
 * comments panel, age-gate).
 *
 * Backdrop v2: `bg-ink/60 backdrop-blur-md` — overlay ink ameixa com blur
 * mais agressivo que cobre o ambient gradient sem deixar o gradient brilhar
 * por trás (anti-pattern em modal cheio).
 *
 * Posição:
 *  - `center` (default): centralizado vertical e horizontal.
 *  - `bottom`: ancorado no rodapé (BottomSheet em mobile).
 *  - `fullscreen`: ocupa toda a viewport (lightbox de mídia).
 */
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
            {/* Backdrop ink com blur generoso. */}
            <div
                className="absolute inset-0 bg-ink/60 backdrop-blur-md"
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
