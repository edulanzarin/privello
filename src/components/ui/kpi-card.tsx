/**
 * KPICard — tile de dashboard padronizado
 *
 * Caminho: src/components/ui/kpi-card.tsx
 *
 * Substitui as reimplementações inline de "label + value + sub" com
 * `rounded border bg-white shadow-sm` espalhadas em `/admin/moderacao`,
 * `/admin/financeiro` e similares. Compõe `Card variant="solid"` com slots
 * para ícone, subtítulo, indicador de delta, estado de alerta e CTA via
 * `href` (envelopa o tile em `<Link>` do Next.js).
 *
 * Spec: .kiro/specs/redesign-macos-system/design.md > "KPICard (novo)" e
 * Requirement 6 em requirements.md.
 *
 * Estilo travado:
 * - Container: rounded-2xl, hairline, sombra suave (via `Card variant="solid"`).
 * - Label: `text-2xs font-semibold uppercase tracking-wider text-muted`.
 * - Valor: `text-2xl font-semibold tabular-nums tracking-tight`.
 * - `alert={true}` aplica `border-warning/40 bg-warning-soft` (override) e
 *   o ícone passa a `text-warning`. Caso contrário ícone fica em `text-muted`.
 * - `delta.direction`: `up` → success + TrendingUp; `down` → danger +
 *   TrendingDown; `flat` → muted + Minus.
 * - `href`: envelopa em `<Link>` com `aria-label` combinando label + value.
 *
 * Cross-refs:
 * - src/components/ui/card.tsx (composição base)
 * - src/components/ui/stat-card.tsx (versão antecessora, mais simples)
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
    flat: { icon: Minus, className: "text-muted" },
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
    const iconColor = alert ? "text-warning" : "text-muted";

    const tile = (
        <Card
            variant="solid"
            padding="md"
            className={cn(
                alert && "border-warning/40 bg-warning-soft",
                href && "transition-shadow hover:shadow-md",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted">
                    {label}
                </p>
                {Icon ? (
                    <Icon className={cn("h-4 w-4", iconColor)} strokeWidth={1.5} />
                ) : null}
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                {value}
            </p>
            {subtitle ? (
                <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
            ) : null}
            {delta ? <KPIDeltaIndicator delta={delta} /> : null}
        </Card>
    );

    if (href) {
        return (
            <Link
                href={href}
                aria-label={`${label}: ${value}`}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
