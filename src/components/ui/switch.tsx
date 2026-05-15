"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md";
    label?: string;
    className?: string;
};

/**
 * Toggle switch unificado — estilo macOS.
 * Substitui as 4 implementações duplicadas no projeto.
 */
export function Switch({
    checked,
    onChange,
    disabled = false,
    size = "md",
    label,
    className,
}: SwitchProps) {
    const sizes = {
        sm: { track: "h-[18px] w-[32px]", thumb: "h-[14px] w-[14px]", translate: "translate-x-[14px]" },
        md: { track: "h-[22px] w-[40px]", thumb: "h-[18px] w-[18px]", translate: "translate-x-[18px]" },
    };

    const s = sizes[size];

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "flex shrink-0 items-center rounded-full transition-colors duration-200",
                s.track,
                checked ? "bg-[#30d158]" : "bg-black/[0.09]",
                disabled && "cursor-not-allowed opacity-50",
                className,
            )}
        >
            <span
                className={cn(
                    "ml-[2px] rounded-full bg-white shadow-sm transition-transform duration-200",
                    s.thumb,
                    checked && s.translate,
                )}
            />
        </button>
    );
}
