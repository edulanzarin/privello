"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Primitivo `Select` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/select.tsx
 * Steering: `.kiro/steering/design-system.md` §3 + §5.3.
 *
 * Mesma linguagem do `Input` (glass-panel + hairline + rounded-xl + ring rose).
 * Chevron Lucide à direita, em `text-ink-dim`.
 *
 * Props:
 *  - `options`: `{ value, label }[]` — opções renderizadas como `<option>`.
 *  - `placeholder`: vira primeira `<option disabled value="">`.
 *  - `label`/`hint`/`error`: mesmo contrato do `Input`.
 */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    hint?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, hint, error, options, placeholder, className, id, ...props }, ref) => {
        const selectId = id || props.name || undefined;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={selectId} className="block text-base font-medium text-ink">
                        {label}
                    </label>
                )}
                {hint && <p className="text-sm text-ink-dim">{hint}</p>}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            "w-full appearance-none rounded-xl border border-line bg-white px-3 py-[9px] pr-9 text-md text-ink",
                            "transition-all duration-150 ease-[var(--ease-tahoe)] cursor-pointer",
                            "hover:border-ink/15",
                            "focus:outline-none focus:border-rose/50",
                            "focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            "disabled:bg-line/30 disabled:text-ink-dim disabled:cursor-not-allowed",
                            error && "border-danger/50 focus:border-danger focus-visible:ring-danger/40",
                            className,
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-dim"
                        strokeWidth={2}
                    />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
            </div>
        );
    },
);

Select.displayName = "Select";
