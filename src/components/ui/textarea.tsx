"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Primitivo `Textarea` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/textarea.tsx
 * Steering: `.kiro/steering/design-system.md` §3 + §5.3.
 *
 * Mesma linguagem do `Input` (glass + hairline + rounded-xl + ring rose),
 * com `resize-none` por padrão. Use override de className para liberar resize
 * vertical caso necessário.
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    hint?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, hint, error, className, id, ...props }, ref) => {
        const textareaId = id || props.name || undefined;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={textareaId} className="block text-base font-medium text-ink">
                        {label}
                    </label>
                )}
                {hint && <p className="text-sm text-ink-dim">{hint}</p>}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        "w-full rounded-xl border border-line bg-white/55 px-3 py-[9px] text-md text-ink",
                        "backdrop-blur-md backdrop-saturate-150",
                        "transition-all duration-150 ease-[var(--ease-tahoe)] resize-none",
                        "placeholder:text-ink-dim/55",
                        "hover:border-ink/15 hover:bg-white/65",
                        "focus:outline-none focus:bg-white/75 focus:border-rose/50",
                        "focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "disabled:bg-line/30 disabled:text-ink-dim disabled:cursor-not-allowed",
                        error && "border-danger/50 focus:border-danger focus-visible:ring-danger/40",
                        className,
                    )}
                    {...props}
                />
                {error && <p className="text-sm text-danger">{error}</p>}
            </div>
        );
    },
);

Textarea.displayName = "Textarea";
