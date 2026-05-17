"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

/**
 * Primitivo `Tabs` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/tabs.tsx
 * Steering: `.kiro/steering/design-system.md` §5.3 + §13.
 *
 * Modos:
 *  1. **URL nav** (default): cada `item.href` vira `<Link>`. Tab ativo
 *     recebe `aria-current="page"`. `onChange` ausente.
 *  2. **Controlado**: `onChange(key)` callback. Cada tab é `<button>`.
 *
 * Variantes:
 *  - `pills` (default): pílulas `rounded-full`. Ativo `bg-rose text-white`,
 *    inativo `text-ink-dim hover:bg-line/40 hover:text-ink`.
 *  - `underline`: linha 2px `bg-rose` sob o ativo, sem fundo.
 *
 * Acessibilidade (WAI-ARIA Tabs Pattern):
 *  - `role="tablist"` no container, `role="tab"` em cada item.
 *  - `aria-selected` true/false; `aria-current="page"` no link ativo.
 *  - Roving tabindex (ativo `0`, demais `-1`).
 *  - Setas ←/→, Home/End movem foco. Enter/Space ativa em modo controlado.
 *  - Touch target ≥ 44×44 (Req 12.2).
 *  - Focus ring `ring-rose/40`.
 */

export type TabItem = {
    key: string;
    label: string;
    href?: string;
    badge?: number;
};

export type TabsProps = {
    items: TabItem[];
    activeKey: string;
    variant?: "pills" | "underline";
    size?: "sm" | "md";
    onChange?: (key: string) => void;
    className?: string;
};

const sizeStyles: Record<NonNullable<TabsProps["size"]>, string> = {
    sm: "px-3 text-sm",
    md: "px-4 text-base",
};

export function Tabs({
    items,
    activeKey,
    variant = "pills",
    size = "md",
    onChange,
    className,
}: TabsProps) {
    const tabRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);

    function focusTabAt(index: number) {
        const len = items.length;
        if (len === 0) return;
        const safe = ((index % len) + len) % len;
        tabRefs.current[safe]?.focus();
    }

    function handleKeyDown(event: KeyboardEvent, index: number, key: string) {
        switch (event.key) {
            case "ArrowRight":
                event.preventDefault();
                focusTabAt(index + 1);
                break;
            case "ArrowLeft":
                event.preventDefault();
                focusTabAt(index - 1);
                break;
            case "Home":
                event.preventDefault();
                focusTabAt(0);
                break;
            case "End":
                event.preventDefault();
                focusTabAt(items.length - 1);
                break;
            case "Enter":
            case " ":
                if (onChange) {
                    event.preventDefault();
                    onChange(key);
                }
                break;
        }
    }

    return (
        <div
            role="tablist"
            className={cn(
                "flex flex-wrap",
                variant === "pills" && "gap-1",
                variant === "underline" && "gap-0 border-b border-line",
                className,
            )}
        >
            {items.map((item, index) => {
                const isActive = item.key === activeKey;
                const useLink = !!item.href && !onChange;

                const baseClasses = cn(
                    "relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 font-medium",
                    "transition-all duration-150 ease-[var(--ease-tahoe)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    sizeStyles[size],
                    // Variante pills
                    variant === "pills" && "rounded-full",
                    variant === "pills" && isActive && "bg-rose text-white shadow-[var(--shadow-sm)]",
                    variant === "pills" &&
                    !isActive &&
                    "text-ink-dim hover:bg-line/40 hover:text-ink",
                    // Variante underline
                    variant === "underline" && "border-b-2",
                    variant === "underline" && isActive && "border-rose text-ink",
                    variant === "underline" &&
                    !isActive &&
                    "border-transparent text-ink-dim hover:text-ink",
                );

                const content = (
                    <>
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                            <span
                                className={cn(
                                    "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums",
                                    isActive && variant === "pills"
                                        ? "bg-white/25 text-white"
                                        : "bg-line/50 text-ink-dim",
                                )}
                            >
                                {item.badge}
                            </span>
                        )}
                    </>
                );

                if (useLink && item.href) {
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            ref={(el) => {
                                tabRefs.current[index] = el;
                            }}
                            role="tab"
                            aria-selected={isActive}
                            aria-current={isActive ? "page" : undefined}
                            tabIndex={isActive ? 0 : -1}
                            onKeyDown={(e) => handleKeyDown(e, index, item.key)}
                            className={baseClasses}
                        >
                            {content}
                        </Link>
                    );
                }

                return (
                    <button
                        key={item.key}
                        type="button"
                        ref={(el) => {
                            tabRefs.current[index] = el;
                        }}
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onChange?.(item.key)}
                        onKeyDown={(e) => handleKeyDown(e, index, item.key)}
                        className={baseClasses}
                    >
                        {content}
                    </button>
                );
            })}
        </div>
    );
}
