"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Primitivo `ErrorState` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/error-state.tsx
 * Steering: `.kiro/steering/design-system.md` §3.
 *
 * Renderizado por error boundaries (`error.tsx` em rotas) e por componentes
 * client que capturam falhas. Variantes:
 *  - `page`: tela inteira (`min-h-[60vh]`), `role="alert"`.
 *  - `inline`: bloco ≥ 20vh dentro de seção, `role="status"`.
 *
 * O CTA "Tentar novamente" usa Button-styled inline (rose). O secundário
 * "Voltar ao início" é glass outline.
 */
export interface ErrorStateProps {
    title: string;
    description?: string;
    onRetry: () => void;
    homeHref?: string;
    variant?: "inline" | "page";
    digest?: string;
    className?: string;
}

export function ErrorState({
    title,
    description,
    onRetry,
    homeHref,
    variant = "page",
    digest,
    className,
}: ErrorStateProps) {
    const isPage = variant === "page";
    return (
        <div
            role={isPage ? "alert" : "status"}
            aria-live={isPage ? "assertive" : "polite"}
            className={cn(
                "flex flex-col items-center justify-center gap-4 px-4 text-center",
                isPage ? "min-h-[60vh]" : "min-h-[20vh]",
                className,
            )}
        >
            <div>
                <p className="text-lg font-medium text-ink">{title}</p>
                {description ? (
                    <p className="mt-1 text-md text-ink-dim">{description}</p>
                ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-rose px-5 py-2.5 text-md font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-150 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                    Tentar novamente
                </button>
                {homeHref ? (
                    <Link
                        href={homeHref}
                        className="glass-pill inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-5 py-2.5 text-md font-medium text-ink transition-all duration-150 hover:bg-white/70 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        Voltar ao início
                    </Link>
                ) : null}
            </div>
            {isPage && digest ? (
                <p className="mt-2 text-2xs text-ink-faint">ref: {digest}</p>
            ) : null}
        </div>
    );
}
