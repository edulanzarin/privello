import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass" | "solid" | "dark";
    padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
    default: "glass-card rounded-2xl",
    glass: "glass-card rounded-2xl",
    solid: "bg-white rounded-2xl border border-black/[0.06] shadow-[0_0.5px_1px_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04)]",
    dark: "bg-sidebar text-white rounded-2xl shadow-lg",
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
                "transition-all duration-200",
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
        <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-base text-muted", className)} {...props}>
            {children}
        </p>
    );
}
