import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * Primitivo `Badge` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/badge.tsx
 * Steering: `.kiro/steering/design-system.md` §6.3.
 *
 * Variantes (status do domínio):
 *  - `rose` / `coral`: marca, ação, "DESTAQUE". `coral` é alias legado de `rose`.
 *  - `success`: verificado, online, aprovado.
 *  - `warning`: em revisão, pending.
 *  - `muted`: rejeitado, fechado, neutro.
 *  - `info`: novo, OPEN, "ESSENCIAL".
 *  - `danger`: banido, suspenso, erro.
 *  - `premium`: plano Premium (plum sobre plum-soft).
 *  - `boost`: boost ativo (peach sobre peach-soft).
 *  - `verified`: selo de verificação champagne (cream/dourado sutil).
 *  - `dark`: ink sobre branco — usado raramente, ex.: contadores de notificação.
 *  - `default`: hairline neutra `bg-line/40 text-ink`.
 *
 * Sempre derive a variante via `statusToBadgeVariant` quando vier de status
 * do domínio (Prisma enum, string legada). Veja `src/lib/ui/status.ts`.
 */

type BadgeVariant =
    | "default"
    | "rose"
    /** alias legado de `rose` — preservado para compat com call-sites pré-v2. */
    | "coral"
    | "success"
    | "warning"
    | "muted"
    | "dark"
    | "info"
    | "danger"
    | "premium"
    | "boost"
    | "verified";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-line/40 text-ink",
    rose: "bg-rose-soft text-rose",
    // Alias legado: idêntico a `rose`.
    coral: "bg-rose-soft text-rose",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    muted: "bg-line/40 text-ink-dim",
    dark: "bg-ink text-white",
    info: "bg-info-soft text-info",
    danger: "bg-danger-soft text-danger",
    premium: "bg-plum-soft text-plum",
    boost: "bg-peach-soft text-peach",
    // Selo de verificação champagne — borda cream + texto plum p/ contraste.
    verified: "bg-cream/40 text-plum border border-cream/60",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-semibold",
                variantStyles[variant],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
