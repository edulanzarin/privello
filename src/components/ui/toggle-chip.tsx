"use client";

import { cn } from "@/lib/utils";

/**
 * Primitivo `ToggleChip` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/toggle-chip.tsx
 * Steering: `.kiro/steering/design-system.md` §5.3 + §13.3 (FilterChip).
 *
 * Chip toggleável (on/off) — usado em filtros multi-valor (tags, idiomas,
 * preferências de cadastro). Para sub-navegação com URL, prefira `Tabs`.
 *
 * Estados:
 *  - `active=true`: `bg-ink text-white shadow-sm` (preenchido ink ameixa).
 *  - `active=false`: glass-pill outline.
 */
export interface ToggleChipProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}

export function ToggleChip({ active, onClick, children, className }: ToggleChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex min-h-[44px] items-center rounded-full px-3.5 py-[6px] text-base font-medium",
                "transition-all duration-150 ease-[var(--ease-tahoe)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                    ? "bg-ink text-white shadow-[var(--shadow-sm)] active:scale-[0.97]"
                    : "glass-pill text-ink hover:bg-white/70 active:scale-[0.97]",
                className,
            )}
        >
            {children}
        </button>
    );
}
