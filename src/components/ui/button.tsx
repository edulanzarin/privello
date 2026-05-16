"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "coral";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        "bg-blue text-white shadow-sm hover:brightness-110 active:brightness-95 active:scale-[0.98]",
    secondary:
        "bg-white border border-black/10 text-foreground shadow-sm hover:bg-black/[0.03] active:bg-black/[0.06] active:scale-[0.98]",
    ghost:
        "text-muted hover:text-foreground hover:bg-black/[0.04] active:bg-black/[0.06]",
    danger:
        "bg-danger text-white shadow-sm hover:brightness-110 active:brightness-95 active:scale-[0.98]",
    coral:
        "bg-coral text-white shadow-sm hover:brightness-110 active:brightness-95 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-[5px] text-sm gap-1.5 rounded-md",
    md: "px-4 py-[7px] text-base gap-2 rounded-lg",
    lg: "px-6 py-[9px] text-md gap-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all duration-150",
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
