import { cn } from "@/lib/utils";
import { formatBrl } from "@/lib/money";

/**
 * PriceTag — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/price-tag.tsx
 * Steering: `.kiro/steering/design-system.md` §4 (typography).
 *
 * Exibição padronizada de preço (R$ X / período). Substitui markup inline
 * de `text-rose font-bold tabular-nums` que se repetia em ProfileCard,
 * ProfileListRow, /p/[slug] hero, /p/[slug] tabela de valores, etc.
 *
 * Variants:
 *  - `hero`: 4xl bold rose, com label "/ {period}" em md ink-dim. Para o
 *     hero do perfil público.
 *  - `card`: xl bold rose, label "/ hora" em sm ink-dim. Para ProfileCard.
 *  - `inline`: md bold rose, label compacto "/h". Para ProfileListRow e
 *     listagens densas.
 *  - `compact`: sm bold rose com "/h". Para badges e chips.
 *
 * Props:
 *  - `value`: número em reais (BRL cents fica por conta do callee — recebemos número).
 *  - `period?`: "hora" (default), "2h", "diária", "mês", etc.
 *  - `periodFormat?`: "long" → "/ hora" (default), "short" → "/h".
 *  - `variant?`: ver acima (default `card`).
 *  - `className?`: classes extras no wrapper.
 *  - `tone?`: `"rose"` (default) | `"ink"` | `"white"`.
 *     `"rose"` para destaque primário, `"ink"` para preço secundário em
 *     fundo claro, `"white"` quando o card de fundo é escuro/colorido
 *     (Plus em ink, Premium em rose). O label do período ajusta o
 *     contraste automaticamente.
 */

type PriceTagVariant = "hero" | "card" | "inline" | "compact";
type PriceTagTone = "rose" | "ink" | "white";

const variantStyles: Record<PriceTagVariant, { value: string; period: string; gap: string }> = {
    hero: {
        value: "text-4xl font-bold tracking-[-0.02em]",
        period: "text-md",
        gap: "gap-3",
    },
    card: {
        value: "text-xl font-bold",
        period: "text-sm",
        gap: "gap-1.5",
    },
    inline: {
        value: "text-md font-bold",
        period: "text-xs",
        gap: "gap-0.5",
    },
    compact: {
        value: "text-sm font-bold",
        period: "text-xs",
        gap: "gap-0.5",
    },
};

const toneValueStyles: Record<PriceTagTone, string> = {
    rose: "text-rose",
    ink: "text-ink",
    white: "text-white",
};

const tonePeriodStyles: Record<PriceTagTone, string> = {
    rose: "text-ink-dim",
    ink: "text-ink-dim",
    white: "text-white/70",
};

export function PriceTag({
    value,
    period = "hora",
    periodFormat = "long",
    variant = "card",
    tone = "rose",
    className,
}: {
    value: number;
    period?: string;
    periodFormat?: "long" | "short";
    variant?: PriceTagVariant;
    tone?: PriceTagTone;
    className?: string;
}) {
    const styles = variantStyles[variant];
    const periodLabel = periodFormat === "short" ? `/${period[0]}` : `/ ${period}`;

    return (
        <span className={cn("inline-flex items-baseline", styles.gap, className)}>
            <span className={cn(styles.value, "tabular-nums", toneValueStyles[tone])}>
                {formatBrl(value)}
            </span>
            <span className={cn(styles.period, tonePeriodStyles[tone])}>{periodLabel}</span>
        </span>
    );
}
