"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

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
                    <label htmlFor={inputId} className="block text-[13px] font-medium text-foreground">
                        {label}
                    </label>
                )}
                {hint && <p className="text-[12px] text-muted">{hint}</p>}
                <div className="relative">
                    {prefix && (
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[13px] text-muted">
                            {prefix}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full rounded-lg border border-black/10 bg-white px-3 py-[7px] text-[14px] text-foreground",
                            "shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)]",
                            "transition-all duration-150",
                            "placeholder:text-muted/60",
                            "hover:border-black/20",
                            "focus:border-[#0a84ff] focus:outline-none focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]",
                            "disabled:bg-black/[0.03] disabled:text-muted disabled:cursor-not-allowed",
                            prefix && "pl-7",
                            error && "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(255,59,48,0.2)]",
                            className,
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="text-[12px] text-[#ff3b30]">{error}</p>}
            </div>
        );
    },
);

Input.displayName = "Input";
