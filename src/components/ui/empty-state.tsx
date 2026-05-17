import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitivo `EmptyState` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/empty-state.tsx
 * Steering: `.kiro/steering/design-system.md` §6.1 (uso) + §3 (cores).
 *
 * Fallback visual para listas vazias e datasets ausentes. Variante única:
 * card glass-panel com título centralizado, ícone opcional acima e CTA opcional.
 *
 * Quando usar:
 *  - Lista de perfis vazia em /descobrir após filtros.
 *  - ChartCard sem dados no período (admin-charts).
 *  - Inbox de suporte sem tickets.
 */

export interface EmptyStateAction {
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: EmptyStateAction;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon,
    action,
    className,
}: EmptyStateProps) {
    const renderAction = () => {
        if (!action) return null;
        // CTA primário (rose) — mesma linguagem do Button primary.
        const baseClasses =
            "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-rose px-5 py-2.5 text-md font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-150 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
        if (action.href) {
            return (
                <Link
                    href={action.href}
                    onClick={action.onClick}
                    className={baseClasses}
                >
                    {action.label}
                </Link>
            );
        }
        if (action.onClick) {
            return (
                <button
                    type="button"
                    onClick={action.onClick}
                    className={baseClasses}
                >
                    {action.label}
                </button>
            );
        }
        return null;
    };

    return (
        <div
            className={cn(
                "glass-panel rounded-2xl px-6 py-14 text-center",
                className,
            )}
        >
            {icon ? (
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center text-ink-dim">
                    {icon}
                </div>
            ) : null}
            <h3 className="text-xl font-semibold text-ink">{title}</h3>
            {description ? (
                <p className="mx-auto mt-2 max-w-md text-md text-ink-dim">
                    {description}
                </p>
            ) : null}
            {action ? <div className="mt-5">{renderAction()}</div> : null}
        </div>
    );
}
