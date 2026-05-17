"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
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
 *  - `coral`: alias legado de `primary` — preservado para compat com
 *    chamadas pré-v2 (login, cadastro, painel/financeiro etc.). Novas
 *    chamadas devem usar `primary`.
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
 */

type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "danger"
    | "whatsapp"
    /** alias legado de `primary` (rose). Mantido para call-sites pré-v2. */
    | "coral";

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
}

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
    // Alias legado: idêntico a `primary`. Não use em código novo.
    coral:
        "bg-rose text-white shadow-[var(--shadow-sm)] hover:brightness-105 active:brightness-95 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-[5px] text-sm gap-1.5 rounded-lg",
    md: "px-4 py-[7px] text-base gap-2 rounded-xl",
    lg: "px-6 py-[10px] text-md gap-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-medium",
                    "transition-all duration-150 ease-[var(--ease-tahoe)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "disabled:pointer-events-none disabled:opacity-40",
                    variantStyles[variant],
                    sizeStyles[size],
                    className,
                )}
                {...props}
            >
                {loading && (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {children}
            </button>
        );
    },
);

Button.displayName = "Button";
