"use client";

import Link from "next/link";
import {
    forwardRef,
    type AnchorHTMLAttributes,
    type ButtonHTMLAttributes,
    type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Primitivo `Button` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/button.tsx
 * Steering: `.kiro/steering/design-system.md` §6.3 + §13.
 *
 * Variantes:
 *  - `primary`: rose (ação principal). Substitui o azul da v1.
 *  - `secondary`: glass-pill outline (vidro com borda hairline).
 *  - `ghost`: transparente, hover aplica fundo `bg-line/40`.
 *  - `danger`: vermelho semântico.
 *  - `whatsapp`: verde WhatsApp (CTA exclusiva).
 *  - `outline`: white card com border-line — mesmo padrão do `<ShareButton>`.
 *  - `coral`: alias legado de `primary` — preservado para compat.
 *
 * Tamanhos:
 *  - `sm` (text-sm, rounded-lg, px-3 py-[5px], min 44×44)
 *  - `md` (text-base, rounded-xl, px-4 py-[7px], min 44×44) — default
 *  - `lg` (text-md, rounded-xl, px-6 py-[10px], min 44×44)
 *
 * Touch target ≥ 44×44 garantido pelas classes base
 * `min-h-[44px] min-w-[44px]` (Req 12.1, WCAG 2.5.5).
 *
 * Focus ring canônico: `ring-rose/40` com offset.
 *
 * **Polimorfismo (v2.7, 2026-05-17)**:
 *  - Sem `href`: renderiza `<button>` (todos os ButtonHTMLAttributes válidos).
 *  - Com `href`: renderiza `<Link>` do `next/link` (todos os AnchorHTMLAttributes
 *    relevantes válidos). Útil pra CTAs que navegam (ex.: "Marcar horário" →
 *    `/solicitar/[slug]`). Substitui o padrão antigo de `<Link className="...">`
 *    com classes copiadas do Button — agora um caminho único.
 */

type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "danger"
    | "whatsapp"
    | "outline"
    /** alias legado de `primary` (rose). Mantido para call-sites pré-v2. */
    | "coral";

type ButtonSize = "sm" | "md" | "lg";

interface BaseButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    className?: string;
    children?: ReactNode;
}

type ButtonAsButton = BaseButtonProps &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
        href?: undefined;
    };

type ButtonAsLink = BaseButtonProps &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
        href: string;
        target?: string;
        rel?: string;
    };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
    // Rose primário — usa o token. Hover sutil via brilho, active scale.
    primary:
        "bg-rose text-white shadow-[var(--shadow-sm)] hover:brightness-105 active:brightness-95 active:scale-[0.98]",
    // Glass outline — fundo translúcido, borda hairline. Texto ink.
    secondary:
        "glass-pill text-ink hover:bg-white/70 active:scale-[0.98]",
    // Ghost — sem fundo, hover aplica leve glass cushion.
    ghost:
        "text-ink-dim hover:text-ink hover:bg-line/40 active:bg-line/60",
    // Danger — vermelho semântico, mesmo padrão do primary.
    danger:
        "bg-danger text-white shadow-[var(--shadow-sm)] hover:brightness-105 active:brightness-95 active:scale-[0.98]",
    // WhatsApp — verde da marca, CTA exclusiva (botão "Conversar no WhatsApp").
    whatsapp:
        "bg-whatsapp text-white shadow-[var(--shadow-sm)] hover:brightness-105 active:brightness-95 active:scale-[0.98]",
    // Outline — white card com border + sombra leve. Hover aplica bg-line/30.
    outline:
        "border border-line bg-white text-ink shadow-[var(--shadow-sm)] hover:bg-line/30 active:scale-[0.97]",
    // Alias legado: idêntico a `primary`. Não use em código novo.
    coral:
        "bg-rose text-white shadow-[var(--shadow-sm)] hover:brightness-105 active:brightness-95 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-[5px] text-sm gap-1.5 rounded-lg",
    md: "px-4 py-[7px] text-base gap-2 rounded-xl",
    lg: "px-6 py-[10px] text-md gap-2 rounded-xl",
};

const baseClasses = cn(
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-medium",
    "transition-all duration-150 ease-[var(--ease-tahoe)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
);

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
    function Button(props, ref) {
        const {
            variant = "primary",
            size = "md",
            loading,
            className,
            children,
            ...rest
        } = props;

        const composedClass = cn(
            baseClasses,
            variantStyles[variant],
            sizeStyles[size],
            className,
        );

        const content = (
            <>
                {loading && (
                    <svg
                        className="h-3.5 w-3.5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                )}
                {children}
            </>
        );

        if (typeof rest.href === "string") {
            const { href, target, rel, ...anchorRest } =
                rest as Omit<ButtonAsLink, keyof BaseButtonProps>;
            return (
                <Link
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    href={href}
                    target={target}
                    rel={rel}
                    className={composedClass}
                    {...anchorRest}
                >
                    {content}
                </Link>
            );
        }

        const { disabled, type, ...buttonRest } =
            rest as Omit<ButtonAsButton, keyof BaseButtonProps>;
        return (
            <button
                ref={ref as React.Ref<HTMLButtonElement>}
                type={type ?? "button"}
                disabled={disabled || loading}
                className={composedClass}
                {...buttonRest}
            >
                {content}
            </button>
        );
    },
);
