"use client";

import { cn } from "@/lib/utils";

/**
 * Primitivo `Switch` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/switch.tsx
 * Steering: `.kiro/steering/design-system.md` §6.
 *
 * Toggle de estado on/off. Substitui implementações duplicadas no projeto.
 *
 * - `checked=true`: track `bg-rose` (acento da marca, não success — switch
 *   não é status semântico, é controle de marca/preferência).
 * - `checked=false`: track `bg-line/80` (hairline neutra com leve alpha).
 * - Thumb branco com `shadow-sm`, transição smooth tahoe.
 */
type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md";
    label?: string;
    className?: string;
};

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
                "flex shrink-0 items-center rounded-full transition-colors duration-200 ease-[var(--ease-tahoe)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                s.track,
                checked ? "bg-rose" : "bg-line/80",
                disabled && "cursor-not-allowed opacity-50",
                className,
            )}
        >
            <span
                className={cn(
                    "ml-[2px] rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform duration-200 ease-[var(--ease-tahoe)]",
                    s.thumb,
                    checked && s.translate,
                )}
            />
        </button>
    );
}
