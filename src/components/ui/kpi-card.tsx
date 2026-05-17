/**
 * Primitivo `KPICard` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/kpi-card.tsx
 * Steering: `.kiro/steering/design-system.md` §6.
 *
 * Tile de dashboard: label + value + subtitle + delta opcional + alert state.
 * Compõe `Card variant="solid"` por padrão (off-white opaco, hairline).
 * Quando `alert={true}`, troca pra `Card variant="warning-subtle"` (override
 * via classes adicionais — bg + border de warning).
 *
 * Estilo travado:
 *  - Container: `Card variant="solid" padding="md"` (rounded-2xl, hairline,
 *    sombra suave).
 *  - Label: `text-2xs font-semibold uppercase tracking-wider text-ink-dim`.
 *  - Valor: `text-2xl font-semibold tabular-nums tracking-tight text-ink`.
 *  - `alert={true}`: `border-warning/40 bg-warning-soft` + ícone `text-warning`.
 *  - `delta.direction`: `up` → success + TrendingUp; `down` → danger; `flat` → muted + Minus.
 *  - `href`: envelopa em `<Link>` com `aria-label`.
 */

import Link from "next/link";
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export type KPIDeltaDirection = "up" | "down" | "flat";

export interface KPIDelta {
    value: string;
    direction: KPIDeltaDirection;
}

export interface KPICardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    subtitle?: string;
    alert?: boolean;
    delta?: KPIDelta;
    href?: string;
    className?: string;
}

const deltaStyles: Record<KPIDeltaDirection, { icon: LucideIcon; className: string }> = {
    up: { icon: TrendingUp, className: "text-success" },
    down: { icon: TrendingDown, className: "text-danger" },
    flat: { icon: Minus, className: "text-ink-dim" },
};

export function KPICard({
    label,
    value,
    icon: Icon,
    subtitle,
    alert = false,
    delta,
    href,
    className,
}: KPICardProps) {
    const iconColor = alert ? "text-warning" : "text-ink-dim";

    const tile = (
        <Card
            variant="solid"
            padding="md"
            className={cn(
                alert && "border-warning/40 bg-warning-soft",
                href && "transition-shadow hover:shadow-[var(--shadow-md)]",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    {label}
                </p>
                {Icon ? (
                    <Icon className={cn("h-4 w-4", iconColor)} strokeWidth={1.5} />
                ) : null}
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink">
                {value}
            </p>
            {subtitle ? (
                <p className="mt-0.5 text-xs text-ink-dim">{subtitle}</p>
            ) : null}
            {delta ? <KPIDeltaIndicator delta={delta} /> : null}
        </Card>
    );

    if (href) {
        return (
            <Link
                href={href}
                aria-label={`${label}: ${value}`}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
                {tile}
            </Link>
        );
    }

    return tile;
}

function KPIDeltaIndicator({ delta }: { delta: KPIDelta }) {
    const { icon: DeltaIcon, className: deltaClassName } = deltaStyles[delta.direction];
    return (
        <div
            className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-medium tabular-nums",
                deltaClassName,
            )}
        >
            <DeltaIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>{delta.value}</span>
        </div>
    );
}
