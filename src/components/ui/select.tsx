"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
                    <label htmlFor={selectId} className="block text-base font-medium text-foreground">
                        {label}
                    </label>
                )}
                {hint && <p className="text-sm text-muted">{hint}</p>}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            "w-full appearance-none rounded-lg border border-black/10 bg-white px-3 py-[7px] pr-8 text-md text-foreground",
                            "shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)]",
                            "transition-all duration-150 cursor-pointer",
                            "hover:border-black/20",
                            "focus:border-blue focus:outline-none focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]",
                            "disabled:bg-black/[0.03] disabled:text-muted disabled:cursor-not-allowed",
                            error && "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(255,59,48,0.2)]",
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
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" strokeWidth={2} />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
            </div>
        );
    },
);

Select.displayName = "Select";
