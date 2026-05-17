"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type FilterChipProps = {
    href?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    active?: boolean;
    children: React.ReactNode;
    icon?: React.ReactNode;
    /** Marca o chip como removível (mostra × no fim). Usado em active filter pills. */
    removable?: boolean;
    className?: string;
};

/**
 * FilterChip — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/discover/filter-chip.tsx
 * Steering: `.kiro/steering/design-system.md` §13.3.
 *
 * Pílula glass clicável usada no header sticky de Descobrir.
 *
 * Variantes:
 *  - `inactive`: glass-pill borda hairline, hover bg-white/70.
 *  - `active`: bg-rose-soft border-rose/30 text-rose com ring.
 *  - `removable`: bg-line/40 com × no fim (active filter pill).
 *
 * Pode ser link (`href`) ou botão (`onClick`). Mutuamente exclusivos.
 */
export function FilterChip({
    href,
    onClick,
    active,
    children,
    icon,
    removable,
    className,
}: FilterChipProps) {
    const baseClasses = cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5",
        "text-sm font-medium",
        "border transition-all duration-150 ease-[var(--ease-tahoe)]",
        "backdrop-blur-md backdrop-saturate-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.97]",
        active
            ? "bg-rose-soft border-rose/30 text-rose hover:bg-rose-soft/80"
            : removable
                ? "bg-line/40 border-line text-ink hover:bg-line/60"
                : "bg-white/55 border-line text-ink-dim hover:bg-white/75 hover:text-ink hover:border-ink/15",
        className,
    );

    const inner = (
        <>
            {icon}
            <span>{children}</span>
            {removable && (
                <span className="text-rose font-semibold leading-none" aria-hidden>
                    ×
                </span>
            )}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={baseClasses}>
                {inner}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className={baseClasses}>
            {inner}
        </button>
    );
}
