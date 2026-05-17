"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitivo `Input` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/input.tsx
 * Steering: `.kiro/steering/design-system.md` §3 (cores) + §5.3 (radius).
 *
 * Visual:
 *  - Fundo glass-panel translúcido (rgba branco 0.55 + blur).
 *  - Borda `border-line` (rgba(26,21,23,0.08)) — hairline.
 *  - Radius `rounded-xl` (12px).
 *  - Focus ring rose com offset.
 *  - Placeholder `text-ink-dim/55`.
 *  - Erro: borda + ring `danger`.
 *
 * Props:
 *  - `label` (string): renderiza `<label>` associado por id.
 *  - `hint` (string): copy auxiliar `text-sm text-ink-dim` antes do input.
 *  - `error` (string): borda danger + mensagem `text-sm text-danger` abaixo.
 *  - `prefix` (string): ex. "@", "R$" — exibido inline com padding-left ajustado.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    error?: string;
    prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, hint, error, prefix, className, id, ...props }, ref) => {
        const inputId = id || props.name || undefined;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-base font-medium text-ink">
                        {label}
                    </label>
                )}
                {hint && <p className="text-sm text-ink-dim">{hint}</p>}
                <div className="relative">
                    {prefix && (
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-ink-dim">
                            {prefix}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full rounded-xl border border-line bg-white px-3 py-[9px] text-md text-ink",
                            "transition-all duration-150 ease-[var(--ease-tahoe)]",
                            "placeholder:text-ink-dim/55",
                            "hover:border-ink/15",
                            "focus:outline-none focus:border-rose/50",
                            "focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            "disabled:bg-line/30 disabled:text-ink-dim disabled:cursor-not-allowed",
                            prefix && "pl-7",
                            error && "border-danger/50 focus:border-danger focus-visible:ring-danger/40",
                            className,
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
            </div>
        );
    },
);

Input.displayName = "Input";
