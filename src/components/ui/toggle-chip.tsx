"use client";

import { cn } from "@/lib/utils";

export interface ToggleChipProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}

export function ToggleChip({ active, onClick, children, className }: ToggleChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-full px-3.5 py-[6px] text-base font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                    ? "bg-coral text-white shadow-sm active:scale-[0.97]"
                    : "bg-white border border-black/10 text-foreground shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] hover:bg-black/[0.03] active:bg-black/[0.06]",
                className,
            )}
        >
            {children}
        </button>
    );
}
