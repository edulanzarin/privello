import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "coral" | "success" | "warning" | "muted" | "dark";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-black/[0.06] text-foreground",
    coral: "bg-coral/10 text-coral",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    muted: "bg-black/[0.04] text-muted",
    dark: "bg-foreground text-white",
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
