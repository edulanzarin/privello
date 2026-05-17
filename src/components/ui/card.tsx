import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * Primitivo `Card` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/card.tsx
 * Steering: `.kiro/steering/design-system.md` §3.6 (glass) + §5.3 (radius).
 *
 * Variantes:
 *  - `glass` (default v2): `.glass-panel` translúcido sobre ambient gradient.
 *    Usar quando o card flutua sobre o fundo da página.
 *  - `solid`: off-white opaco (`bg-surface`) — para áreas que precisam de
 *    contraste forte (modais full-screen, dashboards densos onde o glass
 *    saturaria).
 *  - `dark`: ink (preto ameixa) com texto branco — banners de promo,
 *    sidebar legacy. Uso pontual.
 *  - `success-subtle` / `warning-subtle` / `danger-subtle`: bg soft +
 *    border `state/30` — banners de feedback discretos.
 *  - `default`: alias de `glass` (compat com call-sites pré-v2).
 *
 * Padding: `none` | `sm` (p-4) | `md` (p-5, default) | `lg` (p-6).
 * Radius: `rounded-2xl` (16px) — Tahoe moderado (calibrado v2.1, era 3xl).
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?:
    | "default"
    | "glass"
    | "solid"
    | "dark"
    | "success-subtle"
    | "warning-subtle"
    | "danger-subtle";
    padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
    default: "glass-panel rounded-2xl",
    glass: "glass-panel rounded-2xl",
    solid: "bg-surface rounded-2xl border border-line shadow-[var(--shadow-sm)]",
    dark: "bg-ink text-white rounded-2xl shadow-[var(--shadow-md)]",
    "success-subtle":
        "bg-success-soft rounded-2xl border border-success/30 shadow-[var(--shadow-hairline)]",
    "warning-subtle":
        "bg-warning-soft rounded-2xl border border-warning/30 shadow-[var(--shadow-hairline)]",
    "danger-subtle":
        "bg-danger-soft rounded-2xl border border-danger/30 shadow-[var(--shadow-hairline)]",
};

const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
};

export function Card({ variant = "default", padding = "md", className, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "transition-all duration-200 ease-[var(--ease-tahoe)]",
                variantStyles[variant],
                paddingStyles[padding],
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("mb-3", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("text-lg font-semibold tracking-tight text-ink", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-base text-ink-dim", className)} {...props}>
            {children}
        </p>
    );
}
